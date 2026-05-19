"use client";

import { useState } from "react";
import { BackBar } from "@/components/BackBar";
import { saveItem } from "@/lib/library";
import { Palette, Loader2, Download, FileText, User, Save } from "lucide-react";

export default function ColorBuddyPage() {
  const [subject, setSubject] = useState("");
  const [childName, setChildName] = useState("");
  const [ageRange, setAgeRange] = useState("4-7");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function handleGenerate() {
    setError(null);
    setImageDataUrl(null);
    setExpandedPrompt(null);
    setSaveState("idle");
    setLoading(true);
    try {
      const res = await fetch("/api/generate-coloring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          childName: childName.trim() || undefined,
          ageRange,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not generate");
      setImageDataUrl(data.imageDataUrl);
      setExpandedPrompt(data.expandedPrompt || null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function fileBase() {
    const who = childName.trim() ? `${childName.trim()}_` : "";
    const what = subject.slice(0, 20).replace(/\s+/g, "_");
    return `coloring-${who}${what || "page"}`;
  }

  function downloadPng() {
    if (!imageDataUrl) return;
    const a = document.createElement("a");
    a.href = imageDataUrl;
    a.download = `${fileBase()}.png`;
    a.click();
  }

  async function downloadPdf() {
    if (!imageDataUrl) return;
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ unit: "pt", format: "letter" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 36;
    pdf.addImage(
      imageDataUrl,
      "PNG",
      margin,
      margin,
      pageW - margin * 2,
      pageH - margin * 2,
      undefined,
      "FAST"
    );
    pdf.save(`${fileBase()}.pdf`);
  }

  async function saveToLibrary() {
    if (!imageDataUrl) return;
    setSaveState("saving");
    try {
      await saveItem({
        id: crypto.randomUUID(),
        type: "drawing",
        savedAt: new Date().toISOString(),
        title: `Coloring: ${subject}${childName.trim() ? ` (for ${childName.trim()})` : ""}`,
        dataUrl: imageDataUrl,
      });
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2200);
    } catch (e) {
      console.error(e);
      setSaveState("error");
    }
  }

  return (
    <main className="min-h-screen">
      <BackBar title="ColorBuddy" />

      <section className="mx-auto max-w-6xl px-6 md:px-10 pb-16 grid lg:grid-cols-[360px_1fr] gap-8">
        <div className="bg-soft-card rounded-xl2 shadow-tile p-6 h-fit">
          <label className="block text-sm font-bold text-ink mb-1.5">
            <span className="inline-flex items-center gap-1.5">
              <User size={14} /> Name <span className="text-soft-muted font-normal">(optional)</span>
            </span>
          </label>
          <input
            type="text"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            placeholder="e.g. Maya"
            className="w-full rounded-xl border border-primary-100 bg-soft-bg px-3 py-2 text-sm focus:border-primary-500 focus:bg-white outline-none"
          />

          <label className="block text-sm font-bold text-ink mt-4 mb-1.5">
            What do you want to color?
          </label>
          <textarea
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="A friendly dragon having tea with a bunny"
            rows={3}
            className="w-full rounded-xl border border-primary-100 bg-soft-bg px-3 py-2 text-sm focus:border-primary-500 focus:bg-white outline-none"
          />

          <label className="block text-sm font-bold text-ink mt-4 mb-1.5">
            Age
          </label>
          <select
            value={ageRange}
            onChange={(e) => setAgeRange(e.target.value)}
            className="w-full rounded-xl border border-primary-100 bg-soft-bg px-3 py-2 text-sm"
          >
            <option value="2-4">2–4 (very simple)</option>
            <option value="4-7">4–7</option>
            <option value="7-10">7–10</option>
            <option value="10+">10+ (more detail)</option>
          </select>

          <button
            onClick={handleGenerate}
            disabled={loading || !subject.trim()}
            className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-accent-pink hover:opacity-90 disabled:opacity-50 text-white font-bold py-3 rounded-2xl shadow-soft transition"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Drawing lines...
              </>
            ) : (
              <>
                <Palette size={18} />
                Make Coloring Page
              </>
            )}
          </button>

          {error ? (
            <p className="text-sm text-accent-pink mt-3">{error}</p>
          ) : null}

          {imageDataUrl ? (
            <>
              <div className="grid grid-cols-3 gap-2 mt-5">
                <button
                  onClick={downloadPng}
                  className="inline-flex items-center justify-center gap-1.5 bg-primary-50 text-primary-700 font-bold py-2.5 rounded-xl text-sm"
                >
                  <Download size={14} /> PNG
                </button>
                <button
                  onClick={downloadPdf}
                  className="inline-flex items-center justify-center gap-1.5 bg-primary-50 text-primary-700 font-bold py-2.5 rounded-xl text-sm"
                >
                  <FileText size={14} /> PDF
                </button>
                <button
                  onClick={saveToLibrary}
                  disabled={saveState === "saving"}
                  className={`inline-flex items-center justify-center gap-1.5 font-bold py-2.5 rounded-xl text-sm transition ${
                    saveState === "saved"
                      ? "bg-accent-green text-white"
                      : saveState === "error"
                      ? "bg-accent-pink text-white"
                      : "bg-primary text-white"
                  }`}
                >
                  {saveState === "saving" ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <Save size={14} />
                  )}
                  {saveState === "saved"
                    ? "Saved!"
                    : saveState === "error"
                    ? "Failed"
                    : "Save"}
                </button>
              </div>

              {expandedPrompt ? (
                <details className="mt-4 text-xs text-soft-muted">
                  <summary className="cursor-pointer font-bold hover:text-primary-600">
                    What was drawn (AI scene description)
                  </summary>
                  <p className="mt-2 leading-relaxed">{expandedPrompt}</p>
                </details>
              ) : null}
            </>
          ) : null}
        </div>

        <div className="bg-soft-card rounded-xl2 shadow-tile p-6 min-h-[480px] grid place-items-center">
          {imageDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageDataUrl}
              alt="Coloring page"
              className="w-full max-w-2xl rounded-xl border border-primary-100"
            />
          ) : (
            <div className="text-center text-soft-muted py-24">
              <Palette className="mx-auto mb-3 text-accent-pink" size={36} />
              <p className="font-display font-bold text-ink text-lg">
                Your coloring page will appear here
              </p>
              <p className="text-sm">
                Describe anything and we&apos;ll draw the outlines.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
