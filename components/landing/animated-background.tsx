"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Ambient animated background: slow-shifting gradient meshes plus a faint
 * clinical grid. Respects reduced-motion by rendering a static version.
 */
export function AnimatedBackground() {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_15%_10%,hsl(var(--primary)/0.14),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_90%_20%,hsl(var(--clinical)/0.10),transparent_60%)]" />
        <div className="absolute inset-0 grid-clinical opacity-30" />
      </div>
    );
  }

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* base tint */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_15%_10%,hsl(var(--primary)/0.16),transparent_60%)]" />

      <motion.div
        className="absolute left-[-10%] top-[-15%] h-[50rem] w-[50rem] rounded-full blur-3xl"
        style={{ background: "hsl(var(--primary) / 0.14)" }}
        animate={{ x: [0, 80, 0], y: [0, 40, 0], scale: [1, 1.12, 1] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[-12%] top-[10%] h-[40rem] w-[40rem] rounded-full blur-3xl"
        style={{ background: "hsl(var(--clinical) / 0.12)" }}
        animate={{ x: [0, -70, 0], y: [0, 60, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-20%] left-[30%] h-[36rem] w-[36rem] rounded-full blur-3xl"
        style={{ background: "hsl(var(--accent) / 0.10)" }}
        animate={{ x: [0, 60, 0], y: [0, -40, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* grid with static fade */}
      <div className="absolute inset-0 grid-clinical opacity-30" />

      {/* top edge glow line */}
      <motion.div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, hsl(var(--clinical)/0.5), transparent)" }}
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
