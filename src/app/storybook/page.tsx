"use client";

import { useState } from "react";
import { BackBar } from "@/components/BackBar";
import { LANGUAGES } from "@/lib/languages";
import { saveItem } from "@/lib/library";
import { Wand2, Play, Pause, Save, ChevronLeft, ChevronRight, Loader2, User } from "lucide-react";

type Page = { page: number; text: string; illustrationPrompt: string };
type Story = {
  title: string;
  language: string;
  pages: Page[];
};

export default function StorybookPage() {
  const [topic, setTopic] = useState("");
  const [childName, setChildName] = useState("");
  const [language, setLanguage] = useState("English");
  const [langCode, setLangCode] = useState("en-US");
  const [ageRange, setAgeRange] = useState("4-6");
  const [pageCount, setPageCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [story, setStory] = useState<Story | null>(null);
  const [images, setImages] = useState<Record<number, string>>({});
  const [current, setCurrent] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function handleGenerate() {
    setError(null);
    setStory(null);
    setImages({});
    setCurrent(0);
    setSaveState("idle");
    setLoading(true);
    try {
      const res = await fetch("/api/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          childName: childName.trim() || undefined,
          language,
          ageRange,
          pages: pageCount,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Story generation failed");
      const s: Story = data.story;
      setStory(s);

      // Stream illustrations in parallel
      s.pages.forEach(async (p) => {
        try {
          const ir = await fetch("/api/generate-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: `${p.illustrationPrompt}. Children's book illustration, soft watercolor, warm lighting, friendly characters, no text.`,
              aspectRatio: "4:3",
            }),
          });
          const id = await ir.json();
          if (ir.ok && id.imageDataUrl) {
            setImages((prev) => ({ ...prev, [p.page]: id.imageDataUrl }));
          }
        } catch {
          /* swallow per-page image errors */
        }
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function speak() {
    if (!story) return;
    const text = story.pages[current]?.text;
    if (!text || typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = langCode;
    u.rate = 0.95;
    u.onend = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  }

  function stopSpeaking() {
    if (typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }

  async function saveToLibrary() {
    if (!story) return;
    setSaveState("saving");
    try {
      await saveItem({
        id: crypto.randomUUID(),
        type: "story",
        savedAt: new Date().toISOString(),
        childName: childName.trim() || undefined,
        story: {
          title: story.title,
          language: story.language,
          pages: story.pages.map((p) => ({
            page: p.page,
            text: p.text,
            illustrationPrompt: p.illustrationPrompt,
          })),
        },
        // Convert numeric keys to strings for IndexedDB
        images: Object.fromEntries(
          Object.entries(images).map(([k, v]) => [String(k), v])
        ),
      });
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2200);
    } catch (e) {
      console.error(e);
      setSaveState("error");
    }
  }

  const page = story?.pages[current];

  return (
    <main className="min-h-screen">
      <BackBar title="Magic Storybook" />

      <section className="mx-auto max-w-6xl px-6 md:px-10 pb-16 grid lg:grid-cols-[360px_1fr] gap-8">
        {/* Controls */}
        <div className="bg-soft-card rounded-xl2 shadow-tile p-6 h-fit">
          <label className="block text-sm font-bold text-ink mb-1.5">
            <span className="inline-flex items-center gap-1.5">
              <User size={14} /> Star of the story <span className="text-soft-muted font-normal">(optional)</span>
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
            What is the story about?
          </label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="A brave little fox who wants to fly..."
            rows={3}
            className="w-full rounded-xl border border-primary-100 bg-soft-bg px-3 py-2 text-sm focus:border-primary-500 focus:bg-white outline-none"
          />

          <label className="block text-sm font-bold text-ink mt-4 mb-1.5">
            Language
          </label>
          <select
            value={langCode}
            onChange={(e) => {
              setLangCode(e.target.value);
              const found = LANGUAGES.find((l) => l.code === e.target.value);
              setLanguage(found?.label || "English");
            }}
            className="w-full rounded-xl border border-primary-100 bg-soft-bg px-3 py-2 text-sm"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div>
              <label className="block text-sm font-bold text-ink mb-1.5">
                Age
              </label>
              <select
                value={ageRange}
                onChange={(e) => setAgeRange(e.target.value)}
                className="w-full rounded-xl border border-primary-100 bg-soft-bg px-3 py-2 text-sm"
              >
                <option value="2-4">2–4</option>
                <option value="4-6">4–6</option>
                <option value="6-8">6–8</option>
                <option value="8-10">8–10</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-ink mb-1.5">
                Pages
              </label>
              <select
                value={pageCount}
                onChange={(e) => setPageCount(Number(e.target.value))}
                className="w-full rounded-xl border border-primary-100 bg-soft-bg px-3 py-2 text-sm"
              >
                {[3, 5, 7, 10].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !topic.trim()}
            className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-600 disabled:opacity-50 text-white font-bold py-3 rounded-2xl shadow-soft transition"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Conjuring...
              </>
            ) : (
              <>
                <Wand2 size={18} />
                Create Story
              </>
            )}
          </button>
          {error ? (
            <p className="text-sm text-accent-pink mt-3">{error}</p>
          ) : null}
        </div>

        {/* Viewer */}
        <div className="bg-soft-card rounded-xl2 shadow-tile p-6 min-h-[480px]">
          {!story ? (
            <div className="h-full grid place-items-center text-soft-muted text-center py-24">
              <div>
                <Wand2 className="mx-auto mb-3 text-primary-500" size={36} />
                <p className="font-display font-bold text-ink text-lg">
                  Your story will appear here
                </p>
                <p className="text-sm">Pick a topic and a language to begin.</p>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4 gap-3">
                <h2 className="font-display font-extrabold text-2xl text-ink truncate">
                  {story.title}
                </h2>
                <button
                  onClick={saveToLibrary}
                  disabled={saveState === "saving"}
                  className={`inline-flex items-center gap-2 text-sm font-bold px-3 py-2 rounded-full whitespace-nowrap transition ${
                    saveState === "saved"
                      ? "bg-accent-green text-white"
                      : saveState === "error"
                      ? "bg-accent-pink text-white"
                      : "text-primary-600 hover:bg-primary-50"
                  }`}
                >
                  {saveState === "saving" ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Save size={16} />
                  )}
                  {saveState === "saved"
                    ? "Saved!"
                    : saveState === "error"
                    ? "Save failed"
                    : "Save"}
                </button>
              </div>

              <div className="aspect-[4/3] w-full bg-soft-bg rounded-xl overflow-hidden grid place-items-center">
                {images[page!.page] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={images[page!.page]}
                    alt={`Illustration for page ${page!.page}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-soft-muted text-sm flex items-center gap-2">
                    <Loader2 className="animate-spin" size={16} /> Illustrating page {page!.page}...
                  </div>
                )}
              </div>

              <p className="mt-5 text-lg leading-relaxed text-ink font-display">
                {page!.text}
              </p>

              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                  disabled={current === 0}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-soft-bg disabled:opacity-40 hover:bg-primary-50 font-bold text-sm"
                >
                  <ChevronLeft size={16} /> Prev
                </button>

                {speaking ? (
                  <button
                    onClick={stopSpeaking}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent-pink text-white font-bold text-sm"
                  >
                    <Pause size={16} /> Stop
                  </button>
                ) : (
                  <button
                    onClick={speak}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white font-bold text-sm shadow-soft"
                  >
                    <Play size={16} /> Read aloud
                  </button>
                )}

                <button
                  onClick={() =>
                    setCurrent((c) =>
                      Math.min((story.pages.length || 1) - 1, c + 1)
                    )
                  }
                  disabled={current === story.pages.length - 1}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-soft-bg disabled:opacity-40 hover:bg-primary-50 font-bold text-sm"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>

              <p className="text-center text-xs text-soft-muted mt-3">
                Page {current + 1} of {story.pages.length}
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
