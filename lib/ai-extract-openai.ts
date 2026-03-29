import { parseModelJsonText } from "@/lib/ai-document-json";
import { getOpenAiVisionModel } from "@/lib/ai-providers";

export async function extractDocumentWithOpenAI(
  base64: string,
  mimeType: string,
  fileName: string,
  documentInstruction: string,
): Promise<Record<string, unknown>> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new Error("חסר OPENAI_API_KEY");

  if (mimeType === "application/pdf") {
    throw new Error(
      "OpenAI במסלול זה תומך בעיקר בתמונות. עבור PDF השתמשו ב-Gemini או המירו לתמונה.",
    );
  }

  const model = getOpenAiVisionModel();
  const dataUrl = `data:${mimeType};base64,${base64}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `${documentInstruction}\nFile name: ${fileName}`,
            },
            {
              type: "image_url",
              image_url: { url: dataUrl, detail: "high" },
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`OpenAI: ${res.status} ${err.slice(0, 400)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content ?? "";
  if (!text) throw new Error("OpenAI לא החזיר תוכן");
  return parseModelJsonText(text);
}
