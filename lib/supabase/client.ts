"use client";

import { createBrowserClient } from "@supabase/ssr";
import { requireSupabasePublicConfig } from "@/lib/env";

let cached: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Supabase browser client. Requires NEXT_PUBLIC_SUPABASE_URL and either
 * NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * Throws only when first used without config, so the production build can
 * proceed with a degraded UI otherwise.
 */
export function createClient() {
  if (cached) return cached;
  const { url, key } = requireSupabasePublicConfig();
  cached = createBrowserClient(url, key);
  return cached;
}
