import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-flash-latest";
const TEXT_MODEL_FALLBACK = "gemini-2.0-flash";
const IMAGE_MODEL =
  process.env.GEMINI_IMAGE_MODEL || "imagen-4.0-fast-generate-001";

if (!API_KEY && process.env.NODE_ENV !== "test") {
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
  textFallback: TEXT_MODEL_FALLBACK,
  image: IMAGE_MODEL,
};

/** Detect transient errors worth retrying. */
function isTransient(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /\b(429|500|502|503|504)\b|overloaded|UNAVAILABLE|temporarily|ECONNRESET|ETIMEDOUT/i.test(
    msg
  );
}

/** Sleep helper. */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Call Gemini text gen with exponential backoff + model fallback on transient errors. */
async function generateTextWithRetry(opts: {
  modelName: string;
  prompt: string;
}): Promise<string> {
  const ai = genAI();
  const tryOnce = async (m: string) => {
    const model = ai.getGenerativeModel({
      model: m,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.9,
      },
    });
    const result = await model.generateContent(opts.prompt);
    return result.response.text();
  };

  const attempts: { model: string; delay: number }[] = [
    { model: opts.modelName, delay: 0 },
    { model: opts.modelName, delay: 800 },
    { model: TEXT_MODEL_FALLBACK, delay: 1500 },
    { model: TEXT_MODEL_FALLBACK, delay: 3000 },
  ];

  let lastErr: unknown;
  for (const a of attempts) {
    try {
      if (a.delay) await sleep(a.delay);
      return await tryOnce(a.model);
    } catch (err) {
      lastErr = err;
      if (!isTransient(err)) throw err;
      // eslint-disable-next-line no-console
      console.warn(`[gemini] transient error on ${a.model}, retrying:`, err instanceof Error ? err.message : err);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Gemini exhausted retries");
}

/** Generate a multi-page children's story as structured JSON. */
export async function generateStory(opts: {
  topic: string;
  childName?: string;
  language: string;
  ageRange: string;
  style?: string;
  pages?: number;
}) {
  const pages = opts.pages ?? 5;

  const namedLine = opts.childName
    ? `The main character is a child named ${opts.childName}. Use this name throughout the story so it feels personal.`
    : "";

  const prompt = `You are a beloved children's author writing for ages ${opts.ageRange}.
Write a ${pages}-page illustrated story about: "${opts.topic}".
${namedLine}
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

  const raw = await generateTextWithRetry({
    modelName: MODELS.text,
    prompt,
  });
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("Story model returned malformed JSON: " + raw.slice(0, 200));
  }
}

/** Expand a vague subject ("princess", "dinosaur", "Maya as a fairy")
 *  into a vivid one-sentence scene description that Imagen can render reliably.
 *  Returns plain text (no JSON wrapper). */
export async function expandColoringSubject(opts: {
  subject: string;
  childName?: string;
  ageRange?: string;
}): Promise<string> {
  const ai = genAI();
  const name = opts.childName?.trim();
  const ageBit = opts.ageRange ? `for ages ${opts.ageRange}` : "";

  const prompt = `Expand this child\'s coloring-page idea into ONE vivid, specific visual sentence (max 35 words) ${ageBit}.
Idea: "${opts.subject}"${name ? `\nThe child being drawn is named ${name}. Make the main character clearly a ${name}-ish child character.` : ""}

Rules for the description:
- Be concrete: name the character, their pose, costume, props, and setting.
- Friendly, warm, kid-safe. No scary, violent, or mature content.
- Do NOT mention any text, words, letters, captions, or signs to be drawn.
- Output ONLY the sentence, no preamble or quotes.`;

  const tryOnce = async (m: string) => {
    const model = ai.getGenerativeModel({
      model: m,
      generationConfig: { temperature: 0.85 },
    });
    const r = await model.generateContent(prompt);
    return r.response.text().trim().replace(/^["\'\u201c]|["\'\u201d]$/g, "");
  };

  const attempts = [
    { m: MODELS.text, d: 0 },
    { m: MODELS.text, d: 800 },
    { m: TEXT_MODEL_FALLBACK, d: 1500 },
  ];
  let lastErr: unknown;
  for (const a of attempts) {
    try {
      if (a.d) await sleep(a.d);
      const out = await tryOnce(a.m);
      if (out && out.length > 8) return out;
    } catch (e) {
      lastErr = e;
      if (!isTransient(e)) throw e;
    }
  }
  // Last resort: build a reasonable prompt locally
  return `${name ? `A child named ${name} as ` : "A friendly "}${opts.subject}, drawn as a kid-friendly cartoon character in a cheerful setting.`;
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

  const delays = [0, 800, 2000];
  let lastErr: unknown;
  for (const d of delays) {
    try {
      if (d) await sleep(d);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        const err = new Error(`Imagen error ${res.status}: ${text.slice(0, 300)}`);
        if (isTransient(err)) {
          lastErr = err;
          continue;
        }
        throw err;
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
    } catch (e) {
      lastErr = e;
      if (!isTransient(e)) throw e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Imagen exhausted retries");
}
