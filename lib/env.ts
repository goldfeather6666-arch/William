/**
 * Environment access.
 *
 * Nothing here throws at module import time: the production build runs without
 * secrets, and pages must degrade to an explicit "setup required" state instead
 * of failing the whole build. Server-only values are read lazily on demand.
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

function read(name: string): string | undefined {
  const value = process.env[name];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export const publicEnv = {
  get supabaseUrl(): string | undefined {
    return read("NEXT_PUBLIC_SUPABASE_URL");
  },
  get supabaseAnonKey(): string | undefined {
    return read("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  },
  get siteUrl(): string | undefined {
    return read("NEXT_PUBLIC_SITE_URL");
  },
};

export function isSupabaseConfigured(): boolean {
  return Boolean(publicEnv.supabaseUrl && publicEnv.supabaseAnonKey);
}

export function requireSupabasePublicConfig(): { url: string; anonKey: string } {
  const missing: string[] = [];
  const url = publicEnv.supabaseUrl;
  const anonKey = publicEnv.supabaseAnonKey;
  if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!anonKey) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!url || !anonKey) {
    throw new ConfigurationError(missing, "Supabase");
  }
  return { url, anonKey };
}

export function supabaseServiceRoleKey(): string | undefined {
  return read("SUPABASE_SERVICE_ROLE_KEY");
}

export function requireServiceRoleKey(): string {
  const key = supabaseServiceRoleKey();
  if (!key) throw new ConfigurationError(["SUPABASE_SERVICE_ROLE_KEY"], "privileged server operations");
  return key;
}

/** 32-byte base64 key used to encrypt user-supplied AI provider keys (AES-256-GCM). */
export function keyEncryptionSecret(): string | undefined {
  return read("AI_KEY_ENCRYPTION_SECRET");
}

export function siteUrl(): string {
  const explicit = publicEnv.siteUrl ?? read("SITE_URL");
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = read("VERCEL_URL");
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
  const openai = read("OPENAI_API_KEY");
  if (openai) result.openai = { apiKey: openai, baseUrl: read("OPENAI_BASE_URL"), model: read("OPENAI_MODEL") };
  const anthropic = read("ANTHROPIC_API_KEY");
  if (anthropic) {
    result.anthropic = { apiKey: anthropic, baseUrl: read("ANTHROPIC_BASE_URL"), model: read("ANTHROPIC_MODEL") };
  }
  const gemini = read("GEMINI_API_KEY") ?? read("GOOGLE_AI_API_KEY");
  if (gemini) result.gemini = { apiKey: gemini, baseUrl: read("GEMINI_BASE_URL"), model: read("GEMINI_MODEL") };
  const deepseek = read("DEEPSEEK_API_KEY");
  if (deepseek) result.deepseek = { apiKey: deepseek, baseUrl: read("DEEPSEEK_BASE_URL"), model: read("DEEPSEEK_MODEL") };
  const openrouter = read("OPENROUTER_API_KEY");
  if (openrouter) {
    result.openrouter = { apiKey: openrouter, baseUrl: read("OPENROUTER_BASE_URL"), model: read("OPENROUTER_MODEL") };
  }
  const custom = read("CUSTOM_AI_API_KEY");
  const customBase = read("CUSTOM_AI_BASE_URL");
  if (custom && customBase) result.custom = { apiKey: custom, baseUrl: customBase, model: read("CUSTOM_AI_MODEL") };
  return result;
}

export function isAiConfigured(): boolean {
  return Object.keys(platformProviderKeys()).length > 0;
}

export function paymentsProvider(): "disabled" | "manual" {
  const provider = read("PAYMENTS_PROVIDER");
  return provider === "manual" ? "manual" : "disabled";
}

export function ocrEndpoint(): string | undefined {
  return read("OCR_ENDPOINT_URL");
}
