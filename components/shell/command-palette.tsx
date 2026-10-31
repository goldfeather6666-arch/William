"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const commands: { label: string; href: string; keywords: string }[] = [
  { label: "Dashboard", href: "/dashboard", keywords: "home overview progress" },
  { label: "AI Tutor", href: "/tutor", keywords: "ask explain tutor ai" },
  { label: "Knowledge Library", href: "/library", keywords: "documents upload files pdf" },
  { label: "Notes", href: "/notes", keywords: "summarize generate notes" },
  { label: "Flashcards", href: "/flashcards", keywords: "cards spaced repetition fsrs" },
  { label: "MCQ Bank", href: "/mcq", keywords: "questions quiz practice" },
  { label: "Clinical Cases", href: "/cases", keywords: "simulation patients scenarios" },
];

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [index, setIndex] = React.useState(0);

  const filtered = query.trim()
    ? commands.filter((c) => `${c.label} ${c.keywords}`.toLowerCase().includes(query.toLowerCase()))
    : commands;

  React.useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  function go(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[20%] max-w-lg gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIndex(0);
            }}
            placeholder="Jump to a module…"
            className="h-12 border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
        <div className="max-h-72 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">No matches.</p>
          ) : (
            filtered.map((c, i) => (
              <button
                key={c.href}
                onMouseEnter={() => setIndex(i)}
                onClick={() => go(c.href)}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm",
                  i === index ? "bg-primary-soft text-primary" : "text-foreground",
                )}
              >
                <span>{c.label}</span>
                <span className="text-xs text-muted-foreground">↵</span>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
