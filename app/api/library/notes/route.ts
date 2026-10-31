import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveProvider } from "@/lib/ai/providers";
import { generateText } from "@/lib/ai/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODE_GUIDE: Record<string, string> = {
  detailed: "Comprehensive study notes with clear structure, headings, tables where helpful, and clinical correlations.",
  short: "Concise short notes — bullet points and key facts only.",
  long_answer: "A model long examination answer with introduction, body, and conclusion, structured for marks.",
  high_yield: "High-yield revision notes — only the most exam-relevant facts.",
};

export async function POST(req: Request) {
  let body: { documentId?: string; mode?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const documentId = body.documentId;
  const mode = body.mode ?? "detailed";
  if (!documentId || !(mode in MODE_GUIDE)) {
    return NextResponse.json({ error: "documentId and a valid mode are required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: doc } = await supabase
    .from("documents")
    .select("id,title,user_id,status")
    .eq("id", documentId)
    .eq("user_id", user.id)
    .single();
  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  if (doc.status !== "ready") {
    return NextResponse.json({ error: "This document has not finished processing yet." }, { status: 409 });
  }

  const provider = await resolveProvider(user.id);
  if (!provider) {
    return NextResponse.json(
      { error: "No AI provider is configured.", code: "AI_NOT_CONFIGURED" },
      { status: 503 },
    );
  }

  // Pull the first N chunks in order (they are stored in reading order).
  const { data: chunks } = await supabase
    .from("document_chunks")
    .select("content,page,chunk_index")
    .eq("document_id", documentId)
    .eq("user_id", user.id)
    .order("chunk_index", { ascending: true })
    .limit(24);

  if (!chunks || chunks.length === 0) {
    return NextResponse.json({ error: "This document has no searchable content." }, { status: 422 });
  }

  const sourceText = (chunks as { content: string; page: number | null; chunk_index: number }[])
    .map((c) => (c.page != null ? `[p.${c.page}]\n${c.content}` : c.content))
    .join("\n\n---\n\n");

  const messages = [
    {
      role: "system" as const,
      content:
        "You are MedCoach AI, a medical education assistant that converts uploaded study material into structured notes. " +
        "Stay faithful to the source material. Do not invent facts or citations. Flag anything unclear. " +
        "Educational tool only — not clinical advice. Produce clean Markdown.",
    },
    {
      role: "user" as const,
      content: `Generate ${MODE_GUIDE[mode]}\n\nSource material (untitled document):\n\n${sourceText.slice(0, 28000)}`,
    },
  ];

  let result;
  try {
    result = await generateText(provider, messages, { maxTokens: 1800, temperature: 0.3 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "AI generation failed" },
      { status: 502 },
    );
  }

  if (!result.text.trim()) {
    return NextResponse.json({ error: "The AI returned an empty response." }, { status: 502 });
  }

  const title = `${doc.title} — ${mode.replace("_", " ")} notes`;
  const { data: note, error } = await supabase
    .from("notes")
    .insert({
      user_id: user.id,
      document_id: documentId,
      title,
      mode,
      content: result.text.trim(),
      model: provider.model,
    })
    .select("*")
    .single();

  if (error || !note) {
    return NextResponse.json({ error: "Could not save the note" }, { status: 500 });
  }

  return NextResponse.json({ note });
}
