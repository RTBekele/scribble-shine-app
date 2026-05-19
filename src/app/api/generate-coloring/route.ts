import { NextResponse } from "next/server";
import { generateImage, expandColoringSubject } from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Generates a black-and-white coloring page from a kid-friendly prompt.
 * Pipeline:
 *   1. Gemini expands the (possibly vague) subject into a vivid scene description.
 *   2. Imagen renders that description as line-art.
 */
export async function POST(req: Request) {
  try {
    const { subject, childName, ageRange = "4-7" } = await req.json();
    if (!subject || typeof subject !== "string") {
      return NextResponse.json({ error: "subject required" }, { status: 400 });
    }

    const trimmedName =
      typeof childName === "string" ? childName.trim() : undefined;

    // Step 1: expand the subject into a vivid scene
    const sceneDescription = await expandColoringSubject({
      subject,
      childName: trimmedName,
      ageRange,
    });

    // Step 2: hand it to Imagen with strict line-art framing
    const colorPrompt = `${sceneDescription}

Render this as a black-and-white line-art COLORING BOOK PAGE for children ages ${ageRange}. Clear bold outlines, no shading, no color, no gradients, pure white background, thick uniform black ink lines, simple shapes, large color-in areas, friendly and cute style, full page composition. The character must clearly match the description above. ABSOLUTELY NO text, letters, words, captions, or signs anywhere in the image.`;

    const imageDataUrl = await generateImage({
      prompt: colorPrompt,
      aspectRatio: "3:4",
    });

    return NextResponse.json({
      imageDataUrl,
      // expose for debugging — frontend ignores it
      expandedPrompt: sceneDescription,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
