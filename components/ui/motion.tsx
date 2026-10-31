"use client";

import * as React from "react";
import {
  animate,
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";

import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* MotionCard                                                          */
/* ------------------------------------------------------------------ */

interface MotionCardProps extends React.ComponentPropsWithoutRef<typeof motion.div> {
  delay?: number;
}

function MotionCard({ className, delay = 0, ...props }: MotionCardProps) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn("rounded-xl border bg-card text-card-foreground shadow-subtle", className)}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------ */
/* AnimatedPage                                                        */
/* ------------------------------------------------------------------ */

function AnimatedPage({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof motion.div>) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* StaggerGroup / StaggerItem                                          */
/* ------------------------------------------------------------------ */

const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

function StaggerGroup({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof motion.div>) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      variants={staggerContainer}
      initial={reduceMotion ? false : "hidden"}
      animate="show"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

function StaggerItem({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof motion.div>) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div variants={reduceMotion ? undefined : staggerItem} className={className} {...props}>
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* AnimatedNumber                                                      */
/* ------------------------------------------------------------------ */

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
  format?: (value: number) => string;
  className?: string;
}

function AnimatedNumber({
  value,
  duration = 0.6,
  decimals = 0,
  format = (n: number) => String(n),
  className,
}: AnimatedNumberProps) {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = React.useState<number>(reduceMotion ? value : 0);
  const previousRef = React.useRef(0);

  React.useEffect(() => {
    if (reduceMotion) {
      previousRef.current = value;
      setDisplay(value);
      return;
    }
    const controls = animate(previousRef.current, value, {
      duration,
      ease: "easeOut",
      onUpdate: (latest) => setDisplay(latest),
      onComplete: () => {
        previousRef.current = value;
        setDisplay(value);
      },
    });
    return () => controls.stop();
  }, [value, duration, reduceMotion]);

  const rounded = decimals > 0 ? Number(display.toFixed(decimals)) : Math.round(display);
  return <span className={className}>{format(rounded)}</span>;
}

export { MotionCard, AnimatedPage, StaggerGroup, StaggerItem, AnimatedNumber };
