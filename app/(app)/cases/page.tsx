"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { CheckCircle2, HeartPulse, Loader2, Stethoscope } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, safeErrorMessage } from "@/lib/utils";
import type { ClinicalCase } from "@/lib/types";

type Stage = "overview" | "history" | "examination" | "investigations" | "differential" | "diagnosis" | "management" | "feedback";

const HISTORY_DISTRACTORS = [
  "Have you been abroad recently?",
  "Do you use any recreational drugs?",
  "Is there a family history of cancer?",
  "Does the pain change with posture?",
  "Have you noticed any skin rash?",
  "When was your last menstrual period?",
];

const INVESTIGATION_DISTRACTORS = [
  "Whole-body CT scan",
  "MRI of the brain",
  "Serum tumour markers",
  "Upper GI endoscopy",
  "Bone marrow biopsy",
];

const DIFFERENTIAL_DISTRACTORS = ["Panic disorder", "Gastroenteritis", "Migraine", "Iron deficiency anaemia", "Urinary tract infection"];

const MANAGEMENT_DISTRACTORS = [
  "Start corticosteroids empirically",
  "Arrange physiotherapy",
  "Advise bed rest for 2 weeks",
  "Prescribe an anxiolytic",
  "Refer for urgent renal transplant",
];

export default function CasesPage() {
  const [cases, setCases] = React.useState<ClinicalCase[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [active, setActive] = React.useState<ClinicalCase | null>(null);
  const [stage, setStage] = React.useState<Stage>("overview");

  // selections
  const [historySelected, setHistorySelected] = React.useState<string[]>([]);
  const [invSelected, setInvSelected] = React.useState<string[]>([]);
  const [diffSelected, setDiffSelected] = React.useState<string[]>([]);
  const [diagnosisInput, setDiagnosisInput] = React.useState("");
  const [mgmtSelected, setMgmtSelected] = React.useState<string[]>([]);

  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data } = await supabase.from("clinical_cases").select("*").eq("is_published", true).order("title");
        setCases(((data as ClinicalCase[]) ?? []).filter((c) => c && c.slug));
      } catch {
        // unconfigured
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function openCase(c: ClinicalCase) {
    setActive(c);
    setStage("overview");
    setHistorySelected([]);
    setInvSelected([]);
    setDiffSelected([]);
    setDiagnosisInput("");
    setMgmtSelected([]);
  }

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  function next() {
    const order: Stage[] = ["overview", "history", "examination", "investigations", "differential", "diagnosis", "management", "feedback"];
    const i = order.indexOf(stage);
    setStage(order[Math.min(i + 1, order.length - 1)]!);
  }

  function back() {
    const order: Stage[] = ["overview", "history", "examination", "investigations", "differential", "diagnosis", "management", "feedback"];
    const i = order.indexOf(stage);
    setStage(order[Math.max(i - 1, 0)]!);
  }

  async function finish() {
    if (!active) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be signed in");
        setSaving(false);
        return;
      }
      // score
      const hit = (sel: string[], truth: string[]) => (sel.length ? sel.filter((s) => truth.includes(s)).length / sel.length : 1);
      const diffScore = hit(diffSelected, active.differentials);
      const diagHit = active.diagnosis.toLowerCase().split(/\W+/).filter((w) => w.length > 4);
      const diagMatch = diagHit.some((w) => diagnosisInput.toLowerCase().includes(w));
      const reasoningScore = Math.round(diffScore * 50 + (diagMatch ? 50 : 0));

      const { data: caseRow } = await supabase.from("clinical_cases").select("id").eq("slug", active.slug).single();
      if (caseRow) {
        await supabase.from("case_attempts").insert({
          user_id: user.id,
          case_id: caseRow.id,
          history_asked: historySelected,
          investigations_ordered: invSelected,
          differential_entered: diffSelected,
          final_diagnosis: diagnosisInput || null,
          management_entered: mgmtSelected,
          reasoning_score: reasoningScore,
          completed_at: new Date().toISOString(),
        });
      }
      setStage("feedback");
    } catch (e) {
      toast.error(safeErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  if (!active) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold">Clinical Case Simulator</h1>
          <p className="text-sm text-muted-foreground">
            Work through simulated patients step by step. The final diagnosis is only revealed when you commit.
          </p>
        </div>
        {cases.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <HeartPulse className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 font-medium">No cases available yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {cases.map((c) => (
              <Card key={c.slug} className="flex flex-col transition-shadow hover:shadow-lifted">
                <CardContent className="flex flex-1 flex-col p-5">
                  <div className="flex items-center justify-between">
                    <Badge variant="soft">{c.subject}</Badge>
                    <Badge variant={c.difficulty === "hard" ? "destructive" : c.difficulty === "medium" ? "secondary" : "clinical"}>
                      {c.difficulty}
                    </Badge>
                  </div>
                  <h3 className="mt-3 font-semibold">{c.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{c.chief_complaint}</p>
                  <Button onClick={() => openCase(c)} className="mt-4">
                    Start simulation
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Badge variant="soft" className="mb-1">
            {active.subject} · {active.difficulty}
          </Badge>
          <h1 className="font-display text-xl font-semibold">{active.title}</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => setActive(null)}>
          Exit
        </Button>
      </div>

      <div className="mb-4 flex items-center gap-1 overflow-x-auto pb-1 text-xs text-muted-foreground">
        {["Overview", "History", "Exam", "Tests", "Differential", "Diagnosis", "Management", "Feedback"].map((label, i) => (
          <span key={label} className="flex items-center gap-1 whitespace-nowrap">
            <span
              className={cn(
                "rounded-full px-2 py-0.5",
                stage === (["overview", "history", "examination", "investigations", "differential", "diagnosis", "management", "feedback"] as Stage[])[i]
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted",
              )}
            >
              {label}
            </span>
            {i < 7 && <span>→</span>}
          </span>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={stage} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {stage === "overview" && `Patient: ${active.demographics.sex}, ${active.demographics.age} y, ${active.demographics.occupation}`}
                {stage === "history" && "History of presenting illness"}
                {stage === "examination" && "Examination and vital signs"}
                {stage === "investigations" && "Order investigations"}
                {stage === "differential" && "Differential diagnosis"}
                {stage === "diagnosis" && "Make your diagnosis"}
                {stage === "management" && "Management plan"}
                {stage === "feedback" && "Feedback"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stage === "overview" && (
                <>
                  <p className="text-sm leading-relaxed">
                    <span className="font-medium text-foreground">Chief complaint:</span> {active.chief_complaint}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    The patient is conscious and comfortable. Take a history, examine, order investigations, and build a
                    differential before committing to a diagnosis.
                  </p>
                  <p className="rounded-lg border border-caution/40 bg-caution/5 px-3 py-2 text-xs text-muted-foreground">
                    This is a simulated educational case, not a real patient. It does not provide clinical advice.
                  </p>
                </>
              )}

              {stage === "history" && (
                <>
                  <p className="text-sm text-muted-foreground">Select the questions you would ask (pick the most relevant):</p>
                  <div className="flex flex-wrap gap-2">
                    {[...active.history, ...HISTORY_DISTRACTORS].map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => toggle(historySelected, setHistorySelected, h)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                          historySelected.includes(h) ? "border-primary bg-primary-soft text-primary" : "border-border bg-background text-muted-foreground hover:border-primary/40",
                        )}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                    The patient&apos;s key history: {active.history.join(" · ")}
                  </div>
                </>
              )}

              {stage === "examination" && (
                <>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {active.vitals.map((v) => (
                      <div key={v.label} className="rounded-xl border border-border p-3">
                        <p className="text-xs text-muted-foreground">{v.label}</p>
                        <p className="text-lg font-semibold">
                          {v.value} {v.flag && <Badge variant={v.flag === "high" ? "destructive" : v.flag === "low" ? "clinical" : "secondary"}>{v.flag}</Badge>}
                        </p>
                      </div>
                    ))}
                  </div>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {active.examination.map((e) => (
                      <li key={e} className="flex gap-2">
                        <Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {e}
                      </li>
                    ))}
                  </ul>
                  {active.past_history.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Past history:</span> {active.past_history.join("; ")}
                    </p>
                  )}
                </>
              )}

              {stage === "investigations" && (
                <>
                  <p className="text-sm text-muted-foreground">Select investigations to order:</p>
                  <div className="flex flex-wrap gap-2">
                    {[...active.investigations.map((i) => i.name), ...INVESTIGATION_DISTRACTORS].map((inv) => (
                      <button
                        key={inv}
                        type="button"
                        onClick={() => toggle(invSelected, setInvSelected, inv)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                          invSelected.includes(inv) ? "border-primary bg-primary-soft text-primary" : "border-border bg-background text-muted-foreground hover:border-primary/40",
                        )}
                      >
                        {inv}
                      </button>
                    ))}
                  </div>
                  {invSelected.length > 0 && (
                    <div className="space-y-1.5">
                      {invSelected.map((name) => {
                        const res = active.investigations.find((i) => i.name === name);
                        return (
                          <div key={name} className="rounded-lg border border-border px-3 py-2 text-sm">
                            <span className="font-medium">{name}:</span>{" "}
                            <span className="text-muted-foreground">{res ? res.result : "Result not shown (not a first-line test for this presentation)."}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {stage === "differential" && (
                <>
                  <p className="text-sm text-muted-foreground">Select the differentials you are considering:</p>
                  <div className="flex flex-wrap gap-2">
                    {[...active.differentials, ...DIFFERENTIAL_DISTRACTORS].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggle(diffSelected, setDiffSelected, d)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                          diffSelected.includes(d) ? "border-primary bg-primary-soft text-primary" : "border-border bg-background text-muted-foreground hover:border-primary/40",
                        )}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {stage === "diagnosis" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="diagnosis">Final diagnosis</Label>
                    <Input id="diagnosis" value={diagnosisInput} onChange={(e) => setDiagnosisInput(e.target.value)} placeholder="e.g. Chronic stable angina" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This is not revealed until you finish. Your answer is compared with the case&apos;s reference diagnosis.
                  </p>
                </>
              )}

              {stage === "management" && (
                <>
                  <p className="text-sm text-muted-foreground">Select your management steps:</p>
                  <div className="flex flex-wrap gap-2">
                    {[...active.management, ...MANAGEMENT_DISTRACTORS].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => toggle(mgmtSelected, setMgmtSelected, m)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                          mgmtSelected.includes(m) ? "border-primary bg-primary-soft text-primary" : "border-border bg-background text-muted-foreground hover:border-primary/40",
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {stage === "feedback" && (
                <>
                  <div className="rounded-xl border border-primary/40 bg-primary-soft/30 p-4">
                    <p className="font-medium">Reference diagnosis</p>
                    <p className="mt-1 text-sm">{active.diagnosis}</p>
                    {active.diagnosis_notes && <p className="mt-1 text-sm text-muted-foreground">{active.diagnosis_notes}</p>}
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">Teaching points</p>
                    <ul className="space-y-1.5 text-muted-foreground">
                      {active.teaching_points.map((t) => (
                        <li key={t} className="flex gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setActive(null)}>
                      Back to cases
                    </Button>
                    <Button onClick={() => openCase(active)}>Retry case</Button>
                  </div>
                </>
              )}

              {stage !== "feedback" && (
                <div className="flex items-center justify-between pt-2">
                  <Button variant="outline" onClick={back} disabled={stage === "overview"}>
                    Back
                  </Button>
                  {stage === "management" ? (
                    <Button onClick={finish} disabled={saving}>
                      {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null} Finish & see result
                    </Button>
                  ) : (
                    <Button onClick={next}>Continue</Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
