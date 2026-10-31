"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, FileQuestion, FolderOpen, HeartPulse, MessageSquare, SquareStack, Timer } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { AnimatedNumber, StaggerGroup, StaggerItem } from "@/components/ui/motion";
import type { Profile } from "@/lib/types";

interface DashboardData {
  profile: Profile | null;
  readyDocs: number;
  attempts: number;
  correct: number;
  dueCards: number;
  latestPlan: { title: string; exam_date: string | null } | null;
  latestExam: { status: string; score: number | null; max_score: number | null } | null;
}

const MODULES = [
  { href: "/tutor", icon: MessageSquare, title: "AI Tutor", blurb: "Ask anything, in 6 modes", accent: "from-primary/20 to-primary/5" },
  { href: "/flashcards", icon: SquareStack, title: "Flashcards", blurb: "Due cards review", accent: "from-clinical/20 to-clinical/5" },
  { href: "/practice", icon: FileQuestion, title: "MCQ Practice", blurb: "Timed single-best-answer", accent: "from-accent/20 to-accent/5" },
  { href: "/cases", icon: HeartPulse, title: "Clinical Cases", blurb: "Simulated patients", accent: "from-caution/20 to-caution/5" },
  { href: "/library", icon: FolderOpen, title: "Knowledge Library", blurb: "Searchable documents", accent: "from-primary/20 to-clinical/5" },
];

function ModuleCard({ m, index }: { m: (typeof MODULES)[number]; index: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? undefined : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 + index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      whileHover={reduce ? undefined : { y: -4 }}
    >
      <Link href={m.href} className="block h-full">
        <Card className="h-full overflow-hidden transition-shadow hover:shadow-lifted">
          <div className={`h-1 w-full bg-gradient-to-r ${m.accent}`} />
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
    </motion.div>
  );
}

export function DashboardView({ data }: { data: DashboardData }) {
  const reduce = useReducedMotion();
  const name = (data.profile?.full_name ?? "Student").split(" ")[0] ?? "Student";
  const correctPct = data.attempts > 0 ? Math.round((data.correct / data.attempts) * 100) : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">Welcome back, {name}</h1>
          <p className="mt-1 text-muted-foreground">
            {data.profile?.curriculum ? `Curriculum: ${data.profile.curriculum}` : "Set up your profile to personalise learning"}
          </p>
        </motion.div>
        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
        >
          <Button asChild>
            <Link href="/tutor">
              Ask the tutor <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </motion.div>
      </div>

      {/* Stats */}
      <StaggerGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StaggerItem>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Ready documents</CardDescription>
              <CardTitle className="text-3xl">
                <AnimatedNumber value={data.readyDocs} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Processed and searchable</p>
            </CardContent>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Questions attempted</CardDescription>
              <CardTitle className="text-3xl">
                <AnimatedNumber value={data.attempts} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={correctPct} className="mt-1" />
              <p className="mt-1 text-xs text-muted-foreground">Accuracy {correctPct}%</p>
            </CardContent>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Flashcards due</CardDescription>
              <CardTitle className="text-3xl">
                <AnimatedNumber value={data.dueCards} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Ready for review today</p>
            </CardContent>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Latest exam</CardDescription>
              <CardTitle className="text-2xl">
                {data.latestExam ? (
                  data.latestExam.score != null ? (
                    <span>
                      <AnimatedNumber value={data.latestExam.score} />/{data.latestExam.max_score}
                    </span>
                  ) : (
                    "In progress"
                  )
                ) : (
                  "None yet"
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Timer className="h-3 w-3" />
                {data.latestExam ? data.latestExam.status : "Take a mock exam to start"}
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
      </StaggerGroup>

      {/* Active plan */}
      {data.latestPlan && (
        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <Card className="border-primary/30 bg-gradient-to-r from-primary-soft/50 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Timer className="h-4 w-4 text-primary" /> {data.latestPlan.title}
              </CardTitle>
              <CardDescription>
                {data.latestPlan.exam_date ? `Target exam: ${formatDate(data.latestPlan.exam_date)}` : "No exam date set yet"}
              </CardDescription>
            </CardHeader>
          </Card>
        </motion.div>
      )}

      {/* Modules */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Continue learning</h2>
          <Badge variant="soft">{MODULES.length} modules</Badge>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m, i) => (
            <ModuleCard key={m.href} m={m} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
