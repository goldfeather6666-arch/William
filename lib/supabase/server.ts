import { createServerClient } from "@supabase/ssr";
import type { SetAllCookies } from "@supabase/ssr/dist/module/types";
import { cookies } from "next/headers";
import { requireSupabasePublicConfig } from "@/lib/env";

/**
 * Supabase server client that reads/writes auth cookies via next/headers.
 * Called inside route handlers / server components / server actions.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, key } = requireSupabasePublicConfig();

  const setAll: SetAllCookies = (cookiesToSet) => {
    try {
      cookiesToSet.forEach(({ name, value, options }) => {
        cookieStore.set(name, value, options);
      });
    } catch {
      // Called from a Server Component; the middleware already refreshed
      // the session, so the response cookies can be safely ignored.
    }
  };

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll,
    },
  });
}

/** Returns the signed-in user or null. Never throws when Supabase is unconfigured. */
export async function getCurrentUser() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}
