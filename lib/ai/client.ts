import type { ResolvedProvider } from "./providers";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export interface GenerationResult {
  text: string;
  promptTokens: number;
  completionTokens: number;
}

function errorFromResponse(status: number, body: string): Error {
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string } };
    if (parsed.error?.message) return new Error(parsed.error.message);
  } catch {
    // fall through
  }
  return new Error(`AI provider returned HTTP ${status}`);
}

/** Non-streaming chat completion over OpenAI-compatible and Anthropic endpoints. */
export async function generateText(
  provider: ResolvedProvider,
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number },
): Promise<GenerationResult> {
  const body =
    provider.behavior === "anthropic"
      ? {
          model: provider.model,
          max_tokens: options?.maxTokens ?? 1024,
          system: messages.filter((m) => m.role === "system").map((m) => m.content).join("\n"),
          messages: messages.filter((m) => m.role !== "system").map((m) => ({ role: m.role, content: m.content })),
        }
      : {
          model: provider.model,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          temperature: options?.temperature ?? 0.4,
          max_tokens: options?.maxTokens ?? 1024,
          stream: false,
        };

  const endpoint = provider.behavior === "anthropic" ? `${provider.baseUrl}/v1/messages` : `${provider.baseUrl}/chat/completions`;

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provider.apiKey}`,
        ...(provider.behavior === "anthropic" ? { "anthropic-version": "2023-06-01" } : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120_000),
    });
  } catch (e) {
    throw new Error(`Failed to reach AI provider: ${e instanceof Error ? e.message : "network error"}`);
  }

  const raw = await res.text();
  if (!res.ok) throw errorFromResponse(res.status, raw);

  if (provider.behavior === "anthropic") {
    const data = JSON.parse(raw) as { content: { text?: string }[]; usage?: { input_tokens: number; output_tokens: number } };
    return {
      text: (data.content ?? []).map((c) => c.text ?? "").join(""),
      promptTokens: data.usage?.input_tokens ?? 0,
      completionTokens: data.usage?.output_tokens ?? 0,
    };
  }

  const data = JSON.parse(raw) as {
    choices?: { message?: { content?: string } }[];
    usage?: { prompt_tokens: number; completion_tokens: number };
  };
  return {
    text: data.choices?.[0]?.message?.content ?? "",
    promptTokens: data.usage?.prompt_tokens ?? 0,
    completionTokens: data.usage?.completion_tokens ?? 0,
  };
}
