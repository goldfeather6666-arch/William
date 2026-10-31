import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "./forgot-password-form";
import { Logo } from "@/components/common/logo";

export const metadata: Metadata = {
  title: "Reset password",
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-4">
          <Logo size="lg" />
          <div className="text-center">
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              Reset your password
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              We will email you a secure reset link.
            </p>
          </div>
        </div>
        <ForgotPasswordForm />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
