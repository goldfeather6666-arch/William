import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { Logo } from "@/components/common/logo";
import { MAIN_NAV, ACCOUNT_NAV } from "@/lib/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

async function getProfile(userId: string): Promise<Profile | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error || !data) return null;
    return data as Profile;
  } catch {
    return null;
  }
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");

  const profile = await getProfile(user.id);
  // Missing profile (e.g. pre-trigger) → route through onboarding/profile creation.
  if (!profile) redirect("/onboarding");

  const items = [...MAIN_NAV, ...ACCOUNT_NAV].map((item) => ({
    ...item,
  }));

  return (
    <AppShell
      items={items}
      user={profile}
      header={<Logo size="md" />}
    >
      {children}
    </AppShell>
  );
}
