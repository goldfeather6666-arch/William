"use client";

import * as React from "react";
import { toast } from "sonner";
import { FileText, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { safeErrorMessage } from "@/lib/utils";
import type { DocumentRow } from "@/lib/types";

const NOTE_MODES = [
  { value: "detailed", label: "Detailed notes" },
  { value: "short", label: "Short notes" },
  { value: "long_answer", label: "Long exam answer" },
  { value: "high_yield", label: "High-yield revision" },
] as const;

export function GenerateNotesDialog({ doc }: { doc: DocumentRow }) {
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<string>("detailed");
  const [busy, setBusy] = React.useState(false);
  const [note, setNote] = React.useState<{ title: string; content: string } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setNote(null);
      setError(null);
    }
  }, [open]);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/library/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: doc.id, mode }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; code?: string; note?: { title: string; content: string } };
      if (!res.ok) {
        let message = data.error ?? "Generation failed";
        if (data.code === "AI_NOT_CONFIGURED") {
          message = "No AI provider is configured yet. Add a provider key in Settings, or ask an administrator.";
        }
        setError(message);
        return;
      }
      setNote(data.note ?? null);
      toast.success("Notes generated");
    } catch (err) {
      setError(safeErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Generate notes" disabled={doc.status !== "ready"}>
          <Sparkles className="h-4 w-4 text-primary" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate notes</DialogTitle>
          <DialogDescription>
            {doc.title} — AI summarises the processed text into structured notes.
          </DialogDescription>
        </DialogHeader>

        {doc.status !== "ready" ? (
          <p className="text-sm text-muted-foreground">
            This document has not finished processing yet (status: {doc.status}). Please try again in a moment.
          </p>
        ) : note ? (
          <div className="space-y-3">
            <Badge variant="soft" className="w-fit">
              <FileText className="mr-1 h-3 w-3" /> {note.title}
            </Badge>
            <pre className="max-h-[50vh] overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-muted/30 p-4 text-sm leading-relaxed">
              {note.content}
            </pre>
            <p className="text-xs text-muted-foreground">
              AI-generated educational notes — check against authoritative sources before relying on them.
            </p>
            <DialogFooter>
              <Button onClick={() => setOpen(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={generate} className="space-y-4">
            {error && <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}
            <div className="space-y-2">
              <label className="text-sm font-medium">Note style</label>
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NOTE_MODES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={busy}>
                {busy ? (
                  <>
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" /> Generating…
                  </>
                ) : (
                  "Generate"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
