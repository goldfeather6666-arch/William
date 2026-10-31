/**
 * Environment access.
 *
 * IMPORTANT: NEXT_PUBLIC_* values are inlined by Next.js/webpack AT BUILD TIME
 * into the browser bundle. For that to happen they must be referenced as static
 * property literals (process.env.NEXT_PUBLIC_FOO). A dynamic index lookup
 * (process.env[name]) cannot be statically analyzed, so webpack leaves it as a
 * runtime lookup — and since process.env does not exist in the browser, the
 * value resolves to undefined. That is the root cause of the "Missing
 * configuration for Supabase" error on deployed previews even when the
 * variables are set in Vercel.
 *
 * Therefore the public accessors below use ONLY static references. Server-only
 * values are read lazily at runtime on Node (where process.env exists), so a
 * dynamic helper is safe for those.
 */

export class ConfigurationError extends Error {
  readonly code = "CONFIGURATION_MISSING";
  readonly missing: string[];

  constructor(missing: string[], context: string) {
    super(`Missing configuration for ${context}: ${missing.join(", ")}`);
    this.name = "ConfigurationError";
    this.missing = missing;
  }
}

function readServer(name: string): string | undefined {
  // Server-only dynamic lookup is fine: this runs on Node where process.env is
  // populated at runtime by the platform. Never use this for NEXT_PUBLIC_*.
  const value = process.env[name];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function trimToken(value: string | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Public environment values consumed by browser code. These use STATIC
 * process.env property references so webpack inlines them into the client
 * bundle at build time.
 */
export const publicEnv = {
  get supabaseUrl(): string | undefined {
    return trimToken(process.env.NEXT_PUBLIC_SUPABASE_URL);
  },
  get supabaseAnonKey(): string | undefined {
    return trimToken(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  },
  get supabasePublishableKey(): string | undefined {
    return trimToken(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  },
  /**
   * The Supabase key to use for browser/server public clients. Prefers the
   * modern `publishable` key and falls back to the legacy `anon` key.
   */
  get supabaseKey(): string | undefined {
    return this.supabasePublishableKey ?? this.supabaseAnonKey;
  },
  get siteUrl(): string | undefined {
    return trimToken(process.env.NEXT_PUBLIC_SITE_URL);
  },
};

export function isSupabaseConfigured(): boolean {
  return Boolean(publicEnv.supabaseUrl && publicEnv.supabaseKey);
}

export function requireSupabasePublicConfig(): { url: string; key: string } {
  const missing: string[] = [];
  const url = publicEnv.supabaseUrl;
  const key = publicEnv.supabaseKey;
  if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!key) {
    missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  if (!url || !key) {
    throw new ConfigurationError(missing, "Supabase");
  }
  return { url, key };
}

export function supabaseServiceRoleKey(): string | undefined {
  return readServer("SUPABASE_SERVICE_ROLE_KEY");
}

export function requireServiceRoleKey(): string {
  const key = supabaseServiceRoleKey();
  if (!key) throw new ConfigurationError(["SUPABASE_SERVICE_ROLE_KEY"], "privileged server operations");
  return key;
}

/** 32-byte base64 key used to encrypt user-supplied AI provider keys (AES-256-GCM). */
export function keyEncryptionSecret(): string | undefined {
  return readServer("AI_KEY_ENCRYPTION_SECRET");
}

export function siteUrl(): string {
  const explicit = publicEnv.siteUrl ?? readServer("SITE_URL");
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = readServer("VERCEL_URL");
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;
  return "http://localhost:3000";
}

export type ProviderId = "openai" | "anthropic" | "gemini" | "deepseek" | "openrouter" | "custom";

export interface ProviderEnvDefaults {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

/** Platform-managed provider keys. Absent values simply remove a fallback candidate. */
export function platformProviderKeys(): Partial<Record<ProviderId, ProviderEnvDefaults>> {
  const result: Partial<Record<ProviderId, ProviderEnvDefaults>> = {};
  const openai = readServer("OPENAI_API_KEY");
  if (openai) result.openai = { apiKey: openai, baseUrl: readServer("OPENAI_BASE_URL"), model: readServer("OPENAI_MODEL") };
  const anthropic = readServer("ANTHROPIC_API_KEY");
  if (anthropic) {
    result.anthropic = { apiKey: anthropic, baseUrl: readServer("ANTHROPIC_BASE_URL"), model: readServer("ANTHROPIC_MODEL") };
  }
  const gemini = readServer("GEMINI_API_KEY") ?? readServer("GOOGLE_AI_API_KEY");
  if (gemini) result.gemini = { apiKey: gemini, baseUrl: readServer("GEMINI_BASE_URL"), model: readServer("GEMINI_MODEL") };
  const deepseek = readServer("DEEPSEEK_API_KEY");
  if (deepseek) result.deepseek = { apiKey: deepseek, baseUrl: readServer("DEEPSEEK_BASE_URL"), model: readServer("DEEPSEEK_MODEL") };
  const openrouter = readServer("OPENROUTER_API_KEY");
  if (openrouter) {
    result.openrouter = { apiKey: openrouter, baseUrl: readServer("OPENROUTER_BASE_URL"), model: readServer("OPENROUTER_MODEL") };
  }
  const custom = readServer("CUSTOM_AI_API_KEY");
  const customBase = readServer("CUSTOM_AI_BASE_URL");
  if (custom && customBase) result.custom = { apiKey: custom, baseUrl: customBase, model: readServer("CUSTOM_AI_MODEL") };
  return result;
}

export function isAiConfigured(): boolean {
  return Object.keys(platformProviderKeys()).length > 0;
}

export function paymentsProvider(): "disabled" | "manual" {
  const provider = readServer("PAYMENTS_PROVIDER");
  return provider === "manual" ? "manual" : "disabled";
}

export function ocrEndpoint(): string | undefined {
  return readServer("OCR_ENDPOINT_URL");
}
