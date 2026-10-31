"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  Plus,
  RefreshCw,
  Stethoscope,
  Target,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { cn, safeErrorMessage } from "@/lib/utils";
import type { StudyPlan, StudyTask } from "@/lib/types";

const KIND_ROTATION = ["read", "flashcards", "mcq", "case", "revision"] as const;

const KIND_TITLES: Record<string, string> = {
  read: "Reading & notes",
  flashcards: "Flashcard review",
  mcq: "MCQ practice",
  case: "Clinical case",
  revision: "Active revision",
  mock_exam: "Mock exam",
  osce: "OSCE practice",
};

const KIND_VARIANT: Record<string, "secondary" | "soft" | "clinical" | "outline" | "caution" | "default" | "destructive"> = {
  read: "secondary",
  flashcards: "soft",
  mcq: "clinical",
  case: "outline",
  revision: "caution",
  mock_exam: "default",
  osce: "destructive",
};

function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function generateDateKeys(start: Date, count: number): string[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return toLocalDateKey(d);
  });
}

interface TaskDraft {
  title: string;
  kind: StudyTask["kind"];
  duration_minutes: number;
}

function draftTaskForDay(dayIndex: number, dailyMinutes: number): [TaskDraft, TaskDraft] {
  const firstKind = KIND_ROTATION[(dayIndex * 2) % KIND_ROTATION.length]!;
  const secondKind = KIND_ROTATION[(dayIndex * 2 + 1) % KIND_ROTATION.length]!;
  const half = Math.floor(dailyMinutes / 2);
  return [
    { title: KIND_TITLES[firstKind] ?? "Study", kind: firstKind, duration_minutes: half },
    { title: KIND_TITLES[secondKind] ?? "Study", kind: secondKind, duration_minutes: dailyMinutes - half },
  ];
}

export default function PlannerPage() {
  const [plan, setPlan] = React.useState<StudyPlan | null>(null);
  const [tasks, setTasks] = React.useState<StudyTask[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [examDate, setExamDate] = React.useState("");
  const [dailyMinutes, setDailyMinutes] = React.useState("120");
  const [submitting, setSubmitting] = React.useState(false);
  const [regenerating, setRegenerating] = React.useState(false);
  const [completingId, setCompletingId] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: planData } = await supabase
        .from("study_plans")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);
      const latest = planData?.[0] as StudyPlan | undefined;
      setPlan(latest ?? null);

      if (latest) {
        const { data: taskData } = await supabase
          .from("study_tasks")
          .select("*")
          .eq("plan_id", latest.id)
          .order("scheduled_for", { ascending: true });
        setTasks((taskData as StudyTask[]) ?? []);
      } else {
        setTasks([]);
      }
    } catch {
      // unconfigured
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  async function createPlan(e: React.FormEvent) {
    e.preventDefault();
    const trimmedTitle = title.trim();
    const minutes = Number(dailyMinutes);
    if (!trimmedTitle) {
      toast.error("Give your plan a title.");
      return;
    }
    if (!Number.isFinite(minutes) || minutes <= 0) {
      toast.error("Daily minutes must be a positive number.");
      return;
    }
    setSubmitting(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You need to be signed in to create a plan.");

      const { data: planData, error: planError } = await supabase
        .from("study_plans")
        .insert({
          user_id: user.id,
          title: trimmedTitle,
          exam_date: examDate || null,
          daily_minutes: minutes,
          generated_by: "rules",
        })
        .select()
        .single();
      if (planError) throw planError;

      const createdPlan = planData as StudyPlan;
      const dateKeys = generateDateKeys(new Date(), 14);
      const taskRows = dateKeys.flatMap((scheduledFor, dayIndex) => {
        const [a, b] = draftTaskForDay(dayIndex, minutes);
        return [
          {
            plan_id: createdPlan.id,
            user_id: user.id,
            scheduled_for: scheduledFor,
            title: a.title,
            kind: a.kind,
            duration_minutes: a.duration_minutes,
          },
          {
            plan_id: createdPlan.id,
            user_id: user.id,
            scheduled_for: scheduledFor,
            title: b.title,
            kind: b.kind,
            duration_minutes: b.duration_minutes,
          },
        ];
      });

      const { error: taskError } = await supabase.from("study_tasks").insert(taskRows);
      if (taskError) throw taskError;

      toast.success("Plan created — your 14-day schedule is ready.");
      setDialogOpen(false);
      setTitle("");
      setExamDate("");
      setDailyMinutes("120");
      await loadData();
    } catch (err) {
      toast.error(safeErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleTask(task: StudyTask) {
    setCompletingId(task.id);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("study_tasks")
        .update({ completed_at: task.completed_at ? null : new Date().toISOString() })
        .eq("id", task.id);
      if (error) throw error;
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { ...t, completed_at: t.completed_at ? null : new Date().toISOString() }
            : t,
        ),
      );
    } catch (err) {
      toast.error(safeErrorMessage(err));
    } finally {
      setCompletingId(null);
    }
  }

  async function regenerate() {
    if (!plan) return;
    setRegenerating(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You need to be signed in to regenerate a plan.");

      const todayKey = toLocalDateKey(new Date());
      const { error: deleteError } = await supabase
        .from("study_tasks")
        .delete()
        .eq("plan_id", plan.id)
        .gt("scheduled_for", todayKey);
      if (deleteError) throw deleteError;

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateKeys = generateDateKeys(tomorrow, 14);
      const taskRows = dateKeys.flatMap((scheduledFor, dayIndex) => {
        const [a, b] = draftTaskForDay(dayIndex, plan.daily_minutes);
        return [
          {
            plan_id: plan.id,
            user_id: user.id,
            scheduled_for: scheduledFor,
            title: a.title,
            kind: a.kind,
            duration_minutes: a.duration_minutes,
          },
          {
            plan_id: plan.id,
            user_id: user.id,
            scheduled_for: scheduledFor,
            title: b.title,
            kind: b.kind,
            duration_minutes: b.duration_minutes,
          },
        ];
      });

      const { error: insertError } = await supabase.from("study_tasks").insert(taskRows);
      if (insertError) throw insertError;

      toast.success("Schedule regenerated for the next 14 days.");
      await loadData();
    } catch (err) {
      toast.error(safeErrorMessage(err));
    } finally {
      setRegenerating(false);
    }
  }

  const todayKey = toLocalDateKey(new Date());
  const todayTasks = tasks.filter((t) => t.scheduled_for === todayKey);
  const completedToday = todayTasks.filter((t) => t.completed_at).length;

  const upcomingKeys = React.useMemo(() => {
    const start = new Date();
    const keys: string[] = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      keys.push(toLocalDateKey(d));
    }
    return keys;
  }, []);

  const upcomingByDate = upcomingKeys
    .map((key) => ({ key, tasks: tasks.filter((t) => t.scheduled_for === key) }))
    .filter((group) => group.tasks.length > 0);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-40" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Study Planner</h1>
          <p className="text-sm text-muted-foreground">A structured, rotating 14-day study schedule that keeps every subject in rotation.</p>
        </div>

        {plan && (
          <Button variant="outline" onClick={regenerate} disabled={regenerating}>
            <RefreshCw className={cn("h-4 w-4", regenerating && "animate-spin")} />
            {regenerating ? "Regenerating…" : "Regenerate 14 days"}
          </Button>
        )}
      </div>

      {!plan ? (
        <EmptyState
          icon={ClipboardList}
          title="No study plan yet"
          description="Create a rules-based plan and we'll lay out two focused tasks per day for the next 14 days."
          action={
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4" />
                  Create plan
                </Button>
              </DialogTrigger>
              <CreatePlanDialog
                title={title}
                setTitle={setTitle}
                examDate={examDate}
                setExamDate={setExamDate}
                dailyMinutes={dailyMinutes}
                setDailyMinutes={setDailyMinutes}
                submitting={submitting}
                onSubmit={createPlan}
              />
            </Dialog>
          }
        />
      ) : (
        <>
          <Card>
            <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-lg font-semibold">{plan.title}</h2>
                  <Badge variant="soft">rules-based</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  {plan.exam_date && (
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Exam {new Date(plan.exam_date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {plan.daily_minutes} min/day
                  </span>
                </div>
                {plan.rationale && <p className="text-sm text-muted-foreground">{plan.rationale}</p>}
              </div>
              <div className="text-left sm:text-right">
                <Badge variant="clinical">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  {completedToday}/{todayTasks.length} done today
                </Badge>
              </div>
            </CardContent>
          </Card>

          <section aria-labelledby="today-heading">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="today-heading" className="font-display text-base font-semibold">
                Today
              </h2>
              {todayTasks.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {completedToday} of {todayTasks.length} complete
                </span>
              )}
            </div>

            {todayTasks.length === 0 ? (
              <Card>
                <CardContent className="flex justify-center py-8 text-sm text-muted-foreground">
                  No tasks scheduled for today — enjoy the break.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {todayTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18 }}
                    >
                      <TaskRow task={task} onToggle={() => toggleTask(task)} busy={completingId === task.id} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </section>

          <section aria-labelledby="upcoming-heading">
            <div className="mb-3">
              <h2 id="upcoming-heading" className="font-display text-base font-semibold">
                Upcoming
              </h2>
              <p className="text-xs text-muted-foreground">Next 7 days</p>
            </div>

            {upcomingByDate.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
                  <p className="text-sm font-medium">Nothing on the horizon yet.</p>
                  <p className="max-w-sm text-xs text-muted-foreground">
                    Regenerate the schedule to build out your next fortnight.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {upcomingByDate.map((group) => (
                  <div key={group.key}>
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant="secondary">{formatDayLabel(group.key)}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {group.tasks.reduce((sum, t) => sum + t.duration_minutes, 0)} min · {group.tasks.length} tasks
                      </span>
                    </div>
                    <div className="space-y-2">
                      <AnimatePresence initial={false}>
                        {group.tasks.map((task) => (
                          <motion.div
                            key={task.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.18 }}
                          >
                            <TaskRow task={task} />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {plan && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4" />
              New plan
            </Button>
          </DialogTrigger>
          <CreatePlanDialog
            title={title}
            setTitle={setTitle}
            examDate={examDate}
            setExamDate={setExamDate}
            dailyMinutes={dailyMinutes}
            setDailyMinutes={setDailyMinutes}
            submitting={submitting}
            onSubmit={createPlan}
          />
        </Dialog>
      )}
    </div>
  );
}

function formatDayLabel(dateKey: string): string {
  const today = toLocalDateKey(new Date());
  const tomorrow = toLocalDateKey((() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  })());
  if (dateKey === today) return "Today";
  if (dateKey === tomorrow) return "Tomorrow";
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function TaskRow({ task, onToggle, busy }: { task: StudyTask; onToggle?: () => void; busy?: boolean }) {
  const done = Boolean(task.completed_at);
  return (
    <Card className="transition-colors">
      <CardContent className="flex items-center gap-3 p-4">
        <Button
          type="button"
          variant={done ? "soft" : "outline"}
          size="icon-sm"
          onClick={onToggle}
          disabled={!onToggle || busy}
          aria-label={done ? `Mark ${task.title} as incomplete` : `Mark ${task.title} as complete`}
          className="shrink-0"
        >
          <CheckCircle2 className={cn("h-4 w-4", done && "fill-primary text-primary")} />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("text-sm font-medium", done && "text-muted-foreground line-through")}>{task.title}</span>
            <Badge variant={KIND_VARIANT[task.kind] ?? "secondary"} className="capitalize">
              {task.kind}
            </Badge>
            {task.subject_slug && <Badge variant="secondary">{task.subject_slug}</Badge>}
          </div>
          <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {task.duration_minutes} min
            </span>
            {done && task.completed_at && (
              <span className="inline-flex items-center gap-1 text-clinical-foreground">
                <CheckCircle2 className="h-3 w-3" />
                Completed
              </span>
            )}
          </div>
        </div>
        {task.kind === "case" && <Stethoscope className="h-4 w-4 shrink-0 text-muted-foreground" />}
        {task.kind === "mcq" && <Target className="h-4 w-4 shrink-0 text-muted-foreground" />}
        {task.kind === "flashcards" && <CheckCircle2 className="h-4 w-4 shrink-0 text-muted-foreground" />}
      </CardContent>
    </Card>
  );
}

interface CreatePlanDialogProps {
  title: string;
  setTitle: (v: string) => void;
  examDate: string;
  setExamDate: (v: string) => void;
  dailyMinutes: string;
  setDailyMinutes: (v: string) => void;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

function CreatePlanDialog({
  title,
  setTitle,
  examDate,
  setExamDate,
  dailyMinutes,
  setDailyMinutes,
  submitting,
  onSubmit,
}: CreatePlanDialogProps) {
  return (
    <DialogContent>
      <form onSubmit={onSubmit}>
        <DialogHeader>
          <DialogTitle>Create study plan</DialogTitle>
          <DialogDescription>
            We&apos;ll schedule two focused tasks per day for the next 14 days, rotating across reading, flashcards, MCQ,
            cases and revision.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="plan-title">Title</Label>
            <Input
              id="plan-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. USMLE Step 1 prep"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="plan-exam-date">Exam date</Label>
              <Input id="plan-exam-date" type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-daily-minutes">Study minutes / day</Label>
              <Input
                id="plan-daily-minutes"
                type="number"
                min={30}
                step={15}
                value={dailyMinutes}
                onChange={(e) => setDailyMinutes(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter className="mt-6">
          <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
            {submitting ? "Creating…" : "Create plan"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
