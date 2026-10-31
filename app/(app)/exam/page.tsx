"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  RotateCcw,
  Timer,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn, safeErrorMessage } from "@/lib/utils";
import type { McqQuestion } from "@/lib/types";

type Phase = "setup" | "quiz" | "summary";

const DIFFICULTIES = ["easy", "medium", "hard"] as const;
const COUNTS = [5, 10, 15, 20] as const;
const EXAM_KINDS = [
  { value: "mcq", label: "MCQ" },
  { value: "saq", label: "SAQ" },
  { value: "laq", label: "LAQ" },
  { value: "mixed", label: "Mixed" },
] as const;
const PER_QUESTION_SECONDS = 60;

interface PickedQuestion {
  question: McqQuestion;
  examQuestionId: string | null;
}

function optionLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

export default function ExamPage() {
  const [phase, setPhase] = React.useState<Phase>("setup");
  const [topics, setTopics] = React.useState<string[]>([]);
  const [topic, setTopic] = React.useState<string>("all");
  const [difficulty, setDifficulty] = React.useState<string>("all");
  const [count, setCount] = React.useState<number>(10);
  const [kind, setKind] = React.useState<string>("mcq");
  const [title, setTitle] = React.useState<string>("");
  const [timed, setTimed] = React.useState(false);

  const [picked, setPicked] = React.useState<PickedQuestion[]>([]);
  const [idx, setIdx] = React.useState(0);
  const [answers, setAnswers] = React.useState<(number | null)[]>([]);
  const [secondsLeft, setSecondsLeft] = React.useState(PER_QUESTION_SECONDS);
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    async function loadTopics() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("mcq_questions")
          .select("topic")
          .not("topic", "is", null);
        const seen = new Set<string>();
        for (const row of (data as { topic: string }[]) ?? []) {
          if (row.topic) seen.add(row.topic);
        }
        setTopics(Array.from(seen).sort());
      } catch {
        // unconfigured
      }
    }
    loadTopics();
  }, []);

  React.useEffect(() => {
    if (phase !== "quiz" || !timed || secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timed, secondsLeft]);

  React.useEffect(() => {
    if (phase !== "quiz" || !timed || secondsLeft > 0) return;
    if (idx + 1 < picked.length) {
      setIdx((i) => i + 1);
      setSecondsLeft(PER_QUESTION_SECONDS);
    } else {
      submit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, phase, timed]);

  async function start() {
    setSubmitting(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("Please sign in to take an exam.");

      let q = supabase.from("mcq_questions").select("*");
      if (topic !== "all") q = q.eq("topic", topic);
      if (difficulty !== "all") q = q.eq("difficulty", difficulty);
      const { data, error } = await q.limit(200);
      if (error) throw error;

      const all = ((data as McqQuestion[]) ?? []).slice();
      // Fisher–Yates shuffle
      for (let i = all.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [all[i], all[j]] = [all[j]!, all[i]!];
      }
      const chosen = all.slice(0, Math.min(count, all.length));
      if (chosen.length === 0) {
        toast.error("No questions match those filters. Try broadening them.");
        return;
      }

      const kindLabel = EXAM_KINDS.find((k) => k.value === kind)?.label ?? "Exam";
      const finalTitle = title.trim() || `${kindLabel} Exam`;

      const { data: sessData, error: sessError } = await supabase
        .from("exam_sessions")
        .insert({
          user_id: user.id,
          title: finalTitle,
          kind,
          status: "in_progress",
          question_count: chosen.length,
          config: { topic, difficulty },
        })
        .select("id")
        .single();
      if (sessError) throw sessError;
      const sid = (sessData as { id: string }).id;

      const eqRows = chosen.map((qRow, i) => ({
        session_id: sid,
        position: i + 1,
        kind: "mcq",
        prompt: qRow.stem,
        options: qRow.options,
        correct_index: qRow.correct_index,
        model_answer: qRow.explanation,
        points: 1,
      }));
      const { data: eqData, error: eqError } = await supabase
        .from("exam_questions")
        .insert(eqRows)
        .select("id, position");
      if (eqError) throw eqError;

      const posToId = new Map<number, string>();
      for (const row of (eqData as { id: string; position: number }[]) ?? []) {
        posToId.set(row.position, row.id);
      }
      const pickedList: PickedQuestion[] = chosen.map((qRow, i) => ({
        question: qRow,
        examQuestionId: posToId.get(i + 1) ?? null,
      }));

      setPicked(pickedList);
      setAnswers(Array(pickedList.length).fill(null) as (number | null)[]);
      setSessionId(sid);
      setIdx(0);
      setSecondsLeft(PER_QUESTION_SECONDS);
      setPhase("quiz");
      toast.success(`Exam started — ${pickedList.length} questions`);
    } catch (e) {
      toast.error(safeErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  async function submit() {
    if (submitting || !sessionId) return;
    setSubmitting(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in to record your exam.");

      const total = picked.length;
      let correct = 0;
      for (let i = 0; i < total; i++) {
        const sel = answers[i];
        if (sel !== null && sel === picked[i]!.question.correct_index) correct++;
      }

      const answerRows = picked.map((p, i) => {
        const sel = answers[i];
        const isCorrect = sel !== null && sel === p.question.correct_index;
        return {
          session_id: sessionId,
          question_id: p.examQuestionId,
          selected_index: sel,
          awarded_points: isCorrect ? 1 : 0,
          is_ai_estimate: false,
        };
      });

      const attemptRows = picked.map((p, i) => {
        const sel = answers[i];
        return {
          user_id: user.id,
          question_id: p.question.id,
          selected_index: sel,
          is_correct: sel !== null && sel === p.question.correct_index,
          session_id: sessionId,
        };
      });

      const { error: updErr } = await supabase
        .from("exam_sessions")
        .update({
          status: "graded",
          submitted_at: new Date().toISOString(),
          score: correct,
          max_score: total,
        })
        .eq("id", sessionId);
      if (updErr) throw updErr;

      const { error: ansErr } = await supabase.from("exam_answers").insert(answerRows);
      if (ansErr) throw ansErr;

      const { error: attErr } = await supabase.from("question_attempts").insert(attemptRows);
      if (attErr) throw attErr;

      setPhase("summary");
    } catch (e) {
      toast.error(safeErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  function moveTo(index: number) {
    if (index < 0 || index >= picked.length) return;
    setIdx(index);
    setSecondsLeft(PER_QUESTION_SECONDS);
  }

  function choose(optionIndex: number) {
    setAnswers((prev) => {
      const next = prev.slice();
      next[idx] = optionIndex;
      return next;
    });
  }

  const current = picked[idx];
  const answeredCount = answers.filter((a) => a !== null).length;
  const score = picked.reduce(
    (acc, p, i) => acc + (answers[i] !== null && answers[i] === p.question.correct_index ? 1 : 0),
    0,
  );
  const percent = picked.length ? Math.round((score / picked.length) * 100) : 0;
  const passed = percent >= 60;

  function renderPalette(horizontal: boolean) {
    const base =
      "flex h-9 items-center justify-center rounded-md border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
    return picked.map((_p, i) => {
      const isCurrent = i === idx;
      const answered = answers[i] !== null;
      return (
        <button
          key={i}
          type="button"
          aria-label={`Go to question ${i + 1}`}
          onClick={() => moveTo(i)}
          className={cn(
            base,
            horizontal ? "w-9 shrink-0" : "w-full",
            isCurrent && "border-primary bg-primary text-primary-foreground shadow-sm",
            !isCurrent && answered && "border-primary/50 bg-primary-soft/50 text-foreground",
            !isCurrent && !answered && "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground",
          )}
        >
          {i + 1}
        </button>
      );
    });
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold">Mock Examination</h1>
        <p className="text-sm text-muted-foreground">
          Timed mock exams built from the verified MCQ bank.
        </p>
      </div>

      {phase === "setup" && (
        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="space-y-2">
              <Label>Exam title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Cardiology Mock Exam"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Topic</Label>
                <Select value={topic} onValueChange={setTopic}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All topics</SelectItem>
                    {topics.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All levels</SelectItem>
                    {DIFFICULTIES.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d[0]!.toUpperCase() + d.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Exam kind</Label>
                <Select value={kind} onValueChange={setKind}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXAM_KINDS.map((k) => (
                      <SelectItem key={k.value} value={k.value}>
                        {k.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Number of questions</Label>
                <div className="flex flex-wrap gap-2">
                  {COUNTS.map((c) => (
                    <Button
                      key={c}
                      type="button"
                      variant={count === c ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCount(c)}
                    >
                      {c}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Timed mode</p>
                  <p className="text-xs text-muted-foreground">
                    60 seconds per question — auto-advances when time runs out.
                  </p>
                </div>
              </div>
              <Switch checked={timed} onCheckedChange={setTimed} />
            </div>

            <Button onClick={start} disabled={submitting} className="w-full">
              {submitting ? "Preparing…" : "Start exam"}
            </Button>
          </CardContent>
        </Card>
      )}

      {phase === "quiz" && current && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Question {idx + 1} of {picked.length} · {answeredCount} answered
            </span>
            {timed ? (
              <Badge variant={secondsLeft <= 10 ? "destructive" : "soft"}>
                <Timer className="mr-1 h-3 w-3" />
                {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
              </Badge>
            ) : null}
          </div>

          {/* Mobile palette strip */}
          <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">{renderPalette(true)}</div>

          <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
            <div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.question.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.18 }}
                >
                  <Card>
                    <CardContent className="space-y-4 p-6">
                      <Badge variant="secondary" className="w-fit">
                        {current.question.topic || "General"} · {current.question.difficulty} ·{" "}
                        {current.question.is_clinical ? "clinical" : "knowledge"}
                      </Badge>
                      <p className="text-base leading-relaxed">{current.question.stem}</p>
                      <div className="space-y-2">
                        {current.question.options.map((opt, i) => {
                          const isSelected = answers[idx] === i;
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => choose(i)}
                              className={cn(
                                "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                                isSelected
                                  ? "border-primary bg-primary-soft/50"
                                  : "border-border bg-card hover:border-primary/50 hover:bg-muted/40",
                              )}
                            >
                              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-[11px] font-medium">
                                {optionLetter(i)}
                              </span>
                              <span className="flex-1">{opt}</span>
                              {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                            </button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatePresence>

              <div className="mt-4 flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => moveTo(idx - 1)}
                  disabled={idx === 0}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> Back
                </Button>
                <div className="flex gap-2">
                  {idx + 1 < picked.length ? (
                    <Button onClick={() => moveTo(idx + 1)}>
                      Next <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button onClick={submit} disabled={submitting}>
                      {submitting ? "Submitting…" : "Submit exam"}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <aside className="hidden lg:block">
              <Card>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <ListChecks className="h-4 w-4 text-muted-foreground" />
                    Question palette
                  </div>
                  <div className="grid grid-cols-4 gap-2">{renderPalette(false)}</div>
                  <p className="text-xs text-muted-foreground">
                    {answeredCount} of {picked.length} answered
                  </p>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      )}

      {phase === "quiz" && !current && (
        <Card>
          <CardContent className="py-10">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-2/3" />
          </CardContent>
        </Card>
      )}

      {phase === "summary" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          <Card>
            <CardContent className="space-y-5 p-6">
              <div className="text-center">
                <p className="font-display text-4xl font-semibold">
                  {score}/{picked.length}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{percent}% correct</p>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary transition-all" style={{ width: `${percent}%` }} />
              </div>
              <div
                className={cn(
                  "rounded-lg border p-4 text-sm",
                  passed ? "border-primary/40 bg-primary-soft/30" : "border-destructive/40 bg-destructive/5",
                )}
              >
                {passed
                  ? "Pass — you have cleared this mock exam. Review any missed questions below."
                  : "Retry — you did not reach the 60% pass mark. Re-read the explanations and try again."}
                {" "}Your score and attempts are recorded in your dashboard.
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setPhase("setup")} className="flex-1">
                  <RotateCcw className="mr-1 h-4 w-4" /> New exam
                </Button>
                <Button variant="outline" onClick={start} className="flex-1">
                  Retry same set
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-6">
              <h2 className="font-display text-lg font-semibold">Answer review</h2>
              {picked.map((p, i) => {
                const chosen = answers[i];
                const correct = p.question.correct_index;
                const isCorrect = chosen !== null && chosen === correct;
                return (
                  <motion.div
                    key={p.question.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn(
                      "space-y-2 rounded-xl border p-4",
                      isCorrect ? "border-primary/40 bg-primary-soft/20" : "border-destructive/40 bg-destructive/5",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {isCorrect ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      ) : (
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">Question {i + 1}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">{p.question.stem}</p>
                      </div>
                    </div>
                    <div className="grid gap-1 pl-6 text-sm">
                      <p className="text-muted-foreground">
                        Your answer:{" "}
                        <span className={cn("font-medium", isCorrect ? "text-primary" : "text-destructive")}>
                          {chosen !== null && chosen !== undefined ? `${optionLetter(chosen)} — ${p.question.options[chosen] ?? ""}` : "Unanswered"}
                        </span>
                      </p>
                      {!isCorrect && (
                        <p>
                          Correct answer:{" "}
                          <span className="font-medium text-primary">
                            {optionLetter(correct)} — {p.question.options[correct] ?? ""}
                          </span>
                        </p>
                      )}
                    </div>
                    <p className="pl-6 text-xs leading-relaxed text-muted-foreground">
                      {p.question.explanation}
                    </p>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
