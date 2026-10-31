import crypto from "node:crypto";
import { platformProviderKeys, keyEncryptionSecret, type ProviderId, type ProviderEnvDefaults } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { AiProviderConfigRow } from "@/lib/types";

export const KNOWN_PROVIDERS: { id: ProviderId; label: string; defaultModel: string; behavior: "openai" | "anthropic" }[] = [
  { id: "openai", label: "OpenAI", defaultModel: "gpt-4o-mini", behavior: "openai" },
  { id: "anthropic", label: "Anthropic", defaultModel: "claude-3-5-sonnet-latest", behavior: "anthropic" },
  { id: "gemini", label: "Gemini", defaultModel: "gemini-2.0-flash", behavior: "openai" },
  { id: "deepseek", label: "DeepSeek", defaultModel: "deepseek-chat", behavior: "openai" },
  { id: "openrouter", label: "OpenRouter", defaultModel: "openai/gpt-4o-mini", behavior: "openai" },
  { id: "custom", label: "Custom", defaultModel: "", behavior: "openai" },
];

export interface ResolvedProvider {
  /** Provider id from the KNOWN_PROVIDERS list. */
  id: ProviderId;
  label: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  behavior: "openai" | "anthropic";
}

function decrypt(encoded: string, secret: string): string {
  const [ivB64, dataB64] = encoded.split(".");
  if (!ivB64 || !dataB64) throw new Error("Malformed encrypted key");
  const iv = Buffer.from(ivB64, "base64");
  const data = Buffer.from(dataB64, "base64");
  const key = Buffer.from(secret, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  const tag = data.subarray(data.length - 16);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data.subarray(0, data.length - 16)), decipher.final()]).toString("utf8");
}

function fromEnv(): ResolvedProvider | null {
  const defaults = platformProviderKeys();
  const order: { id: ProviderId; env?: ProviderEnvDefaults; behavior: "openai" | "anthropic" }[] = [
    { id: "openai", env: defaults.openai, behavior: "openai" },
    { id: "anthropic", env: defaults.anthropic, behavior: "anthropic" },
    { id: "gemini", env: defaults.gemini, behavior: "openai" },
    { id: "deepseek", env: defaults.deepseek, behavior: "openai" },
    { id: "openrouter", env: defaults.openrouter, behavior: "openai" },
    { id: "custom", env: defaults.custom, behavior: "openai" },
  ];
  for (const p of order) {
    if (!p.env?.apiKey) continue;
    const known = KNOWN_PROVIDERS.find((k) => k.id === p.id);
    return {
      id: p.id,
      label: known?.label ?? p.id,
      baseUrl: (p.env.baseUrl ?? defaultBaseUrl(p.id)).replace(/\/$/, ""),
      apiKey: p.env.apiKey,
      model: p.env.model ?? (p.id === "custom" ? "" : known?.defaultModel ?? ""),
      behavior: p.behavior,
    };
  }
  return null;
}

function defaultBaseUrl(id: ProviderId): string {
  switch (id) {
    case "deepseek":
      return "https://api.deepseek.com/v1";
    case "openrouter":
      return "https://openrouter.ai/api/v1";
    case "anthropic":
      return "https://api.anthropic.com";
    case "gemini":
      return "https://generativelanguage.googleapis.com/v1beta/openai";
    default:
      return "https://api.openai.com/v1";
  }
}

/**
 * Resolve a provider for a request: highest priority is the user's active
 * provider configuration (decrypted), then platform-managed env keys.
 */
export async function resolveProvider(userId?: string): Promise<ResolvedProvider | null> {
  if (userId) {
    try {
      const supabase = await createClient();
      const secret = keyEncryptionSecret();
      if (secret) {
        const { data } = await supabase
          .from("ai_provider_configs")
          .select("*")
          .eq("user_id", userId)
          .eq("is_active", true)
          .limit(1);
        const cfg = (data as AiProviderConfigRow[] | null)?.[0];
        if (cfg) {
          let key: string;
          try {
            key = decrypt(cfg.encrypted_key, secret);
          } catch {
            key = "";
          }
          if (key) {
            const known = KNOWN_PROVIDERS.find((k) => k.id === cfg.provider);
            const baseUrl = cfg.base_url?.replace(/\/$/, "") ?? defaultBaseUrl(cfg.provider);
            const model = cfg.model ?? known?.defaultModel ?? "";
            if (baseUrl && model) {
              return {
                id: cfg.provider,
                label: cfg.label,
                baseUrl,
                apiKey: key,
                model,
                behavior: known?.behavior ?? "openai",
              };
            }
          }
        }
      }
    } catch {
      // fall through to platform keys
    }
  }
  return fromEnv();
}

/** Warm an OpenAI-compatible chat completions request. */
export function openAiChatEndpoint(baseUrl: string) {
  return `${baseUrl}/chat/completions`;
}
