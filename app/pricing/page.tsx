"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import type { Plan } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/common/logo";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { StaggerGroup, StaggerItem } from "@/components/ui/motion";

type BillingInterval = "month" | "year";

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Do I need a credit card to get started?",
    answer:
      "No. Payments are managed by your institution or via credits for individual plans. No card required to get started — you can begin with the free plan and upgrade at any time.",
  },
  {
    question: "What are credits and how do they work?",
    answer:
      "Credits are the unit that powers AI features like tutoring, notes generation and clinical simulations. Every plan includes a monthly credit allowance, and they reset each month. You can top up with extra credits at any time.",
  },
  {
    question: "Can my institution cover my subscription?",
    answer:
      "Yes. Institution plans provide multi-student seats with centralized billing, so your school or program can cover access. Individual students can still subscribe directly to a personal plan.",
  },
  {
    question: "Can I switch plans or cancel later?",
    answer:
      "Absolutely. You can upgrade, downgrade or cancel whenever you like — changes apply at the next billing period, and you keep access for the rest of the current period.",
  },
  {
    question: "Is there a free plan?",
    answer:
      "Yes. The Free plan is available forever with a limited monthly credit allowance so you can try tutoring, quizzes and clinical cases before upgrading.",
  },
];

const CTA_LABEL: Record<string, string> = {
  free: "Start free",
  student: "Choose Student",
  pro: "Choose Pro",
  institution: "Contact sales",
};

function PlanSkeleton() {
  return (
    <div className="flex h-full flex-col rounded-xl border border-border/80 bg-card p-6 shadow-subtle">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-4 h-9 w-32" />
      <Skeleton className="mt-3 h-4 w-24" />
      <div className="mt-6 space-y-3">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-4/5" />
        <Skeleton className="h-3.5 w-3/5" />
        <Skeleton className="h-3.5 w-2/3" />
      </div>
      <Skeleton className="mt-8 h-10 w-full" />
    </div>
  );
}

function PriceDisplay({ plan, interval }: { plan: Plan; interval: BillingInterval }) {
  const cents = interval === "year" ? plan.price_cents_year : plan.price_cents_month;
  const per = interval === "year" ? "year" : "month";

  if (cents <= 0) {
    return (
      <div className="flex items-baseline gap-2">
        <span className="font-display text-4xl font-semibold tracking-tight">Free</span>
        <span className="text-sm text-muted-foreground">forever</span>
      </div>
    );
  }

  if (interval === "year") {
    return (
      <div className="space-y-1">
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-4xl font-semibold tracking-tight">
            {formatCurrency(cents)}
          </span>
          <span className="text-sm text-muted-foreground">/year</span>
        </div>
        <Badge variant="soft" className="rounded-full px-2 py-0.5 text-[11px]">
          2 months free
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex items-baseline gap-1.5">
      <span className="font-display text-4xl font-semibold tracking-tight">
        {formatCurrency(cents)}
      </span>
      <span className="text-sm text-muted-foreground">/{per}</span>
    </div>
  );
}

function PlanCard({ plan, interval, isAuthenticated }: { plan: Plan; interval: BillingInterval; isAuthenticated: boolean }) {
  const isPro = plan.code === "pro";
  const ctaHref = isAuthenticated ? "/settings" : "/register";
  const ctaLabel = CTA_LABEL[plan.code] ?? "Choose plan";

  return (
    <div
      className={cn(
        "relative flex h-full flex-col rounded-xl border bg-card p-6 shadow-subtle transition-shadow",
        isPro
          ? "border-primary/40 ring-2 ring-primary/30"
          : "border-border/80 hover:border-border",
      )}
    >
      {isPro ? (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[11px] uppercase tracking-wide">
          Most popular
        </Badge>
      ) : null}

      <h3 className="font-display text-xl font-semibold tracking-tight">{plan.name}</h3>

      <div className="mt-4">
        <PriceDisplay plan={plan} interval={interval} />
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        {plan.monthly_credits > 0 ? (
          <>
            <span className="font-medium text-foreground">{formatNumber(plan.monthly_credits)}</span>{" "}
            credits every month
          </>
        ) : (
          "Institution-managed access"
        )}
      </p>

      <div className="my-6 h-px bg-border/70" />

      <ul className="flex-1 space-y-2.5">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" />
            <span className="text-foreground/90">{feature}</span>
          </li>
        ))}
      </ul>

      <Button asChild variant={isPro ? "default" : "outline"} className="mt-8 w-full">
        <Link href={ctaHref}>
          {ctaLabel} <ArrowRight className="size-4" />
        </Link>
      </Button>
    </div>
  );
}

export default function PricingPage() {
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [interval, setInterval] = React.useState<BillingInterval>("month");
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  React.useEffect(() => {
    let disposed = false;

    async function load() {
      try {
        const supabase = createClient();
        const [{ data, error: plansError }, authResult] = await Promise.all([
          supabase
            .from("plans")
            .select("*")
            .eq("is_active", true)
            .order("price_cents_month", { ascending: true }),
          supabase.auth.getUser(),
        ]);

        if (disposed) return;

        if (plansError) {
          setError(plansError.message || "Unable to load plans.");
          return;
        }

        setPlans((data ?? []) as Plan[]);
        setIsAuthenticated(Boolean(authResult.data.user));
      } catch {
        if (!disposed) {
          setError("Unable to load plans. Please try again shortly.");
        }
      } finally {
        if (!disposed) setLoading(false);
      }
    }

    void load();
    return () => {
      disposed = true;
    };
  }, []);

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
        <section className="relative mx-auto max-w-6xl px-4 pt-16 text-center sm:pt-24">
          <div className="pointer-events-none absolute inset-0 -z-10 grid-clinical opacity-40" />
          <StaggerGroup>
            <StaggerItem>
              <Badge variant="secondary" className="mb-6 rounded-full px-3 py-1 text-xs">
                <Sparkles className="mr-1 size-3" /> Simple, transparent plans
              </Badge>
            </StaggerItem>
            <StaggerItem>
              <h1 className="mx-auto max-w-2xl font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                Study smarter with a plan that{" "}
                <span className="text-gradient-brand">fits your budget</span>.
              </h1>
            </StaggerItem>
            <StaggerItem>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                Start free and upgrade when you&apos;re ready. Every plan unlocks the
                full study loop — tutoring, notes, flashcards, MCQs and clinical
                cases.
              </p>
            </StaggerItem>
          </StaggerGroup>
        </section>

        {/* Billing toggle */}
        <section className="mx-auto mt-12 max-w-6xl px-4">
          <div className="flex flex-col items-center gap-3">
            <div
              className="inline-flex items-center gap-1 rounded-full border bg-muted p-1"
              role="group"
              aria-label="Billing interval"
            >
              <button
                type="button"
                onClick={() => setInterval("month")}
                aria-pressed={interval === "month"}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  interval === "month"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setInterval("year")}
                aria-pressed={interval === "year"}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  interval === "year"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Annual
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Save around 20% with annual billing · 2 months free
            </p>
          </div>
        </section>

        {/* Plan cards */}
        <section className="mx-auto max-w-6xl px-4 pt-10">
          {error ? (
            <div className="rounded-xl border border-border/80 bg-card p-6 text-center shadow-subtle">
              <p className="text-sm text-destructive">{error}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                In the meantime, you can start with our free tier.
              </p>
              <Button asChild className="mt-4">
                <Link href="/register">Start free</Link>
              </Button>
            </div>
          ) : loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <PlanSkeleton key={i} />
              ))}
            </div>
          ) : plans.length === 0 ? (
            <div className="rounded-xl border border-border/80 bg-card p-6 text-center shadow-subtle">
              <p className="text-sm text-muted-foreground">
                No plans are available right now. Please check back soon.
              </p>
            </div>
          ) : (
            <StaggerGroup className="grid gap-5 pt-2 sm:grid-cols-2 lg:grid-cols-4">
              {plans.map((plan) => (
                <StaggerItem key={plan.id} className="h-full">
                  <PlanCard
                    plan={plan}
                    interval={interval}
                    isAuthenticated={isAuthenticated}
                  />
                </StaggerItem>
              ))}
            </StaggerGroup>
          )}

          <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-muted-foreground">
            Payments are managed by your institution or via credits for individual
            plans. No card required to get started.
          </p>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-4 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight">
              Frequently asked questions
            </h2>
            <p className="mt-3 text-muted-foreground">
              Everything you need to know about plans, credits and billing.
            </p>
          </div>
          <Accordion type="single" collapsible className="mt-10">
            {FAQS.map((faq, index) => (
              <AccordionItem key={faq.question} value={`faq-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
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
            <Link href="/pricing#faq" className="hover:text-foreground">FAQ</Link>
            <Link href="/login" className="hover:text-foreground">Log in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
