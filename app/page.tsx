import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/common/logo";
import { StaggerGroup, StaggerItem, MotionCard } from "@/components/ui/motion";

const FEATURES = [
  {
    title: "AI Medical Tutor",
    description:
      "Explain concepts from beginner to viva depth. Six response modes adapt to how you learn.",
    icon: "💬",
  },
  {
    title: "Notes Generator",
    description:
      "Upload PDFs, DOCX, PPTX or scans and get structured notes, tables, comparisons and high-yield summaries.",
    icon: "📝",
  },
  {
    title: "Flashcard Engine",
    description:
      "AI-generated and manual cards with FSRS spaced repetition, cloze deletions and learning stats.",
    icon: "🗂️",
  },
  {
    title: "MCQ Question Bank",
    description:
      "Subject and topic-based single-best-answer questions with explanations of every option.",
    icon: "🧠",
  },
  {
    title: "Clinical Case Simulator",
    description:
      "Step-by-step simulations that test history-taking, investigation choice and clinical reasoning.",
    icon: "🩺",
  },
  {
    title: "Mock Exams & Viva",
    description:
      "Configurable timed examinations with rubric-based scoring and an AI viva examiner.",
    icon: "🎓",
  },
];

const CURRICULA = [
  "Bangladesh MBBS",
  "Pakistan MBBS",
  "India MBBS",
  "USMLE",
  "PLAB",
  "AMC",
  "Nursing",
  "Pharmacy",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative mx-auto max-w-6xl px-4 pt-20 text-center sm:pt-28">
          <div className="pointer-events-none absolute inset-0 -z-10 grid-clinical opacity-40" />
          <StaggerGroup>
            <StaggerItem>
              <Badge variant="secondary" className="mb-6 rounded-full px-3 py-1 text-xs">
                <Sparkles className="mr-1 size-3" /> Built for medical students
              </Badge>
            </StaggerItem>
            <StaggerItem>
              <h1 className="mx-auto max-w-3xl font-display text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
                Master medicine with an{" "}
                <span className="text-gradient-brand">AI study coach</span>.
              </h1>
            </StaggerItem>
            <StaggerItem>
              <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
                MedCoach AI turns your lectures, textbooks and past papers into an
                interactive learning engine — tutoring, notes, flashcards, MCQs,
                clinical cases and mock exams — personalized to your curriculum.
              </p>
            </StaggerItem>
            <StaggerItem>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href="/register">
                    Start learning free <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                  <Link href="/login">Log in</Link>
                </Button>
              </div>
            </StaggerItem>
            <StaggerItem>
              <p className="mt-6 text-xs text-muted-foreground">
                No credit card required · Optional bring-your-own AI key
              </p>
            </StaggerItem>
          </StaggerGroup>
        </section>

        {/* Curriculum strip */}
        <section className="mx-auto mt-16 max-w-6xl px-4">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {CURRICULA.map((c) => (
              <Badge
                key={c}
                variant="outline"
                className="rounded-full px-3 py-1 text-xs font-normal"
              >
                {c}
              </Badge>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-4 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight">
              Everything you need to pass, in one place.
            </h2>
            <p className="mt-3 text-muted-foreground">
              From first-year physiology to final-concept viva, MedCoach covers the
              full study loop: <span className="font-medium text-foreground">upload → understand → learn → memorize → practice → evaluate → revise</span>.
            </p>
          </div>
          <StaggerGroup className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <StaggerItem key={f.title}>
                <MotionCard className="h-full p-6">
                  <div className="text-2xl">{f.icon}</div>
                  <h3 className="mt-4 font-semibold tracking-tight">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {f.description}
                  </p>
                </MotionCard>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </section>

        {/* Safety note */}
        <section className="mx-auto max-w-6xl px-4 pb-20">
          <MotionCard className="p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
              <Check className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <h3 className="font-semibold tracking-tight">
                  Educational tool — not clinical advice
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  MedCoach AI is a study aid. It does not replace professional
                  clinical judgment, and it never claims generated questions are
                  official examination content unless verified against an
                  authoritative source.
                </p>
              </div>
            </div>
          </MotionCard>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
          <Logo size="sm" />
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} MedCoach AI. For educational use.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link href="/faq" className="hover:text-foreground">FAQ</Link>
            <Link href="/login" className="hover:text-foreground">Log in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
