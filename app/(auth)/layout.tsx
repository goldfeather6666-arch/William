import Link from "next/link";
import { Stethoscope } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="pointer-events-none absolute inset-0 grid-clinical opacity-60" />
      <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-12">
        <Link href="/" className="mb-8 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Stethoscope className="h-4 w-4" />
          </span>
          <span className="font-display text-xl font-semibold">MedCoach AI</span>
        </Link>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
