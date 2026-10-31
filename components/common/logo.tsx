import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
}

const MARK_SIZES = {
  sm: "size-7",
  md: "size-9",
  lg: "size-11",
} as const;

const TEXT_SIZES = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-xl",
} as const;

export function Logo({
  size = "md",
  showWordmark = true,
  className,
}: LogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <svg
        viewBox="0 0 40 40"
        className={MARK_SIZES[size]}
        aria-hidden="true"
        focusable="false"
      >
        <rect width="40" height="40" rx="12" fill="hsl(var(--primary))" />
        <rect
          x="1"
          y="1"
          width="38"
          height="38"
          rx="11"
          fill="none"
          stroke="hsl(var(--primary) / 0.3)"
          strokeWidth="1.5"
        />
        <path
          d="M4 21h8l3-6 4 12 4-8 4 6 3-4h6"
          fill="none"
          stroke="hsl(var(--primary-foreground))"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showWordmark ? (
        <span
          className={cn(
            "font-display font-semibold tracking-tight text-foreground",
            TEXT_SIZES[size],
          )}
        >
          MedCoach <span className="text-primary">AI</span>
        </span>
      ) : null}
    </div>
  );
}
