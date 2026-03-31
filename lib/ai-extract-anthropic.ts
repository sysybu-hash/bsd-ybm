import { parseModelJsonText } from "@/lib/ai-document-json";
import { getAnthropicModel } from "@/lib/ai-providers";

export async function extractDocumentWithAnthropic(
  base64: string,
  mimeType: string,
  fileName: string,
  documentInstruction: string,
): Promise<Record<string, unknown>> {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) throw new Error("חסר ANTHROPIC_API_KEY");

  if (mimeType === "application/pdf") {
    throw new Error(
      "Claude במסלול זה מוגדר לתמונות. עבור PDF מומלץ Gemini.",
    );
  }

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
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType,
                data: base64,
              },
            },
            {
              type: "text",
              text: `${documentInstruction}\nFile name: ${fileName}`,
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`Anthropic: ${res.status} ${err.slice(0, 400)}`);
  }

  const data = (await res.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };
  const text = data.content?.find((b) => b.type === "text")?.text ?? "";
  if (!text) throw new Error("Claude לא החזיר טקסט");
  return parseModelJsonText(text);
}
