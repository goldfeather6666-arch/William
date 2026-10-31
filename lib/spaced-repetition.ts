/**
 * MedCoach spaced-repetition scheduler.
 *
 * This is a stable, deterministic, FSRS-style scheduler (three states:
 * new → learning → review ↔ relearning; four ratings 1–4). It implements the
 * same shape as FSRS v4 — a difficulty term with mean reversion and a stability
 * term updated multi-plicatively by rating, producing exponentially growing
 * intervals — but uses a compact, documented parameter set rather than the
 * upstream FSRS parameter table. It is intentionally pure so it can be unit
 * tested and used in both route handlers and server actions.
 */

export type ReviewRating = 1 | 2 | 3 | 4;

export type CardState = "new" | "learning" | "review" | "relearning";

export interface SchedulerInput {
  state: CardState;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
}

export interface SchedulerOutput {
  state: CardState;
  stability: number;
  difficulty: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
}

/** Default FSRS-style weights. index 0 = again, 3 = easy. */
const STABILITY_GROWTH: Record<ReviewRating, number> = { 1: 0.5, 2: 1.1, 3: 1.7, 4: 2.3 };

const MIN_STABILITY = 0.1;
const MIN_INTERVAL_DAYS = 1;
const MAX_INTERVAL_DAYS = 3650;

/** Initial stability for a brand-new card rated "Good". */
const INITIAL_STABILITY = 1.6;
/** Initial difficulty for a new card. */
const INITIAL_DIFFICULTY = 5.0;
/** Mean-reversion difficulty drift per step (harder on Again, easier on Easy). */
const DIFFICULTY_STEP = 2.6;
/** Pull new difficulty back toward the mean to avoid runaway values. */
const MEAN_REVERSION = 0.6;
const DIFFICULTY_MEAN = 5.0;
const DIFFICULTY_MIN = 1.0;
const DIFFICULTY_MAX = 10.0;

/** Fraction added to the interval when a card transitions out of learning. */
const LEARNING_GRADUATE_FACTOR = 0.35;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function nextDifficulty(current: number, rating: ReviewRating): number {
  const target = current - DIFFICULTY_STEP * (rating - 3);
  const reverted = MEAN_REVERSION * target + (1 - MEAN_REVERSION) * DIFFICULTY_MEAN;
  return clamp(reverted, DIFFICULTY_MIN, DIFFICULTY_MAX);
}

/** Stability growth scaled by difficulty: harder cards grow more slowly. */
function scaledGrowth(difficulty: number, rating: ReviewRating): number {
  const difficultyFactor = 1 - (difficulty - DIFFICULTY_MIN) / (DIFFICULTY_MAX - DIFFICULTY_MIN) * 0.4;
  return STABILITY_GROWTH[rating] * Math.max(0.4, difficultyFactor);
}

function intervalForStability(stability: number, difficulty: number, rating: ReviewRating): number {
  // Higher difficulty shortens the interval at the same stability.
  const difficultyPenalty = 1 - (difficulty - DIFFICULTY_MIN) / (DIFFICULTY_MAX - DIFFICULTY_MIN) * 0.3;
  const days = stability * difficultyPenalty;
  return Math.round(clamp(days, MIN_INTERVAL_DAYS, MAX_INTERVAL_DAYS));
}

/**
 * Step the scheduler for a single review.
 *
 * The state machine mirrors FSRS/Anki conventions:
 * - new: first review. Again → learning; Good/Easy → learning (with a short
 *   interval); we graduate to review after learning is stabilised.
 * - learning: Again stays in learning; Good/Easy graduate to review.
 * - review: Again → relearning; otherwise stays in review.
 * - relearning: Again stays in relearning; Good/Easy return to review.
 */
export function scheduleReview(input: SchedulerInput, rating: ReviewRating): SchedulerOutput {
  const { state, lapses, reps } = input;
  // Starting values carry over unless this is a brand-new card.
  let stability = input.stability > 0 ? input.stability : INITIAL_STABILITY;
  let difficulty = input.difficulty > 0 ? input.difficulty : INITIAL_DIFFICULTY;

  if (state === "new") {
    // First review. If it was failed, start modest; otherwise grant the initial
    // stability and let it graduate through learning.
    stability = rating === 1 ? Math.max(MIN_STABILITY, INITIAL_STABILITY * 0.4) : INITIAL_STABILITY;
    difficulty = INITIAL_DIFFICULTY;
  }

  difficulty = nextDifficulty(difficulty, rating);
  const growth = scaledGrowth(difficulty, rating);

  let nextState: CardState = state;
  let nextLapses = lapses;

  switch (state) {
    case "new":
    case "learning": {
      if (rating === 1) {
        nextState = "learning";
        stability = Math.max(MIN_STABILITY, stability * STABILITY_GROWTH[1] * 0.5);
        nextLapses += 1;
      } else {
        // Good/Easy graduate to review.
        nextState = "review";
        stability = stability * growth;
        if (rating === 2) {
          stability = Math.max(stability, INITIAL_STABILITY * 1.1);
        } else if (rating === 4) {
          stability = Math.max(stability, INITIAL_STABILITY * 1.5);
        }
      }
      break;
    }
    case "review": {
      if (rating === 1) {
        nextState = "relearning";
        stability = Math.max(MIN_STABILITY, stability * STABILITY_GROWTH[1]);
        nextLapses += 1;
      } else {
        nextState = "review";
        stability = Math.max(stability * growth, MIN_STABILITY);
      }
      break;
    }
    case "relearning": {
      if (rating === 1) {
        stability = Math.max(MIN_STABILITY, stability * STABILITY_GROWTH[1] * 0.6);
        nextLapses += 1;
      } else {
        nextState = "review";
        stability = Math.max(stability * growth * (rating === 4 ? 1.2 : 1), MIN_STABILITY);
      }
      break;
    }
  }

  const scheduledDays = intervalForStability(stability, difficulty, rating);
  return {
    state: nextState,
    stability: Number(stability.toFixed(3)),
    difficulty: Number(difficulty.toFixed(3)),
    scheduledDays,
    reps: reps + 1,
    lapses: nextLapses,
  };
}
