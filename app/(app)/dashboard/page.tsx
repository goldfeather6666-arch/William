import { createClient } from "@/lib/supabase/server";
import { DashboardView } from "@/components/dashboard/dashboard-view";
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

  return <DashboardView data={data} />;
}
