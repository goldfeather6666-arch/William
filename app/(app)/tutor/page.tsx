"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Loader2, Sparkles, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TUTOR_MODES, type TutorMode, type Citation } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string; citations?: Citation[]; pending?: boolean };

type DocOption = { id: string; title: string };

async function readStream(res: Response, onDelta: (text: string) => void, onDone: (citations: Citation[]) => void, onError: (message: string) => void) {
  if (!res.body) throw new Error("No response body");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let event = "";
  let data = "";
  let citations: Citation[] = [];

  const flush = () => {
    if (event === "delta") {
      try {
        onDelta((JSON.parse(data) as { text: string }).text);
      } catch {
        /* ignore */
      }
    } else if (event === "done") {
      try {
        citations = (JSON.parse(data) as { citations: Citation[] }).citations ?? [];
      } catch {
        /* ignore */
      }
    } else if (event === "error") {
      try {
        onError((JSON.parse(data) as { message: string }).message);
      } catch {
        /* ignore */
      }
    }
    event = "";
    data = "";
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (line.startsWith("event:")) {
        event = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        data = line.slice(5).trim();
      } else if (line.trim() === "") {
        flush();
      }
    }
  }
  flush();
  onDone(citations);
}

export default function TutorPage() {
  const [mode, setMode] = React.useState<TutorMode>("detailed");
  const [input, setInput] = React.useState("");
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [docs, setDocs] = React.useState<DocOption[]>([]);
  const [docId, setDocId] = React.useState<string>("");
  const [convId, setConvId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    async function init() {
      try {
        const supabase = createClient();
        const { data: d } = await supabase
          .from("documents")
          .select("id,title")
          .eq("status", "ready")
          .order("created_at", { ascending: false })
          .limit(20);
        if (active) setDocs((d as DocOption[]) ?? []);
        // Load the most recent conversation to continue where the student left off.
        const { data: last } = await supabase
          .from("ai_conversations")
          .select("id")
          .order("updated_at", { ascending: false })
          .limit(1);
        if (active && last?.[0]) {
          setConvId((last[0] as { id: string }).id);
          const { data: msgs } = await supabase
            .from("ai_messages")
            .select("role,content,citations")
            .eq("conversation_id", (last[0] as { id: string }).id)
            .order("created_at", { ascending: true })
            .limit(50);
          if (active && msgs) {
            setMessages(
              (msgs as { role: Msg["role"]; content: string; citations?: Citation[] }[]).map((m) => ({
                role: m.role,
                content: m.content,
                citations: m.citations ?? [],
              })),
            );
          }
        }
      } catch {
        // unconfigured — chat will show the setup state on send
      }
    }
    init();
    return () => {
      active = false;
    };
  }, []);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setError(null);
    setMessages((prev) => [
      ...prev,
      { role: "user", content: text },
      { role: "assistant", content: "", pending: true },
    ]);
    setLoading(true);

    let streamingText = "";
    const updateAssistant = (delta: string) => {
      streamingText += delta;
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.role === "assistant") {
          next[next.length - 1] = { ...last, content: streamingText, pending: false };
        }
        return next;
      });
    };

    try {
      const res = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: convId ?? undefined,
          mode,
          content: text,
          documentId: docId || undefined,
        }),
      });

      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string; code?: string };
        let message = j.error ?? "Request failed";
        if (j.code === "AI_NOT_CONFIGURED") {
          message = "No AI provider is configured yet. Add a provider key in Settings (or ask an administrator) before chatting.";
        }
        setError(message);
        setMessages((prev) => prev.slice(0, -1));
        setLoading(false);
        return;
      }

      await readStream(
        res,
        updateAssistant,
        (citations) => {
          setConvId((prev) => prev); // server owns conversation id; keep state
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last && last.role === "assistant" && citations.length) {
              next[next.length - 1] = { ...last, citations };
            }
            return next;
          });
        },
        (message) => {
          setError(message);
          setMessages((prev) => prev.slice(0, -1));
        },
      );
    } catch {
      setError("Failed to reach the tutor service.");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-4xl flex-col">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold">AI Medical Tutor</h1>
          <p className="text-sm text-muted-foreground">Ask anything — pick a mode for the way you want the answer.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select value={mode} onValueChange={(v) => setMode(v as TutorMode)}>
            <SelectTrigger className="w-full sm:w-56" aria-label="Tutor mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TUTOR_MODES.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={docId} onValueChange={setDocId}>
            <SelectTrigger className="w-full sm:w-52" aria-label="Context document">
              <SelectValue placeholder="Context: none" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No document context</SelectItem>
              {docs.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="flex min-h-0 flex-1 flex-col">
        <CardContent className="flex min-h-0 flex-1 flex-col p-0">
          <div className="flex-1 space-y-4 overflow-y-auto p-5 scrollbar-slim">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                  <Sparkles className="h-5 w-5" />
                </span>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Explain a mechanism, compare two drugs, or ask for a model MBBS answer. Answers are educational and
                  should be checked against your course materials.
                </p>
              </div>
            )}
            <AnimatePresence initial={false}>
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}
                >
                  {m.role === "assistant" && (
                    <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                      <Sparkles className="h-4 w-4" />
                    </span>
                  )}
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "surface-inset rounded-bl-md",
                    )}
                  >
                    {m.pending ? (
                      <span className="inline-flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
                      </span>
                    ) : (
                      <>
                        <span className="whitespace-pre-wrap">{m.content || (m.role === "assistant" ? "No response generated." : "")}</span>
                        {m.citations && m.citations.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {m.citations.map((c, ci) => (
                              <Badge key={ci} variant="soft" className="text-[11px]">
                                {c.title} {c.page != null ? `· p.${c.page}` : ""}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  {m.role === "user" && (
                    <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <User className="h-4 w-4" />
                    </span>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>

          <div className="border-t border-border p-3">
            <div className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder={`Ask the tutor… (${TUTOR_MODES.find((m) => m.value === mode)?.label})`}
                className="max-h-40 min-h-[52px] flex-1 resize-none"
                rows={1}
              />
              <Button onClick={send} disabled={loading || !input.trim()} size="icon" aria-label="Send">
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
              <Label className="text-inherit">Educational use only.</Label> Al answers are AI-generated and should be checked against authoritative sources.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
