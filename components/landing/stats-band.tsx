"use client";

import { AnimatedNumber } from "@/components/ui/motion";

const STATS = [
  { value: 38, suffix: "+", label: "Learning modules & tools" },
  { value: 100, suffix: "K+", label: "Flashcards reviewed" },
  { value: 12, suffix: "+", label: "Curricula supported" },
  { value: 99.9, suffix: "%", label: "Uptime (hosted)" },
];

export function StatsBand() {
  return (
    <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
      {STATS.map((stat) => (
        <div key={stat.label} className="text-center">
          <div className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            <AnimatedNumber value={stat.value} decimals={stat.suffix === "%" ? 1 : 0} />
            {stat.suffix}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
