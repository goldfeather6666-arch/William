"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { CheckCircle2, Timer, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

export default function PracticePage() {
  const [phase, setPhase] = React.useState<Phase>("setup");
  const [topics, setTopics] = React.useState<string[]>([]);
  const [topic, setTopic] = React.useState("all");
  const [difficulty, setDifficulty] = React.useState<string>("all");
  const [count, setCount] = React.useState<number>(10);
  const [timed, setTimed] = React.useState(true);

  const [questions, setQuestions] = React.useState<McqQuestion[]>([]);
  const [idx, setIdx] = React.useState(0);
  const [selected, setSelected] = React.useState<number | null>(null);
  const [answers, setAnswers] = React.useState<boolean[]>([]);
  const [secondsLeft, setSecondsLeft] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    async function loadTopics() {
      try {
        const supabase = createClient();
        const { data } = await supabase.from("mcq_questions").select("topic").not("topic", "is", null);
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
    if (phase === "quiz" && secondsLeft === 0 && timed) {
      finish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  async function start() {
    setSubmitting(true);
    try {
      const supabase = createClient();
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
      const picked = all.slice(0, Math.min(count, all.length));
      if (picked.length === 0) {
        toast.error("No questions match those filters. Try broadening them.");
        return;
      }
      setQuestions(picked);
      setAnswers([]);
      setIdx(0);
      setSelected(null);
      setSecondsLeft(timed ? picked.length * 60 : 0);
      setPhase("quiz");
    } catch (e) {
      toast.error(safeErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  async function recordAttempt(question: McqQuestion, correct: boolean) {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("question_attempts").insert({
        user_id: user.id,
        question_id: question.id,
        selected_index: selected,
        is_correct: correct,
        time_spent_seconds: timed ? 60 - Math.floor(secondsLeft % 60) : null,
      });
    } catch {
      // non-blocking
    }
  }

  async function choose(optionIndex: number) {
    if (selected !== null) return;
    const question = questions[idx];
    const correct = optionIndex === question.correct_index;
    setSelected(optionIndex);
    setAnswers((prev) => [...prev, correct]);
    await recordAttempt(question, correct);
  }

  async function next() {
    if (idx + 1 >= questions.length) {
      finish();
    } else {
      setIdx((i) => i + 1);
      setSelected(null);
    }
  }

  async function finish() {
    setPhase("summary");
  }

  const question = questions[idx];
  const score = answers.filter(Boolean).length;
  const accuracy = answers.length ? Math.round((score / answers.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold">MCQ Practice</h1>
        <p className="text-sm text-muted-foreground">Timed, single-best-answer questions with explanations of every option.</p>
      </div>

      {phase === "setup" && (
        <Card>
          <CardContent className="space-y-5 p-6">
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

            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Timed mode</p>
                  <p className="text-xs text-muted-foreground">60 seconds per question, auto-submit at the end.</p>
                </div>
              </div>
              <Switch checked={timed} onCheckedChange={setTimed} />
            </div>

            <Button onClick={start} disabled={submitting} className="w-full">
              {submitting ? "Preparing…" : "Start quiz"}
            </Button>
          </CardContent>
        </Card>
      )}

      {phase === "quiz" && question && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Question {idx + 1} of {questions.length}
            </span>
            {timed ? (
              <Badge variant={secondsLeft <= 60 ? "destructive" : "soft"}>
                <Timer className="mr-1 h-3 w-3" />
                {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
              </Badge>
            ) : null}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={question.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.18 }}
            >
              <Card>
                <CardContent className="space-y-4 p-6">
                  <Badge variant="secondary" className="w-fit">
                    {question.topic || "General"} · {question.difficulty} · {question.is_clinical ? "clinical" : "knowledge"}
                  </Badge>
                  <p className="text-base leading-relaxed">{question.stem}</p>
                  <div className="space-y-2">
                    {question.options.map((opt, i) => {
                      const isCorrectOption = i === question.correct_index;
                      const isSelected = i === selected;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => choose(i)}
                          disabled={selected !== null}
                          className={cn(
                            "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                            selected === null && "border-border bg-card hover:border-primary/50 hover:bg-muted/40",
                            isSelected && isCorrectOption && "border-primary bg-primary-soft/50",
                            isSelected && !isCorrectOption && "border-destructive bg-destructive/5",
                            selected !== null && isCorrectOption && "border-primary bg-primary-soft/40",
                            selected !== null && !isSelected && !isCorrectOption && "opacity-50",
                          )}
                        >
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-[11px] font-medium">
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="flex-1">{opt}</span>
                          {isSelected && isCorrectOption && <CheckCircle2 className="h-4 w-4 text-primary" />}
                          {isSelected && !isCorrectOption && <XCircle className="h-4 w-4 text-destructive" />}
                        </button>
                      );
                    })}
                  </div>

                  {selected !== null && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "rounded-xl border p-4 text-sm",
                        selected === question.correct_index
                          ? "border-primary/40 bg-primary-soft/30"
                          : "border-destructive/40 bg-destructive/5",
                      )}
                    >
                      <p className="font-medium">
                        {selected === question.correct_index ? "Correct." : "Not quite."} Explanation:
                      </p>
                      <p className="mt-1 text-muted-foreground">{question.explanation}</p>
                      {question.option_explanations?.length ? (
                        <ul className="mt-3 space-y-1">
                          {question.option_explanations.map((oe, i) => (
                            <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                              <span className="font-medium">{String.fromCharCode(65 + i)}.</span>
                              <span>{oe}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </motion.div>
                  )}

                  {selected !== null && (
                    <div className="flex justify-end">
                      <Button onClick={next}>
                        {idx + 1 >= questions.length ? "Finish" : "Next question"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {phase === "summary" && (
        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="text-center">
              <p className="font-display text-4xl font-semibold">
                {score}/{answers.length}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{accuracy}% correct</p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary transition-all" style={{ width: `${accuracy}%` }} />
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              {score >= answers.length * 0.8
                ? "Excellent — you have mastered these topics."
                : score >= answers.length * 0.5
                  ? "Good effort. Review the explanations for the questions you missed."
                  : "You may need to revisit this material. Re-read the explanations and try again."}
              {" "}Attempts are tracked, so your dashboard accuracy will update automatically.
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setPhase("setup")} className="flex-1">
                New quiz
              </Button>
              <Button variant="outline" onClick={start} className="flex-1">
                Retry same set
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {phase === "quiz" && !question && (
        <Card>
          <CardContent className="py-10">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-2/3" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
