"use server";

import crypto from "node:crypto";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { keyEncryptionSecret } from "@/lib/env";
import type { AiProviderId } from "@/lib/types";

const providerSchema = z.object({
  provider: z.enum(["openai", "anthropic", "gemini", "deepseek", "openrouter", "custom"]),
  label: z.string().min(1).max(80),
  baseUrl: z.string().url().optional().or(z.literal("")),
  model: z.string().min(1).optional(),
  apiKey: z.string().min(8),
});

function encrypt(plain: string, secret: string): string {
  const key = Buffer.from(secret, "base64");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${Buffer.concat([enc, tag]).toString("base64")}`;
}

export async function saveProviderConfig(input: {
  provider: AiProviderId;
  label: string;
  baseUrl?: string;
  model?: string;
  apiKey: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const secret = keyEncryptionSecret();
  if (!secret) {
    return { ok: false, error: "AI_KEY_ENCRYPTION_SECRET is not set, so keys cannot be stored safely." };
  }
  const parsed = providerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid provider details." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Unauthorized" };

  const baseUrl = parsed.data.baseUrl?.trim() || null;
  const model = parsed.data.model?.trim() || null;
  const encryptedKey = encrypt(parsed.data.apiKey.trim(), secret);

  // Deactivate existing configs for this user, then insert the new one.
  await supabase.from("ai_provider_configs").update({ is_active: false }).eq("user_id", user.id);

  const { error } = await supabase.from("ai_provider_configs").insert({
    user_id: user.id,
    provider: parsed.data.provider,
    label: parsed.data.label,
    base_url: baseUrl,
    model,
    encrypted_key: encryptedKey,
    is_active: true,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
