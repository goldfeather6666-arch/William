import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";

/**
 * Layout for the onboarding flow. Unlike the main `(app)` layout, this only
 * requires an authenticated user — NOT an existing profile row. This prevents
 * an infinite redirect between `/dashboard` (profile-gated) and `/onboarding`
 * for brand-new accounts whose profile row has not been created yet.
 */
export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/onboarding");
  return <div className="min-h-screen bg-background">{children}</div>;
}
