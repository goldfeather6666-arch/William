import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Brain,
  CalendarClock,
  FileText,
  Layers,
  MessageSquare,
  Stethoscope,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/layout/page-header";
import { MotionCard, AnimatedNumber } from "@/components/ui/motion";

export const metadata: Metadata = {
  title: "Dashboard",
};

const QUICK_ACTIONS = [
  { label: "Ask the AI Tutor", href: "/tutor", icon: MessageSquare },
  { label: "Study flashcards", href: "/flashcards", icon: Layers },
  { label: "Take an MCQ quiz", href: "/mcq", icon: Brain },
  { label: "Generate notes", href: "/notes", icon: FileText },
  { label: "Practice a clinical case", href: "/cases", icon: Stethoscope },
  { label: "Review study plan", href: "/planner", icon: CalendarClock },
];

export default function DashboardPage() {
  const mastery = 64;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Welcome back"
        description="Here is a snapshot of your learning."
        actions={
          <Button asChild>
            <Link href="/tutor">
              Start a study session <ArrowRight className="size-4" />
            </Link>
          </Button>
        }
      />

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MotionCard className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Mastery</p>
            <TrendingUp className="size-4 text-primary" />
          </div>
          <p className="mt-2 font-display text-3xl font-semibold">
            <AnimatedNumber value={mastery} format={(n) => `${n}%`} />
          </p>
          <Progress value={mastery} className="mt-3 h-2" />
        </MotionCard>
        <MotionCard delay={0.05} className="p-5">
          <p className="text-sm text-muted-foreground">Cards due</p>
          <p className="mt-2 font-display text-3xl font-semibold">24</p>
          <p className="mt-1 text-xs text-muted-foreground">~10 min review</p>
        </MotionCard>
        <MotionCard delay={0.1} className="p-5">
          <p className="text-sm text-muted-foreground">Questions answered</p>
          <p className="mt-2 font-display text-3xl font-semibold">132</p>
          <p className="mt-1 text-xs text-muted-foreground">78% correct</p>
        </MotionCard>
        <MotionCard delay={0.15} className="p-5">
          <p className="text-sm text-muted-foreground">Next exam</p>
          <p className="mt-2 font-display text-3xl font-semibold">42</p>
          <p className="mt-1 text-xs text-muted-foreground">days away</p>
        </MotionCard>
      </div>

      {/* Today's focus */}
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s focus</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {QUICK_ACTIONS.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.href}
                href={a.href}
                className="flex items-center gap-3 rounded-lg border p-3 text-sm font-medium transition-colors hover:bg-muted/60"
              >
                <Icon className="size-4 shrink-0 text-muted-foreground" />
                <span className="flex-1">{a.label}</span>
                <ArrowRight className="size-4 text-muted-foreground" />
              </Link>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
