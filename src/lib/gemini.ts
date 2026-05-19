import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash";
const IMAGE_MODEL =
  process.env.GEMINI_IMAGE_MODEL || "imagen-4.0-fast-generate-001";

if (!API_KEY && process.env.NODE_ENV !== "test") {
  // We intentionally don't throw at import time so `next build` doesn't fail
  // when env vars aren't set yet. Routes that call genAI() will throw a friendly error.
  // eslint-disable-next-line no-console
  console.warn(
    "[gemini] GOOGLE_GENERATIVE_AI_API_KEY not set — AI calls will fail until you add it."
  );
}

export function genAI() {
  if (!API_KEY) {
    throw new Error(
      "Missing GOOGLE_GENERATIVE_AI_API_KEY. Add it to .env.local (see .env.example)."
    );
  }
  return new GoogleGenerativeAI(API_KEY);
}

export const MODELS = {
  text: TEXT_MODEL,
  image: IMAGE_MODEL,
};

/** Generate a multi-page children's story as structured JSON. */
export async function generateStory(opts: {
  topic: string;
  language: string;
  ageRange: string; // e.g. "4-6"
  style?: string; // e.g. "whimsical watercolor"
  pages?: number; // default 5
}) {
  const pages = opts.pages ?? 5;
  const model = genAI().getGenerativeModel({
    model: MODELS.text,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.9,
    },
  });

  const prompt = `You are a beloved children's author writing for ages ${opts.ageRange}.
Write a ${pages}-page illustrated story about: "${opts.topic}".
Write the story entirely in ${opts.language}. The illustration prompts must always be in English (for the image model) and should match the "${opts.style ?? "soft watercolor children's book"}" style.

Return strict JSON with this shape:
{
  "title": string,
  "language": string,
  "pages": [
    { "page": number, "text": string, "illustrationPrompt": string }
  ]
}

Keep each page's text 2-4 short sentences. Keep it warm, safe, age-appropriate, and joyful. Do NOT include any text characters in the illustration prompts (no letters, words, captions, signs).`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text();
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("Story model returned malformed JSON: " + raw.slice(0, 200));
  }
}

/**
 * Generate an image with Imagen via the Generative Language REST API.
 * Returns a base64-encoded PNG (data URL).
 */
export async function generateImage(opts: {
  prompt: string;
  aspectRatio?: "1:1" | "4:3" | "3:4" | "16:9" | "9:16";
}): Promise<string> {
  if (!API_KEY) {
    throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY");
  }
  const aspect = opts.aspectRatio ?? "4:3";

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODELS.image}:predict?key=${API_KEY}`;

  const body = {
    instances: [{ prompt: opts.prompt }],
    parameters: {
      sampleCount: 1,
      aspectRatio: aspect,
      personGeneration: "allow_adult",
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Imagen error ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    predictions?: { bytesBase64Encoded?: string; mimeType?: string }[];
  };
  const pred = data.predictions?.[0];
  if (!pred?.bytesBase64Encoded) {
    throw new Error("Imagen returned no image bytes");
  }
  const mime = pred.mimeType ?? "image/png";
  return `data:${mime};base64,${pred.bytesBase64Encoded}`;
}
