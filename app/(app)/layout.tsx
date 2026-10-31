import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { AppShell } from "@/components/shell/app-shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <AppShell
      user={{
        email: user.email ?? undefined,
        name: (user.user_metadata?.full_name as string | undefined) ?? undefined,
      }}
    >
      {children}
    </AppShell>
  );
}
