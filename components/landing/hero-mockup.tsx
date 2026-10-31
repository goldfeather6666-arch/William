"use client";

import { motion, useReducedMotion } from "framer-motion";
import { TiltCard } from "./tilt-card";
import { Badge } from "@/components/ui/badge";

/**
 * Stylized, purely-presentational product mockup for the landing hero. It
 * depicts the AI tutor workspace — NOT a live functional replica.
 */
export function HeroMockup() {
  const reduce = useReducedMotion();

  const bubble = (className: string, delay = 0) => (
    <motion.div
      className={className}
      initial={reduce ? undefined : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
    />
  );

  return (
    <TiltCard maxTilt={7} className="rounded-2xl border border-border/70 bg-card/90 shadow-lifted backdrop-blur">
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-border/70 px-4 py-3">
        <span className="size-2.5 rounded-full bg-destructive/70" />
        <span className="size-2.5 rounded-full bg-caution/70" />
        <span className="size-2.5 rounded-full bg-primary/40" />
        <div className="ml-3 flex-1 rounded-md bg-muted/70 px-3 py-1 text-[11px] text-muted-foreground">
          AI Tutor — Cardiology
        </div>
      </div>

      {/* Conversation body */}
      <div className="space-y-3 p-4">
        {/* user bubble */}
        <div className="flex justify-end">
          <div className="max-w-[75%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-[13px] text-primary-foreground">
            Explain the cardiac cycle, step by step.
          </div>
        </div>

        {/* assistant bubble + streaming effect */}
        <div className="flex justify-start">
          <div className="max-w-[82%] space-y-2 rounded-2xl rounded-bl-sm border border-border/70 bg-muted/50 px-3.5 py-2.5 text-[13px] leading-relaxed text-foreground">
            <p>
              The cardiac cycle has two phases — <strong>diastole</strong> (relaxation) and{" "}
              <strong>systole</strong> (contraction)…
            </p>
            <p className="text-muted-foreground">Let’s walk through each step with pressures and valve timing.</p>
            {!reduce ? (
              <div className="flex gap-1 pt-0.5">
                <motion.span
                  className="size-1.5 rounded-full bg-primary"
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.span
                  className="size-1.5 rounded-full bg-primary"
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 1.1, repeat: Infinity, delay: 0.18, ease: "easeInOut" }}
                />
                <motion.span
                  className="size-1.5 rounded-full bg-primary"
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 1.1, repeat: Infinity, delay: 0.36, ease: "easeInOut" }}
                />
              </div>
            ) : null}
          </div>
        </div>

        {/* mode chips */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {(["Beginner", "MBBS Exam", "Clinical", "Viva", "Quick Revision"] as const).map((mode, i) => (
            <motion.div
              key={mode}
              initial={reduce ? undefined : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.5 + i * 0.06 }}
            >
              <Badge variant={i === 0 ? "soft" : "outline"} className="text-[11px]">
                {mode}
              </Badge>
            </motion.div>
          ))}
        </div>

        {/* citation card */}
        {bubble("rounded-xl border border-border/60 bg-card px-3 py-2", 0.8)}
        <div className="rounded-xl border border-border/60 bg-card px-3.5 py-2.5 text-[12px] text-muted-foreground">
          <span className="font-medium text-foreground">Sources</span> · Harrison’s Principles (Ch. 24) · Guyton (Ch. 9)
        </div>
      </div>
    </TiltCard>
  );
}
