import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scheduleReview, type ReviewRating, type SchedulerInput } from "@/lib/spaced-repetition";
import type { Flashcard } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { cardId?: string; rating?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rating = body.rating as ReviewRating | undefined;
  if (!body.cardId || !rating || ![1, 2, 3, 4].includes(rating)) {
    return NextResponse.json({ error: "cardId and a rating (1–4) are required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: card } = await supabase
    .from("flashcards")
    .select("*")
    .eq("id", body.cardId)
    .eq("user_id", user.id)
    .single();
  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const c = card as Flashcard;
  const last = c.last_reviewed_at ? new Date(c.last_reviewed_at) : null;
  const elapsedDays = last ? Math.max(0, Math.round((Date.now() - last.getTime()) / 86_400_000)) : c.elapsed_days;

  const input: SchedulerInput = {
    state: c.state,
    stability: c.stability,
    difficulty: c.difficulty_fsrs,
    elapsedDays,
    scheduledDays: c.scheduled_days,
    reps: c.reps,
    lapses: c.lapses,
  };

  const out = scheduleReview(input, rating);

  const now = new Date().toISOString();
  const dueAt = new Date(Date.now() + out.scheduledDays * 86_400_000).toISOString();

  const { error: updateError } = await supabase
    .from("flashcards")
    .update({
      state: out.state,
      stability: out.stability,
      difficulty_fsrs: out.difficulty,
      elapsed_days: elapsedDays,
      scheduled_days: out.scheduledDays,
      reps: out.reps,
      lapses: out.lapses,
      due_at: dueAt,
      last_reviewed_at: now,
    })
    .eq("id", c.id);

  if (updateError) {
    return NextResponse.json({ error: "Could not update card" }, { status: 500 });
  }

  const { error: reviewError } = await supabase.from("flashcard_reviews").insert({
    card_id: c.id,
    user_id: user.id,
    rating,
    state: out.state,
    scheduled_days: out.scheduledDays,
    stability: out.stability,
    difficulty: out.difficulty,
    reviewed_at: now,
  });

  if (reviewError) {
    return NextResponse.json({ error: "Could not record review" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, nextDueAt: dueAt });
}
