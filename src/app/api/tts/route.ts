import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lightweight TTS endpoint stub.
 *
 * The browser already exposes `window.speechSynthesis` which is the simplest way
 * to read story pages aloud in any language at zero cost — the client uses that
 * by default.
 *
 * This route is reserved for a future upgrade to Gemini's audio output or a
 * higher-quality TTS provider (e.g. ElevenLabs, Google Cloud TTS). It currently
 * returns a hint so the client knows to fall back.
 */
export async function POST(req: Request) {
  const { text, lang } = await req.json().catch(() => ({}));
  return NextResponse.json({
    fallback: "browser",
    message:
      "Use window.speechSynthesis on the client. Server-side TTS not yet configured.",
    received: { text: text?.slice(0, 60), lang },
  });
}
