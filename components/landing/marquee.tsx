"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export function Marquee({
  items,
  className,
}: {
  items: string[];
  className?: string;
}) {
  const reduce = useReducedMotion();
  const row = (
    <div className="flex shrink-0 items-center gap-3 pr-3">
      {items.map((item, index) => (
        <span
          key={item}
          className={cn(
            "whitespace-nowrap rounded-full border border-border/70 bg-card/70 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur",
            index % 3 === 0 && "text-foreground",
          )}
        >
          {item}
        </span>
      ))}
    </div>
  );

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent" />
      {reduce ? (
        <div className="flex flex-wrap justify-center gap-3">
          {items.map((item) => (
            <span key={item} className="whitespace-nowrap rounded-full border px-4 py-1.5 text-sm text-muted-foreground">
              {item}
            </span>
          ))}
        </div>
      ) : (
        <div className="flex w-max">
          <motion.div
            className="flex"
            animate={{ x: ["0%", "-100%"] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          >
            {row}
            {row}
            {row}
            {row}
          </motion.div>
        </div>
      )}
    </div>
  );
}
