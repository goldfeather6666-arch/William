"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TUTOR_MODES } from "@/lib/types";
import { safeErrorMessage } from "@/lib/utils";

const curricula = [
  { value: "bd-mbbs", label: "Bangladesh MBBS" },
  { value: "pk-mbbs", label: "Pakistan MBBS" },
  { value: "in-mbbs", label: "Indian MBBS" },
  { value: "usmle", label: "USMLE" },
  { value: "plab", label: "PLAB" },
  { value: "amc", label: "AMC" },
  { value: "nursing", label: "Nursing" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "generic", label: "Generic Medicine" },
];

const subjects = ["Anatomy", "Physiology", "Biochemistry", "Pharmacology", "Pathology", "Microbiology", "Medicine", "Surgery", "Pediatrics", "Obstetrics & Gynaecology", "Psychiatry", "Community Medicine"];

export default function OnboardingPage() {
  const router = useRouter();
  const [fullName, setFullName] = React.useState("");
  const [country, setCountry] = React.useState("");
  const [curriculum, setCurriculum] = React.useState("");
  const [degree, setDegree] = React.useState("");
  const [academicYear, setAcademicYear] = React.useState("");
  const [examDate, setExamDate] = React.useState("");
  const [dailyMinutes, setDailyMinutes] = React.useState("120");
  const [explanationLevel, setExplanationLevel] = React.useState("student");
  const [preferred, setPreferred] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function toggleSubject(s: string) {
    setPreferred((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    let supabase;
    try {
      supabase = createClient();
    } catch {
      setError("Supabase is not configured yet.");
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    setLoading(true);
    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        full_name: fullName || null,
        country: country || null,
        curriculum: curriculum || null,
        degree: degree || null,
        academic_year: academicYear ? Number(academicYear) : null,
        exam_date: examDate || null,
        daily_study_minutes: dailyMinutes ? Number(dailyMinutes) : null,
        explanation_level: explanationLevel as "beginner" | "student" | "advanced",
        preferred_subjects: preferred,
        onboarded_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    setLoading(false);
    if (upsertError) {
      setError(safeErrorMessage(upsertError));
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Tell us about your studies</CardTitle>
          <CardDescription>This personalises the tutor, flashcards and study planner. You can change it anytime.</CardDescription>
        </CardHeader>
        <form onSubmit={save}>
          <CardContent className="space-y-5">
            {error && <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}

            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Dr. Ayesha Rahman" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Country</Label>
                <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Bangladesh" />
              </div>
              <div className="space-y-2">
                <Label>Curriculum</Label>
                <Select value={curriculum} onValueChange={setCurriculum}>
                  <SelectTrigger><SelectValue placeholder="Select curriculum" /></SelectTrigger>
                  <SelectContent>
                    {curricula.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Degree</Label>
                <Input value={degree} onChange={(e) => setDegree(e.target.value)} placeholder="MBBS" />
              </div>
              <div className="space-y-2">
                <Label>Academic year</Label>
                <Select value={academicYear} onValueChange={setAcademicYear}>
                  <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((y) => (
                      <SelectItem key={y} value={String(y)}>Year {y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Exam date</Label>
                <Input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Daily study time (minutes)</Label>
                <Input type="number" min={15} max={720} value={dailyMinutes} onChange={(e) => setDailyMinutes(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Preferred explanation level</Label>
                <Select value={explanationLevel} onValueChange={setExplanationLevel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner-friendly</SelectItem>
                    <SelectItem value="student">MBBS student</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Preferred subjects</Label>
              <div className="flex flex-wrap gap-2">
                {subjects.map((s) => {
                  const active = preferred.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSubject(s)}
                      className={
                        active
                          ? "rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
                          : "rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground hover:border-primary/40"
                      }
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => router.push("/dashboard")}>
                Skip for now
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving…" : "Save and continue"}
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
      <p className="mt-4 text-center text-xs text-muted-foreground">{TUTOR_MODES.length} tutor modes will adapt to these preferences.</p>
    </motion.div>
  );
}
