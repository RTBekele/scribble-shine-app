"use client";

import { useEffect, useRef, useState } from "react";
import { BackBar } from "@/components/BackBar";
import { Eraser, Check, RotateCcw } from "lucide-react";

const WORDS_BY_AGE: Record<string, string[]> = {
  "3-5": ["cat", "dog", "sun", "mom", "dad", "ball", "fish", "tree"],
  "5-7": ["apple", "house", "happy", "smile", "puppy", "color"],
  "7-9": ["adventure", "rainbow", "kindness", "imagine", "explore"],
};

export default function WritingPage() {
  const [ageRange, setAgeRange] = useState("5-7");
  const [word, setWord] = useState("apple");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      const parent = canvas.parentElement!;
      const w = parent.clientWidth;
      const h = 240;
      canvas.width = w * ratio;
      canvas.height = h * ratio;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.scale(ratio, ratio);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#6C5CE7";
      ctx.lineWidth = 6;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [word]);

  function clear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function getPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }
  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    drawing.current = true;
    last.current = getPos(e);
    (e.target as Element).setPointerCapture(e.pointerId);
  }
  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(last.current!.x, last.current!.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  }
  function end() {
    drawing.current = false;
  }

  return (
    <main className="min-h-screen">
      <BackBar title="Writing Practice" />

      <section className="mx-auto max-w-5xl px-6 md:px-10 pb-16">
        <div className="bg-soft-card rounded-xl2 shadow-tile p-6">
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <label className="text-sm font-bold text-ink">Age</label>
            <select
              value={ageRange}
              onChange={(e) => {
                setAgeRange(e.target.value);
                setWord(WORDS_BY_AGE[e.target.value][0]);
              }}
              className="rounded-xl border border-primary-100 bg-soft-bg px-3 py-2 text-sm"
            >
              <option value="3-5">3–5</option>
              <option value="5-7">5–7</option>
              <option value="7-9">7–9</option>
            </select>

            <label className="text-sm font-bold text-ink ml-3">Word</label>
            <select
              value={word}
              onChange={(e) => setWord(e.target.value)}
              className="rounded-xl border border-primary-100 bg-soft-bg px-3 py-2 text-sm"
            >
              {WORDS_BY_AGE[ageRange].map((w) => (
                <option key={w}>{w}</option>
              ))}
            </select>

            <button
              onClick={clear}
              className="ml-auto inline-flex items-center gap-2 px-3 py-2 rounded-full bg-soft-bg text-soft-muted text-sm font-bold hover:bg-primary-50"
            >
              <Eraser size={16} /> Clear
            </button>
          </div>

          {/* Tracing template */}
          <div className="relative w-full rounded-xl overflow-hidden border border-primary-100 bg-white">
            <div
              className="absolute inset-0 grid place-items-center select-none pointer-events-none"
              style={{ color: "rgba(108, 92, 231, 0.18)" }}
            >
              <span
                className="font-display font-extrabold"
                style={{ fontSize: "clamp(64px, 14vw, 180px)", letterSpacing: "0.05em" }}
              >
                {word}
              </span>
            </div>
            <canvas
              ref={canvasRef}
              onPointerDown={start}
              onPointerMove={move}
              onPointerUp={end}
              onPointerCancel={end}
              onPointerLeave={end}
              className="relative block w-full cursor-crosshair touch-none"
            />
            <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-primary-100 pointer-events-none" />
          </div>

          <p className="text-sm text-soft-muted mt-3">
            Trace the faded letters with your finger, stylus, or mouse. Press{" "}
            <RotateCcw className="inline" size={14} /> Clear to try again.
          </p>

          <div className="flex items-center justify-end mt-4">
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-green text-white font-bold text-sm shadow-soft">
              <Check size={16} /> Nice job!
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
