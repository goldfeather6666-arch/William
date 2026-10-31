import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Brain,
  ClipboardCheck,
  FileText,
  FlaskConical,
  GraduationCap,
  HeartPulse,
  Layers,
  Library,
  ListChecks,
  Microscope,
  Sparkles,
  Stethoscope,
  Timer,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Reveal } from "@/components/motion/reveal";

const workflow = [
  { icon: UploadIcon, label: "Upload" },
  { icon: BookOpen, label: "Understand" },
  { icon: Brain, label: "Learn" },
  { icon: ListChecks, label: "Memorize" },
  { icon: ClipboardCheck, label: "Practice" },
  { icon: Stethoscope, label: "Evaluate" },
  { icon: Sparkles, label: "Revise" },
];

const features = [
  {
    icon: Sparkles,
    title: "AI Medical Tutor",
    blurb: "Six response modes — from beginner explanations to viva interrogation — with streaming answers, citations and follow-up suggestions.",
  },
  {
    icon: FileText,
    title: "Notes Generator",
    blurb: "Turn PDFs, DOCX, PPTX and scans into detailed notes, tables, comparisons and high-yield revision sheets with page references.",
  },
  {
    icon: Layers,
    title: "Flashcard Engine",
    blurb: "FSRS spaced repetition, cloze deletions and image cards that schedule each review from your real recall data.",
  },
  {
    icon: ClipboardCheck,
    title: "MCQ Question Bank",
    blurb: "Subject and topic-based single-best-answer questions with explanations for every option, timed quizzes and analytics.",
  },
  {
    icon: HeartPulse,
    title: "Clinical Case Simulator",
    blurb: "Make decisions step by step through history, investigations and management — with reasoning feedback after each case.",
  },
  {
    icon: Microscope,
    title: "Visual Learning Studio",
    blurb: "Flowcharts, mind maps, pharmacology pathways and treatment algorithms you can edit and export.",
  },
  {
    icon: Timer,
    title: "Mock Examinations",
    blurb: "Configurable MCQ and written exams with rubric-based scoring and clearly-labelled AI-estimated marks.",
  },
  {
    icon: UserRound,
    title: "AI Viva Examiner",
    blurb: "A Socratic oral examiner that asks one question at a time, probes follow-ups and produces a performance report.",
  },
  {
    icon: GraduationCap,
    title: "Study Planner",
    blurb: "A schedule built around your exam date, weak topics and flashcard reviews — and it adapts as you progress.",
  },
  {
    icon: Library,
    title: "Medical Knowledge Library",
    blurb: "Searchable personal library with semantic search over your uploaded materials and source-tied answers.",
  },
  {
    icon: FlaskConical,
    title: "Pharmacology Masterclass",
    blurb: "Drug classifications, mechanisms, interactions and mnemonics with interactive receptor diagrams.",
  },
  {
    icon: BookOpen,
    title: "OSCE Trainer",
    blurb: "History-taking and examination stations with checklists, procedures and station-based scoring.",
  },
];

const curricula = [
  "Bangladesh MBBS",
  "Pakistan MBBS",
  "Indian MBBS",
  "USMLE",
  "PLAB",
  "AMC",
  "Nursing",
  "Pharmacy",
];

const faqs = [
  {
    q: "Is MedCoach AI a source of medical truth?",
    a: "No. MedCoach is an educational practice tool. It helps you study and test yourself, but it never replaces your textbooks, faculty, or professional clinical judgment. AI-generated answers cite sources where available and flag uncertainty.",
  },
  {
    q: "Are the quiz questions official exam questions?",
    a: "No. Questions are generated for practice and are explicitly labelled as such. We never present generated questions as official examination items unless they have been verified against an authoritative source.",
  },
  {
    q: "Can I bring my own AI API key?",
    a: "Yes. You can connect OpenAI, Anthropic, Gemini, DeepSeek, OpenRouter or any OpenAI-compatible endpoint. Your key is encrypted at rest and never exposed to the browser.",
  },
  {
    q: "Which curricula do you support?",
    a: "We start with MBBS curricula for Bangladesh, Pakistan and India, plus USMLE, PLAB, AMC, nursing and pharmacy. Curriculum selection is a setting, so we never hardcode one country's system.",
  },
];

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Stethoscope className="h-4 w-4" />
            </span>
            <span className="font-display text-lg font-semibold">MedCoach AI</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <Link href="#features" className="transition-colors hover:text-foreground">Features</Link>
            <Link href="#curricula" className="transition-colors hover:text-foreground">Curricula</Link>
            <Link href="#pricing" className="transition-colors hover:text-foreground">Pricing</Link>
            <Link href="#faq" className="transition-colors hover:text-foreground">FAQ</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/register">
                Get started <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-clinical opacity-70" />
        <div className="relative mx-auto max-w-6xl px-4 py-24 text-center sm:px-6 sm:py-32">
          <Reveal>
            <Badge variant="soft" className="mb-6">
              <Sparkles className="mr-1 h-3 w-3" /> AI-powered medical education
            </Badge>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="mx-auto max-w-3xl font-display text-4xl font-semibold leading-tight sm:text-6xl">
              Master medicine with <span className="text-gradient-brand">an AI coach</span> that knows your curriculum
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              MedCoach AI turns your textbooks and lectures into an interactive study loop — understanding, memorizing,
              practicing and evaluating — for MBBS and international medical exams.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/register">Start studying — it&apos;s free</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                <Link href="/login">Sign in to an account</Link>
              </Button>
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-6 text-xs text-muted-foreground">
              No credit card required · Free plan available · Platform learning, not clinical advice
            </p>
          </Reveal>
        </div>
      </section>

      {/* Workflow strip */}
      <section className="border-y border-border/60 bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <Reveal>
            <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Your study loop
            </p>
          </Reveal>
          <div className="grid grid-cols-4 gap-4 sm:grid-cols-7">
            {workflow.map((step, i) => (
              <Reveal key={step.label} delay={i * 0.04}>
                <div className="flex flex-col items-center gap-2 text-center">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary">
                    <step.icon />
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">{step.label}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">Everything you need to prepare</h2>
            <p className="mt-3 text-muted-foreground">
              Twelve integrated modules that cover the entire medical study workflow.
            </p>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 0.05}>
              <Card className="h-full transition-shadow hover:shadow-lifted">
                <CardContent className="p-6">
                  <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <f.icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.blurb}</p>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Curricula */}
      <section id="curricula" className="border-y border-border/60 bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <Reveal>
              <div>
                <h2 className="font-display text-3xl font-semibold">Built for your curriculum</h2>
                <p className="mt-3 text-muted-foreground">
                  Pick your country and degree once — MedCoach adapts terminology, exam style and emphasis across the
                  major MBBS programs and international exams.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {curricula.map((c) => (
                    <Badge key={c} variant="secondary" className="px-3 py-1">
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <Card>
                <CardContent className="p-8">
                  <h3 className="font-semibold">The learning loop in practice</h3>
                  <ol className="mt-4 space-y-3 text-sm text-muted-foreground">
                    <li className="flex gap-3"><span className="font-semibold text-primary">01</span> Upload your lecture PDFs — they become your personal knowledge base.</li>
                    <li className="flex gap-3"><span className="font-semibold text-primary">02</span> Ask the tutor to explain a mechanism step by step.</li>
                    <li className="flex gap-3"><span className="font-semibold text-primary">03</span> Auto-generate flashcards and MCQs from the material.</li>
                    <li className="flex gap-3"><span className="font-semibold text-primary">04</span> Drill with spaced repetition and timed quizzes.</li>
                    <li className="flex gap-3"><span className="font-semibold text-primary">05</span> Sit mock exams and practice viva scenarios.</li>
                    <li className="flex gap-3"><span className="font-semibold text-primary">06</span> Let the planner rebalance your schedule from results.</li>
                  </ol>
                </CardContent>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-semibold">Simple plans</h2>
            <p className="mt-3 text-muted-foreground">Start free and upgrade as your exam approaches.</p>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            { name: "Free", price: "$0", cta: "Start free", blurb: "Limited tutor + basic quizzes", hi: false },
            { name: "Student", price: "$12", cta: "Get Student", blurb: "Notes, advanced MCQs, planner", hi: true },
            { name: "Pro", price: "$24", cta: "Get Pro", blurb: "Clinical sims, viva, deep analytics", hi: false },
          ].map((p) => (
            <Reveal key={p.name}>
              <Card className={`h-full ${p.hi ? "border-primary/40 ring-1 ring-primary/20" : ""}`}>
                <CardContent className="flex flex-col p-6">
                  <h3 className="font-semibold">{p.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="font-display text-4xl font-semibold">{p.price}</span>
                    <span className="text-sm text-muted-foreground">/month</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{p.blurb}</p>
                  <Button className="mt-6 w-full" variant={p.hi ? "default" : "outline"}>
                    {p.cta}
                  </Button>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Institution plans with centralized billing and instructor dashboards are available. Annual billing saves ~17%.
        </p>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-border/60 bg-card/40">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
          <Reveal>
            <h2 className="text-center font-display text-3xl font-semibold">Frequently asked</h2>
          </Reveal>
          <div className="mt-8 space-y-4">
            {faqs.map((f, i) => (
              <Reveal key={f.q} delay={i * 0.04}>
                <Card>
                  <CardContent className="p-5">
                    <h3 className="font-medium">{f.q}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Safety disclaimer */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="rounded-xl border border-caution/30 bg-caution/5 p-5 text-sm text-muted-foreground">
          <p>
            <span className="font-semibold text-caution">Educational use only.</span> MedCoach AI is a study and practice
            tool. It does not provide medical advice, diagnosis or treatment, and does not replace professional clinical
            judgment. AI-generated content may contain errors — always cross-check against authoritative medical sources
            and your course materials.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <Reveal>
          <div className="rounded-2xl border border-border bg-primary p-10 text-center text-primary-foreground shadow-lifted sm:p-14">
            <h2 className="font-display text-3xl font-semibold">Ready to study smarter?</h2>
            <p className="mx-auto mt-3 max-w-xl text-primary-foreground/90">
              Join the platform built for how medical students actually prepare.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-8">
              <Link href="/register">Create your free account</Link>
            </Button>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Stethoscope className="h-3 w-3" />
            </span>
            <span className="font-medium text-foreground">MedCoach AI</span>
          </div>
          <p>© {new Date().getFullYear()} MedCoach AI. Educational use only.</p>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-foreground">Privacy</Link>
            <Link href="#" className="hover:text-foreground">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
