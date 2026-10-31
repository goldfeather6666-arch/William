import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./register-form";
import { Logo } from "@/components/common/logo";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "Create account",
};

export default function RegisterPage() {
  const configured = isSupabaseConfigured();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-4">
          <Logo size="lg" />
          <div className="text-center">
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              Start with MedCoach
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your account to begin your study plan.
            </p>
          </div>
          {!configured ? (
            <div className="w-full rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-center text-xs text-amber-700 dark:text-amber-300">
              Supabase is not configured on this deployment. Set{" "}
              <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
              in your environment, then redeploy.
            </div>
          ) : null}
        </div>
        <RegisterForm />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
