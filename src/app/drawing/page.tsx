"use client";

import { useEffect, useRef, useState } from "react";
import { BackBar } from "@/components/BackBar";
import { Eraser, Brush, Undo2, Trash2, Download, Save } from "lucide-react";
import { saveItem } from "@/lib/library";

const COLORS = [
  "#0F1B4C",
  "#EC4899",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#EF4444",
  "#000000",
];

export default function DrawingPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [color, setColor] = useState("#0F1B4C");
  const [size, setSize] = useState(8);
  const [erasing, setErasing] = useState(false);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const history = useRef<ImageData[]>([]);
  const [historyCount, setHistoryCount] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      const parent = canvas.parentElement!;
      const w = parent.clientWidth;
      const h = Math.max(420, Math.round(w * 0.62));
      canvas.width = w * ratio;
      canvas.height = h * ratio;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.scale(ratio, ratio);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, w, h);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  function pushHistory() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
    history.current.push(snap);
    if (history.current.length > 30) history.current.shift();
    setHistoryCount(history.current.length);
  }

  function undo() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const last = history.current.pop();
    if (last) {
      ctx.putImageData(last, 0, 0);
      setHistoryCount(history.current.length);
    }
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    pushHistory();
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function getPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    pushHistory();
    drawing.current = true;
    last.current = getPos(e);
    (e.target as Element).setPointerCapture(e.pointerId);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const p = getPos(e);
    ctx.strokeStyle = erasing ? "#FFFFFF" : color;
    ctx.lineWidth = erasing ? size * 2 : size;
    ctx.beginPath();
    ctx.moveTo(last.current!.x, last.current!.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  }

  function end() {
    drawing.current = false;
    last.current = null;
  }

  function downloadPng() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `scribble-${Date.now()}.png`;
    a.click();
  }

  async function saveToLibrary() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    try {
      await saveItem({
        id: crypto.randomUUID(),
        type: "drawing",
        savedAt: new Date().toISOString(),
        dataUrl,
      });
      alert("Saved to your library!");
    } catch (e) {
      console.error(e);
      alert("Could not save — your browser storage may be full.");
    }
  }

  return (
    <main className="min-h-screen">
      <BackBar title="Drawing Pad" />

      <section className="mx-auto max-w-6xl px-6 md:px-10 pb-16">
        <div className="bg-soft-card rounded-xl2 shadow-tile p-4 md:p-6">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button
              onClick={() => setErasing(false)}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-bold ${
                !erasing
                  ? "bg-primary text-white"
                  : "bg-soft-bg text-soft-muted"
              }`}
            >
              <Brush size={16} /> Brush
            </button>
            <button
              onClick={() => setErasing(true)}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-bold ${
                erasing
                  ? "bg-primary text-white"
                  : "bg-soft-bg text-soft-muted"
              }`}
            >
              <Eraser size={16} /> Eraser
            </button>

            <div className="flex items-center gap-1">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setColor(c);
                    setErasing(false);
                  }}
                  className={`w-7 h-7 rounded-full border-2 transition ${
                    color === c && !erasing
                      ? "border-ink scale-110"
                      : "border-white shadow"
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-soft-muted font-bold">Size</span>
              <input
                type="range"
                min={2}
                max={40}
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="accent-primary"
              />
              <span className="text-xs text-soft-muted w-6">{size}</span>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={undo}
                disabled={historyCount === 0}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-bold bg-soft-bg text-soft-muted hover:bg-primary-50 disabled:opacity-40"
              >
                <Undo2 size={16} /> Undo
              </button>
              <button
                onClick={clearCanvas}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-bold bg-soft-bg text-soft-muted hover:bg-pink-50"
              >
                <Trash2 size={16} /> Clear
              </button>
              <button
                onClick={downloadPng}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-bold bg-primary-50 text-primary-700"
              >
                <Download size={16} /> PNG
              </button>
              <button
                onClick={saveToLibrary}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-bold bg-primary text-white shadow-soft"
              >
                <Save size={16} /> Save
              </button>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden border border-primary-100 bg-white touch-none">
            <canvas
              ref={canvasRef}
              onPointerDown={start}
              onPointerMove={move}
              onPointerUp={end}
              onPointerCancel={end}
              onPointerLeave={end}
              className="block w-full cursor-crosshair"
            />
          </div>

          <p className="text-xs text-soft-muted text-center mt-3">
            Tip: works with mouse, trackpad, touch, or stylus.
          </p>
        </div>
      </section>
    </main>
  );
}
