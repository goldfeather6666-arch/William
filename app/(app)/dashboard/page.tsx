import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, FileQuestion, FolderOpen, HeartPulse, MessageSquare, Sparkles, SquareStack, Timer } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Profile } from "@/lib/types";

async function getDashboardData(userId: string) {
  const supabase = await createClient();
  const [profileRes, docsRes, attemptsRes, cardsRes, plansRes, examsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("documents").select("id,status", { count: "exact", head: true }).eq("user_id", userId).eq("status", "ready"),
    supabase.from("question_attempts").select("id,is_correct", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("flashcards").select("id", { count: "exact", head: true }).eq("user_id", userId).lte("due_at", new Date().toISOString()),
    supabase.from("study_plans").select("id,title,exam_date").eq("user_id", userId).order("created_at", { ascending: false }).limit(1),
    supabase.from("exam_sessions").select("id,status,score,max_score").eq("user_id", userId).order("created_at", { ascending: false }).limit(1),
  ]);

  return {
    profile: profileRes.data as Profile | null,
    readyDocs: docsRes.count ?? 0,
    attempts: attemptsRes.count ?? 0,
    correct: (attemptsRes.data as { is_correct: boolean }[] | null)?.filter((a) => a.is_correct).length ?? 0,
    dueCards: cardsRes.count ?? 0,
    latestPlan: plansRes.data?.[0] ?? null,
    latestExam: examsRes.data?.[0] ?? null,
  };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const data = await getDashboardData(user.id);
  const name = (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ?? "Student";
  const correctPct = data.attempts > 0 ? Math.round((data.correct / data.attempts) * 100) : 0;

  const modules = [
    { href: "/tutor", icon: MessageSquare, title: "AI Tutor", blurb: "Ask anything, in 6 modes" },
    { href: "/flashcards", icon: SquareStack, title: "Flashcards", blurb: `${data.dueCards} cards due for review` },
    { href: "/practice", icon: FileQuestion, title: "MCQ Practice", blurb: "Timed single-best-answer practice" },
    { href: "/cases", icon: HeartPulse, title: "Clinical Cases", blurb: "Simulated patients, step by step" },
    { href: "/library", icon: FolderOpen, title: "Knowledge Library", blurb: `${data.readyDocs} documents processed and searchable` },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">Welcome back, {name}</h1>
          <p className="mt-1 text-muted-foreground">
            {data.profile?.curriculum ? `Curriculum: ${data.profile.curriculum}` : "Set up your profile to personalise learning"}
          </p>
        </div>
        <Button asChild>
          <Link href="/tutor">
            Ask the tutor <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ready documents</CardDescription>
            <CardTitle className="text-3xl">{data.readyDocs}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Processed and searchable</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Questions attempted</CardDescription>
            <CardTitle className="text-3xl">{data.attempts}</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={correctPct} className="mt-1" />
            <p className="mt-1 text-xs text-muted-foreground">Accuracy {correctPct}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Flashcards due</CardDescription>
            <CardTitle className="text-3xl">{data.dueCards}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Ready for review today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Latest exam</CardDescription>
            <CardTitle className="text-2xl">
              {data.latestExam ? (data.latestExam.score != null ? `${data.latestExam.score}/${data.latestExam.max_score}` : "In progress") : "None yet"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Timer className="h-3 w-3" />
              {data.latestExam ? data.latestExam.status : "Take a mock exam to start"}
            </div>
          </CardContent>
        </Card>
      </div>

      {data.latestPlan && (
        <Card className="border-primary/30 bg-primary-soft/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Timer className="h-4 w-4 text-primary" /> {data.latestPlan.title}
            </CardTitle>
            <CardDescription>
              {data.latestPlan.exam_date ? `Target exam: ${formatDate(data.latestPlan.exam_date)}` : "No exam date set yet"}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Continue learning</h2>
          <Badge variant="soft">{modules.length} modules</Badge>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m) => (
            <Link key={m.href} href={m.href}>
              <Card className="h-full transition-shadow hover:shadow-lifted">
                <CardContent className="flex items-start gap-3 p-5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <m.icon className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="font-medium">{m.title}</div>
                    <div className="text-sm text-muted-foreground">{m.blurb}</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
