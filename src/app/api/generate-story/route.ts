import { NextResponse } from "next/server";
import { generateStory } from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { topic, language = "English", ageRange = "4-6", style, pages } = body;

    if (!topic || typeof topic !== "string") {
      return NextResponse.json(
        { error: "Field 'topic' is required" },
        { status: 400 }
      );
    }

    const story = await generateStory({
      topic,
      language,
      ageRange,
      style,
      pages: pages ?? 5,
    });

    return NextResponse.json({ story });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
