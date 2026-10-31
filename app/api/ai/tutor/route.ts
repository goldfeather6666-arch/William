import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveProvider } from "@/lib/ai/providers";
import { generateText, type ChatMessage } from "@/lib/ai/client";
import { embedLocal, cosineSimilarity } from "@/lib/ai/embed";
import type { TutorMode, Citation } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function systemPrompt(mode: TutorMode): string {
  const base =
    "You are MedCoach AI, an educational medical tutor. You help medical students understand, memorize and practice. " +
    "You are NOT a diagnostic or treatment tool. Distinguish established facts from explanations, flag uncertainty clearly, " +
    "prefer authoritative medical sources, and never fabricate citations. Make clear this does not replace professional judgment.";

  const modeGuide: Record<TutorMode, string> = {
    beginner: "Explain as if to a beginner: plain language, analogies, zero assumed jargon.",
    mbbs_exam: "Answer like a model MBBS examination answer with keywords, structure and marks.",
    detailed: "Give a detailed medical explanation: mechanisms, classifications, clinical correlation.",
    clinical: "Emphasise bedside reasoning, red flags and management pathways; be explicit about clinical uncertainty.",
    quick_revision: "Give high-yield revision facts only, concise, before a test.",
    viva: "Act as a professor in a viva: ask probing follow-up questions, one at a time, and evaluate the answer's structure.",
  };

  return `${base} ${modeGuide[mode] ?? modeGuide.detailed}`;
}

function titleFromContent(content: string): string {
  const t = content.trim().replace(/\s+/g, " ");
  return t.length > 48 ? `${t.slice(0, 48)}…` : t || "New conversation";
}

export async function POST(req: Request) {
  let body: { conversationId?: string; mode?: TutorMode; content?: string; documentId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const content = body.content?.trim();
  if (!content) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }
  const mode: TutorMode = body.mode ?? "detailed";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const provider = await resolveProvider(user.id);
  if (!provider) {
    return NextResponse.json(
      { error: "No AI provider is configured. Ask an administrator to set a provider key.", code: "AI_NOT_CONFIGURED" },
      { status: 503 },
    );
  }

  // Resolve conversation.
  let conversationId = body.conversationId;
  if (conversationId) {
    const { data: conv } = await supabase
      .from("ai_conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!conv) conversationId = undefined;
  }
  if (!conversationId) {
    const { data: created, error: convErr } = await supabase
      .from("ai_conversations")
      .insert({ user_id: user.id, title: titleFromContent(content), mode, document_id: body.documentId ?? null })
      .select("id")
      .single();
    if (convErr || !created) {
      return NextResponse.json({ error: "Could not create conversation" }, { status: 500 });
    }
    conversationId = created.id;
  }

  // Persist user message.
  await supabase.from("ai_messages").insert({
    conversation_id: conversationId,
    user_id: user.id,
    role: "user",
    content,
  });

  // Load history (system excluded).
  const { data: historyRows } = await supabase
    .from("ai_messages")
    .select("role,content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(24);

  const history: ChatMessage[] = (historyRows ?? []).map((m) => ({
    role: m.role as ChatMessage["role"],
    content: m.content,
  }));
  const historyForModel = history.slice(-16);

  // Optional RAG over the user's own document chunks.
  let ragContext = "";
  let citations: Citation[] = [];
  if (body.documentId) {
    const { data: chunks } = await supabase
      .from("document_chunks")
      .select("content,page,embedding")
      .eq("document_id", body.documentId)
      .eq("user_id", user.id)
      .not("embedding", "is", null)
      .limit(200);
    if (chunks && chunks.length > 0) {
      const q = embedLocal(content);
      const ranked = chunks
        .map((c) => ({ c, score: cosineSimilarity(q, (c.embedding as number[]) ?? []) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
      if (ranked.length > 0) {
        ragContext = ranked
          .map((r, i) => `[source ${i + 1}] ${r.c.content}`)
          .join("\n\n");
        const { data: doc } = await supabase.from("documents").select("id,title").eq("id", body.documentId).single();
        citations = ranked.map((r) => ({
          documentId: body.documentId as string,
          title: doc?.title ?? "Uploaded document",
          page: (r.c.page as number | null) ?? null,
        }));
      }
    }
  }

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt(mode) },
    ...(ragContext
      ? [
          {
            role: "system" as const,
            content:
              "Use the following excerpts from the student's uploaded material to answer when relevant. Cite the [source N] labels.\n\n" +
              ragContext,
          },
        ]
      : []),
    ...historyForModel,
  ];

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          // client gone
        }
      };

      let fullText = "";
      try {
        if (provider.behavior === "openai") {
          const res = await fetch(`${provider.baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${provider.apiKey}`,
            },
            body: JSON.stringify({
              model: provider.model,
              messages,
              temperature: 0.4,
              stream: true,
            }),
            signal: AbortSignal.timeout(180_000),
          });
          if (!res.ok) {
            const raw = await res.text();
            let message = `Provider error (${res.status})`;
            try {
              const j = JSON.parse(raw) as { error?: { message?: string } };
              if (j.error?.message) message = j.error.message;
            } catch {
              /* ignore */
            }
            send("error", { message });
            controller.close();
            return;
          }
          const reader = res.body!.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data:")) continue;
              const payload = trimmed.slice(5).trim();
              if (payload === "[DONE]") continue;
              try {
                const json = JSON.parse(payload) as {
                  choices?: { delta?: { content?: string } }[];
                };
                const delta = json.choices?.[0]?.delta?.content;
                if (delta) {
                  fullText += delta;
                  send("delta", { text: delta });
                }
              } catch {
                /* ignore partial */
              }
            }
          }
        } else {
          // Anthropic: non-streaming fallback.
          const result = await generateText(provider, messages);
          fullText = result.text;
          if (fullText) send("delta", { text: fullText });
        }

        if (fullText.trim()) {
          await supabase.from("ai_messages").insert({
            conversation_id: conversationId as string,
            user_id: user.id,
            role: "assistant",
            content: fullText,
            citations: citations as unknown as never,
            model: provider.model,
          });
          await supabase
            .from("ai_conversations")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", conversationId);
        }
        send("done", { conversationId, citations });
      } catch (e) {
        const message = e instanceof Error ? e.message : "Streaming failed";
        fullText &&= "";
        send("error", { message });
        if (fullText.trim()) {
          await supabase.from("ai_messages").insert({
            conversation_id: conversationId as string,
            user_id: user.id,
            role: "assistant",
            content: fullText,
            citations: citations as unknown as never,
            model: provider.model,
          });
        }
      } finally {
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
    cancel() {
      // allow abort
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
