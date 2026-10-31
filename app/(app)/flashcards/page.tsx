"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Layers, Loader2, Plus, RotateCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { cn, safeErrorMessage } from "@/lib/utils";
import type { FlashcardDeck, Flashcard } from "@/lib/types";

type Deck = FlashcardDeck & { dueCount: number };

export default function FlashcardsPage() {
  const [decks, setDecks] = React.useState<Deck[]>([]);
  const [selectedDeck, setSelectedDeck] = React.useState<string>("");
  const [loading, setLoading] = React.useState(true);
  const [deckOpen, setDeckOpen] = React.useState(false);
  const [cardOpen, setCardOpen] = React.useState(false);
  const [deckTitle, setDeckTitle] = React.useState("");
  const [creatingDeck, setCreatingDeck] = React.useState(false);

  // review session
  const [queue, setQueue] = React.useState<Flashcard[]>([]);
  const [idx, setIdx] = React.useState(0);
  const [flipped, setFlipped] = React.useState(false);
  const [reviewing, setReviewing] = React.useState(false);
  const [reviewBusy, setReviewBusy] = React.useState(false);
  const [completed, setCompleted] = React.useState(0);

  async function load() {
    try {
      const supabase = createClient();
      const { data: decks } = await supabase
        .from("flashcard_decks")
        .select("*, flashcards!inner(id,user_id,due_at)")
        .order("created_at", { ascending: false });
      const now = new Date().toISOString();
      const enriched: Deck[] = ((decks as (FlashcardDeck & { flashcards: Pick<Flashcard, "id" | "user_id" | "due_at">[] })[]) ?? []).map(
        (d) => ({
          ...d,
          dueCount: d.flashcards.filter((c) => c.due_at <= now).length,
        }),
      );
      setDecks(enriched);
      if (!selectedDeck && enriched.length > 0) setSelectedDeck(enriched[0]!.id);
    } catch {
      // unconfigured
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createDeck(e: React.FormEvent) {
    e.preventDefault();
    if (!deckTitle.trim()) return;
    setCreatingDeck(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("flashcard_decks")
        .insert({ title: deckTitle.trim() })
        .select("id")
        .single();
      if (error) throw error;
      setDeckTitle("");
      setDeckOpen(false);
      toast.success("Deck created");
      setSelectedDeck((data as { id: string }).id);
      load();
    } catch (err) {
      toast.error(safeErrorMessage(err));
    } finally {
      setCreatingDeck(false);
    }
  }

  async function startReview() {
    if (!selectedDeck) return;
    setReviewing(true);
    setIdx(0);
    setFlipped(false);
    setCompleted(0);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("flashcards")
        .select("*")
        .eq("deck_id", selectedDeck)
        .lte("due_at", new Date().toISOString())
        .order("due_at", { ascending: true })
        .limit(50);
      setQueue(((data as Flashcard[]) ?? []).filter((c) => c.due_at <= new Date().toISOString()));
    } catch {
      toast.error("Could not load due cards");
      setReviewing(false);
    }
  }

  async function grade(rating: number) {
    if (reviewBusy) return;
    const card = queue[idx];
    if (!card) return;
    setReviewBusy(true);
    try {
      const res = await fetch("/api/flashcards/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: card.id, rating }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "Review failed");
      }
      setCompleted((c) => c + 1);
      setFlipped(false);
      if (idx + 1 >= queue.length) {
        toast.success("Session complete");
        setReviewing(false);
        load();
      } else {
        setIdx((i) => i + 1);
      }
    } catch (err) {
      toast.error(safeErrorMessage(err));
    } finally {
      setReviewBusy(false);
    }
  }

  const current = queue[idx]!;
  const visibleDecks = decks.filter((d) => d.dueCount > 0);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Flashcards</h1>
          <p className="text-sm text-muted-foreground">AI-generated or manual cards with spaced repetition.</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={deckOpen} onOpenChange={setDeckOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-1 h-4 w-4" /> New deck
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New deck</DialogTitle>
                <DialogDescription>Group cards by subject or chapter.</DialogDescription>
              </DialogHeader>
              <form onSubmit={createDeck} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="deck-title">Deck name</Label>
                  <Input id="deck-title" value={deckTitle} onChange={(e) => setDeckTitle(e.target.value)} placeholder="Cardiology — antiarrhythmics" />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={creatingDeck || !deckTitle.trim()}>
                    {creatingDeck ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null} Create deck
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <CreateCardDialog deckId={selectedDeck} decks={decks} onCreated={() => load()} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* deck list */}
        <aside className="space-y-2">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          ) : decks.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <Layers className="mx-auto h-6 w-6 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium">No decks yet</p>
                <p className="mt-1 text-xs text-muted-foreground">Create your first deck to get started.</p>
              </CardContent>
            </Card>
          ) : (
            decks.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDeck(d.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors",
                  selectedDeck === d.id
                    ? "border-primary/40 bg-primary-soft/50"
                    : "border-border bg-card hover:bg-muted/40",
                )}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{d.title}</p>
                  <p className="text-xs text-muted-foreground">{d.card_count} cards</p>
                </div>
                <Badge variant={d.dueCount > 0 ? "clinical" : "secondary"}>{d.dueCount} due</Badge>
              </button>
            ))
          )}
        </aside>

        {/* review area */}
        <section>
          {!reviewing ? (
            <Card className="flex min-h-[420px] flex-col items-center justify-center p-8 text-center">
              {!selectedDeck ? (
                <>
                  <Layers className="h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 font-medium">Select a deck to study</p>
                </>
              ) : (
                <>
                  <Badge variant="soft" className="mb-3">
                    {visibleDecks.find((d) => d.id === selectedDeck)?.dueCount ?? 0} cards due
                  </Badge>
                  <h2 className="font-display text-lg font-semibold">
                    {decks.find((d) => d.id === selectedDeck)?.title}
                  </h2>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    Review due cards now. Rate yourself honestly — the scheduler adjusts each card&apos;s next review.
                  </p>
                  <Button onClick={startReview} className="mt-6">
                    Start review
                  </Button>
                </>
              )}
            </Card>
          ) : queue.length === 0 ? (
            <Card className="flex min-h-[420px] flex-col items-center justify-center p-8 text-center">
              <p className="font-medium">No cards due in this deck</p>
              <p className="mt-1 text-sm text-muted-foreground">You are all caught up. Nice work.</p>
              <Button variant="outline" onClick={() => setReviewing(false)} className="mt-4">
                Back
              </Button>
            </Card>
          ) : (
            <div className="flex min-h-[420px] flex-col">
              <div className="mb-3 flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Card {idx + 1} of {queue.length}
                </span>
                <span>
                  {completed} reviewed
                </span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id + (flipped ? "-f" : "")}
                  initial={{ opacity: 0, rotateY: flipped ? 90 : -10 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1"
                >
                  <button
                    onClick={() => setFlipped((f) => !f)}
                    className="h-full w-full rounded-2xl border border-border bg-card p-8 text-left shadow-subtle"
                  >
                    <span className="mb-4 inline-block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {flipped ? "Answer" : "Question"}
                    </span>
                    <p className="whitespace-pre-wrap text-lg leading-relaxed">
                      {flipped ? current.back || "—" : current.front}
                    </p>
                    {!flipped && (
                      <span className="mt-6 inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <RotateCcw className="h-3 w-3" /> Tap to flip
                      </span>
                    )}
                  </button>
                </motion.div>
              </AnimatePresence>

              <div className="mt-4 grid grid-cols-4 gap-2">
                <Button variant="destructive" disabled={!flipped || reviewBusy} onClick={() => grade(1)}>
                  Again
                </Button>
                <Button variant="outline" disabled={!flipped || reviewBusy} onClick={() => grade(2)}>
                  Hard
                </Button>
                <Button variant="secondary" disabled={!flipped || reviewBusy} onClick={() => grade(3)}>
                  Good
                </Button>
                <Button disabled={!flipped || reviewBusy} onClick={() => grade(4)}>
                  Easy
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function CreateCardDialog({
  deckId,
  decks,
  onCreated,
}: {
  deckId: string;
  decks: FlashcardDeck[];
  onCreated: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [front, setFront] = React.useState("");
  const [back, setBack] = React.useState("");
  const [difficulty, setDifficulty] = React.useState("medium");
  const [deck, setDeck] = React.useState(deckId || decks[0]?.id || "");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (open && !deck && decks[0]) setDeck(decks[0].id);
    if (open && deckId) setDeck(deckId);
  }, [open, deck, deckId, decks]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!front.trim() || !back.trim() || !deck) return;
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("flashcards").insert({
        deck_id: deck,
        front: front.trim(),
        back: back.trim(),
        difficulty,
        card_type: "basic",
        tags: [],
      });
      if (error) throw error;
      const { error: countErr } = await supabase
        .from("flashcard_decks")
        .update({ card_count: (decks.find((d) => d.id === deck)?.card_count ?? 0) + 1 })
        .eq("id", deck);
      if (countErr) throw countErr;
      setFront("");
      setBack("");
      setOpen(false);
      toast.success("Card added");
      onCreated();
    } catch (err) {
      toast.error(safeErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-1 h-4 w-4" /> New card
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New flashcard</DialogTitle>
          <DialogDescription>Question on the front, answer on the back.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label>Deck</Label>
            <Select value={deck} onValueChange={setDeck}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {decks.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="front">Question</Label>
            <Textarea id="front" value={front} onChange={(e) => setFront(e.target.value)} rows={3} placeholder='e.g. "What is the first-line treatment for stable angina?"' />
          </div>
          <div className="space-y-2">
            <Label htmlFor="back">Answer</Label>
            <Textarea id="back" value={back} onChange={(e) => setBack(e.target.value)} rows={3} placeholder="e.g. Aspirin, statin, and sublingual GTN…" />
          </div>
          <div className="space-y-2">
            <Label>Difficulty</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={busy || !front.trim() || !back.trim() || !deck}>
              {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null} Add card
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
