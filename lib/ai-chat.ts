import { GoogleGenerativeAI } from "@google/generative-ai";
import { getGeminiModelId } from "@/lib/gemini-model";
import {
  getAnthropicModel,
  getGroqModel,
  isAnthropicConfigured,
  isGeminiConfigured,
  isGroqConfigured,
  isOpenAiConfigured,
  normalizeAiProviderId,
  type AiProviderId,
} from "@/lib/ai-providers";
import { getAiChatSystemPrefix } from "@/lib/i18n/ai-prompts";

export async function runAiChat(
  providerRaw: string | undefined,
  userPrompt: string,
  contextJson: string,
  locale: string,
): Promise<{ text: string; provider: AiProviderId }> {
  const provider = normalizeAiProviderId(providerRaw);

  const systemPrefix = getAiChatSystemPrefix(contextJson, locale);

  if (provider === "openai") {
    if (!isOpenAiConfigured()) throw new Error("חסר OPENAI_API_KEY");
    const key = process.env.OPENAI_API_KEY!.trim();
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_CHAT_MODEL?.trim() || "gpt-4o-mini",
        max_tokens: 2048,
        messages: [{ role: "user", content: systemPrefix + userPrompt }],
      }),
    });
    if (!res.ok) throw new Error((await res.text()).slice(0, 400));
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content ?? "";
    return { text, provider: "openai" };
  }

  if (provider === "anthropic") {
    if (!isAnthropicConfigured()) throw new Error("חסר ANTHROPIC_API_KEY");
    const key = process.env.ANTHROPIC_API_KEY!.trim();
    const model = getAnthropicModel();
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 2048,
        messages: [{ role: "user", content: systemPrefix + userPrompt }],
      }),
    });
    if (!res.ok) throw new Error((await res.text()).slice(0, 400));
    const data = (await res.json()) as {
      content?: Array<{ type?: string; text?: string }>;
    };
    const text = data.content?.find((b) => b.type === "text")?.text ?? "";
    return { text, provider: "anthropic" };
  }

  if (provider === "groq") {
    if (!isGroqConfigured()) throw new Error("חסר GROQ_API_KEY");
    const key = process.env.GROQ_API_KEY!.trim();
    const model = getGroqModel();
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 2048,
        messages: [{ role: "user", content: systemPrefix + userPrompt }],
      }),
    });
    if (!res.ok) throw new Error((await res.text()).slice(0, 400));
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content ?? "";
    return { text, provider: "groq" };
  }

  /** ברירת מחדל — Gemini */
  if (!isGeminiConfigured()) throw new Error("חסר מפתח Gemini");
  const genAI = new GoogleGenerativeAI(
    process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || "",
  );
  const model = genAI.getGenerativeModel({ model: getGeminiModelId() });
  const result = await model.generateContent(systemPrefix + userPrompt);
  const text = result.response.text();
  return { text, provider: "gemini" };
}
