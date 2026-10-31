import { describe, expect, it } from "vitest";
import { scheduleReview, type SchedulerInput } from "@/lib/spaced-repetition";

const base: SchedulerInput = {
  state: "new",
  stability: 0,
  difficulty: 0,
  elapsedDays: 0,
  scheduledDays: 0,
  reps: 0,
  lapses: 0,
};

describe("spaced-repetition scheduler", () => {
  it("graduates a Good review from new to review with an interval", () => {
    const out = scheduleReview(base, 3);
    expect(out.state).toBe("review");
    expect(out.reps).toBe(1);
    expect(out.scheduledDays).toBeGreaterThanOrEqual(1);
    expect(out.stability).toBeGreaterThan(0);
    expect(out.difficulty).toBeGreaterThan(0);
  });

  it("keeps an Again review in learning and grows lapses", () => {
    const out = scheduleReview(base, 1);
    expect(out.state).toBe("learning");
    expect(out.lapses).toBe(1);
  });

  it("moves a failed review card to relearning", () => {
    const review: SchedulerInput = { ...base, state: "review", stability: 10, difficulty: 5 };
    const out = scheduleReview(review, 1);
    expect(out.state).toBe("relearning");
    expect(out.lapses).toBe(1);
    expect(out.stability).toBeLessThan(10);
  });

  it("returns a failed relearning card to review on Good", () => {
    const relearning: SchedulerInput = { ...base, state: "relearning", stability: 2, difficulty: 6, lapses: 1 };
    const out = scheduleReview(relearning, 3);
    expect(out.state).toBe("review");
  });

  it("grows intervals across successive Good reviews", () => {
    let input = base;
    let prev = 0;
    for (let i = 0; i < 5; i++) {
      const out = scheduleReview(input, 3);
      expect(out.scheduledDays).toBeGreaterThanOrEqual(prev);
      prev = out.scheduledDays;
      input = { ...input, state: out.state, stability: out.stability, difficulty: out.difficulty, reps: out.reps };
    }
    expect(prev).toBeGreaterThan(1);
  });

  it("keeps difficulty within bounds across extreme ratings", () => {
    for (let i = 0; i < 20; i++) {
      const outA = scheduleReview({ ...base, state: "review", stability: 5, difficulty: 3 }, 1);
      const outB = scheduleReview({ ...base, state: "review", stability: 5, difficulty: 9 }, 4);
      expect(outA.difficulty).toBeGreaterThanOrEqual(1);
      expect(outA.difficulty).toBeLessThanOrEqual(10);
      expect(outB.difficulty).toBeGreaterThanOrEqual(1);
      expect(outB.difficulty).toBeLessThanOrEqual(10);
    }
  });
});
