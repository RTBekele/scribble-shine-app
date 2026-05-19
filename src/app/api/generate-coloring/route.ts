import { NextResponse } from "next/server";
import { generateImage } from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Generates a black-and-white coloring page from a kid-friendly prompt.
 */
export async function POST(req: Request) {
  try {
    const { subject, ageRange = "4-7" } = await req.json();
    if (!subject) {
      return NextResponse.json({ error: "subject required" }, { status: 400 });
    }

    const colorPrompt = `Black-and-white line-art coloring book page for children ages ${ageRange}. Subject: ${subject}.
Clear bold outlines, no shading, no color, no gradients, pure white background, thick uniform black ink lines, simple shapes, large color-in areas, friendly and cute style, full page composition.`;

    const imageDataUrl = await generateImage({
      prompt: colorPrompt,
      aspectRatio: "3:4",
    });
    return NextResponse.json({ imageDataUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
