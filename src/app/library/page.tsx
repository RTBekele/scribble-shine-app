"use client";

import { useEffect, useState } from "react";
import { BackBar } from "@/components/BackBar";
import { Heart, BookOpen, Brush, Trash2 } from "lucide-react";

type StoryItem = {
  id: string;
  type: "story";
  savedAt: string;
  story: { title: string; pages: { page: number; text: string }[] };
  images: Record<number, string>;
};
type DrawingItem = {
  id: string;
  type: "drawing";
  savedAt: string;
  dataUrl: string;
};
type Item = StoryItem | DrawingItem;

export default function LibraryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("scribble:library") || "[]");
      setItems(raw);
    } catch {
      setItems([]);
    }
    setHydrated(true);
  }, []);

  function remove(id: string) {
    const next = items.filter((i) => i.id !== id);
    setItems(next);
    localStorage.setItem("scribble:library", JSON.stringify(next));
  }

  return (
    <main className="min-h-screen">
      <BackBar title="My Library" />

      <section className="mx-auto max-w-6xl px-6 md:px-10 pb-16">
        {!hydrated ? null : items.length === 0 ? (
          <div className="bg-soft-card rounded-xl2 shadow-tile p-10 text-center">
            <Heart className="mx-auto mb-3 text-accent-orange" size={36} />
            <h2 className="font-display font-extrabold text-xl text-ink">
              No saved creations yet
            </h2>
            <p className="text-soft-muted mt-1 text-sm">
              Save stories and drawings to revisit them anytime.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-soft-card rounded-xl2 shadow-tile p-4 flex flex-col"
              >
                <div className="aspect-[4/3] w-full bg-soft-bg rounded-xl overflow-hidden grid place-items-center">
                  {item.type === "story" ? (
                    item.images[1] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.images[1]}
                        alt={item.story.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <BookOpen className="text-primary-500" size={32} />
                    )
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.dataUrl}
                      alt="Drawing"
                      className="w-full h-full object-contain bg-white"
                    />
                  )}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="min-w-0">
                    <p className="font-display font-extrabold text-ink truncate">
                      {item.type === "story"
                        ? item.story.title
                        : "My Drawing"}
                    </p>
                    <p className="text-xs text-soft-muted">
                      {new Date(item.savedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary-50 text-primary-600 text-xs font-bold">
                      {item.type === "story" ? (
                        <BookOpen size={12} />
                      ) : (
                        <Brush size={12} />
                      )}
                      {item.type}
                    </span>
                    <button
                      onClick={() => remove(item.id)}
                      className="p-2 rounded-full hover:bg-pink-50 text-soft-muted hover:text-accent-pink"
                      aria-label="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
