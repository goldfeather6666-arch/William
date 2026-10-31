import Link from "next/link";
import {
  ArrowRight,
  Brain,
  Check,
  ClipboardList,
  FileText,
  HeartPulse,
  Layers,
  MessageSquare,
  Mic,
  Sparkles,
  SquareStack,
  Stethoscope,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/common/logo";
import { AnimatedBackground } from "@/components/landing/animated-background";
import { TiltCard, RevealBlock } from "@/components/landing/tilt-card";
import { Marquee } from "@/components/landing/marquee";
import { HeroMockup } from "@/components/landing/hero-mockup";
import { StatsBand } from "@/components/landing/stats-band";
import { StaggerGroup, StaggerItem, MotionCard } from "@/components/ui/motion";

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

const MODULES = [
  {
    title: "AI Medical Tutor",
    description: "Six response modes from beginner to viva depth — with streaming answers, sources and follow-ups.",
    icon: MessageSquare,
  },
  {
    title: "Notes Generator",
    description: "Turn PDFs, DOCX, PPTX and scans into structured notes, tables, comparisons and high-yield summaries.",
    icon: FileText,
  },
  {
    title: "Flashcard Engine",
    description: "AI and manual cards with FSRS spaced repetition, cloze deletions and learning statistics.",
    icon: SquareStack,
  },
  {
    title: "MCQ Question Bank",
    description: "Subject and topic-based single-best-answer questions with explanations of every option.",
    icon: Brain,
  },
  {
    title: "Clinical Case Simulator",
    description: "Step-by-step simulations that test history-taking, investigation choice and clinical reasoning.",
    icon: HeartPulse,
  },
  {
    title: "Mock Exams & Viva",
    description: "Configurable timed examinations with rubric scoring and an AI viva examiner.",
    icon: Mic,
  },
];

const STEPS = [
  {
    title: "Upload your materials",
    description: "Drop in lectures, textbooks and past papers. We extract, chunk and index them securely.",
    icon: Layers,
  },
  {
    title: "Learn and practice",
    description: "Study through the tutor, notes, flashcards, MCQs and clinical cases — all personalized to your curriculum.",
    icon: Stethoscope,
  },
  {
    title: "Evaluate and revise",
    description: "Mock exams, performance analytics and a study planner adapt to your progress until exam day.",
    icon: ClipboardList,
  },
];

const TESTIMONIALS = [
  {
    quote: "The viva mode changed how I prepare. It asks the kind of follow-up questions my professors actually ask.",
    name: "Ayesha R.",
    role: "MBBS, Bangladesh",
  },
  {
    quote: "It generated study notes from my messy slides in seconds, with page references back to the originals.",
    name: "Hassan K.",
    role: "MBBS, Pakistan",
  },
  {
    quote: "The FSRS flashcards kept everything due exactly when I needed to re-see it. Best recall I have ever had.",
    name: "Dr. Priya S.",
    role: "Post-graduate, India",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
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
        {/* ============= HERO ============= */}
        <section className="relative overflow-hidden">
          <AnimatedBackground />
          <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-16 sm:pt-24">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <StaggerGroup>
                  <StaggerItem>
                    <Badge variant="soft" className="mb-5 rounded-full px-3 py-1 text-xs">
                      <Sparkles className="mr-1 size-3" /> AI-powered medical education
                    </Badge>
                  </StaggerItem>
                  <StaggerItem>
                    <h1 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
                      Master medicine with an{" "}
                      <span className="text-gradient-brand">AI study coach</span> that adapts to you.
                    </h1>
                  </StaggerItem>
                  <StaggerItem>
                    <p className="mt-5 max-w-xl text-lg text-muted-foreground">
                      MedCoach AI turns your lectures, textbooks and past papers into an interactive learning engine —
                      tutoring, notes, flashcards, MCQs, clinical cases and mock exams, personalized to your curriculum.
                    </p>
                  </StaggerItem>
                  <StaggerItem>
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                      <Button asChild size="lg" className="w-full sm:w-auto">
                        <Link href="/register">
                          Start learning free <ArrowRight className="size-4" />
                        </Link>
                      </Button>
                      <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                        <Link href="/pricing">View pricing</Link>
                      </Button>
                    </div>
                  </StaggerItem>
                  <StaggerItem>
                    <p className="mt-4 text-sm text-muted-foreground">
                      No credit card required · Optional bring-your-own AI key
                    </p>
                  </StaggerItem>
                </StaggerGroup>
              </div>

              {/* Product mockup */}
              <div className="relative">
                <div className="absolute -inset-8 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/10 via-transparent to-clinical/10 blur-2xl" />
                <HeroMockup />
              </div>
            </div>

            {/* Curriculum marquee */}
            <div className="mt-16">
              <p className="mb-4 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Built for students worldwide
              </p>
              <Marquee items={CURRICULA} />
            </div>

            {/* Stats */}
            <div className="mt-16 rounded-2xl border border-border/60 bg-card/50 p-8 backdrop-blur">
              <StatsBand />
            </div>
          </div>
        </section>

        {/* ============= MODULES ============= */}
        <section className="mx-auto max-w-6xl px-4 py-20">
          <RevealBlock className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Everything you need to pass, in one place.
            </h2>
            <p className="mt-3 text-muted-foreground">
              From first-year physiology to final-year viva, MedCoach covers the full study loop:{" "}
              <span className="font-medium text-foreground">
                upload → understand → learn → memorize → practice → evaluate → revise
              </span>
              .
            </p>
          </RevealBlock>

          <StaggerGroup className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((m) => (
              <StaggerItem key={m.title}>
                <TiltCard maxTilt={6} className="h-full">
                  <MotionCard className="h-full p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                      <m.icon className="size-5" />
                    </div>
                    <h3 className="mt-4 font-semibold tracking-tight">{m.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{m.description}</p>
                  </MotionCard>
                </TiltCard>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </section>

        {/* ============= HOW IT WORKS ============= */}
        <section className="border-y border-border/60 bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <RevealBlock className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                A study loop that actually works.
              </h2>
              <p className="mt-3 text-muted-foreground">
                One workflow, from your first upload to exam day.
              </p>
            </RevealBlock>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <RevealBlock key={step.title} delay={index * 0.08}>
                  <Card className="h-full">
                    <CardContent className="flex flex-col p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-primary">
                          <step.icon className="size-5" />
                        </div>
                        <span className="font-display text-4xl font-semibold text-border/80">
                          0{index + 1}
                        </span>
                      </div>
                      <h3 className="mt-4 font-semibold tracking-tight">{step.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
                    </CardContent>
                  </Card>
                </RevealBlock>
              ))}
            </div>
          </div>
        </section>

        {/* ============= TESTIMONIALS ============= */}
        <section className="mx-auto max-w-6xl px-4 py-20">
          <RevealBlock className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Loved by students worldwide.
            </h2>
          </RevealBlock>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t, index) => (
              <RevealBlock key={t.name} delay={index * 0.08}>
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="flex text-accent">★★★★★</div>
                    <p className="mt-3 text-sm leading-relaxed text-foreground">“{t.quote}”</p>
                    <div className="mt-5 border-t border-border/60 pt-4">
                      <div className="text-sm font-semibold">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.role}</div>
                    </div>
                  </CardContent>
                </Card>
              </RevealBlock>
            ))}
          </div>
        </section>

        {/* ============= SAFETY ============= */}
        <section className="mx-auto max-w-6xl px-4 pb-20">
          <RevealBlock>
            <Card className="border-primary/20">
              <CardContent className="flex gap-4 p-6 sm:items-start">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <Check className="size-5" />
                </div>
                <div>
                  <h3 className="font-semibold tracking-tight">Educational tool — not clinical advice</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    MedCoach AI is a study aid. It does not replace professional clinical judgment, cites authoritative
                    references where possible, clearly flags uncertainty, and never claims generated questions are
                    official examination content unless verified against an authoritative source.
                  </p>
                </div>
              </CardContent>
            </Card>
          </RevealBlock>
        </section>

        {/* ============= CTA ============= */}
        <section className="border-t border-border/60 bg-gradient-to-b from-primary-soft/40 to-transparent">
          <div className="mx-auto max-w-4xl px-4 py-20 text-center">
            <RevealBlock>
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lifted">
                <Stethoscope className="size-7" />
              </div>
              <h2 className="mt-6 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Your future self will thank you.
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                Join thousands of medical students mastering their curriculum with MedCoach AI. Free to start.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href="/register">
                    Create free account <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                  <Link href="/login">Log in</Link>
                </Button>
              </div>
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Timer className="size-3.5" /> Free forever plan · No credit card required
              </div>
            </RevealBlock>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
          <Logo size="sm" />
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} MedCoach AI. For educational use.</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link href="/pricing#faq" className="hover:text-foreground">FAQ</Link>
            <Link href="/login" className="hover:text-foreground">Log in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
