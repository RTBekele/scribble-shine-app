"use client";

import { Header } from "@/components/Header";
import { FeatureTile } from "@/components/FeatureTile";
import {
  BookOpen,
  Palette,
  PenTool,
  History,
  Type,
  Brain,
  Sparkles,
  Wand2,
  Heart,
  PencilLine,
  Plus,
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Header />

      <section className="mx-auto max-w-6xl px-6 md:px-10 pt-6 md:pt-10 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <FeatureTile
            href="/storybook"
            title="Magic Storybook"
            description="Hear stories read aloud in any language."
            Icon={BookOpen}
            GhostIcon={Sparkles}
            color="primary"
          />
          <FeatureTile
            href="/colorbuddy"
            title="ColorBuddy"
            description="Generate personalized coloring books."
            Icon={Palette}
            GhostIcon={Wand2}
            color="pink"
          />
          <FeatureTile
            href="/drawing"
            title="Drawing Pad"
            description="Paint your own artwork on a digital canvas."
            Icon={PenTool}
            GhostIcon={Palette}
            color="blue"
          />
          <FeatureTile
            href="/library"
            title="My Library"
            description="Revisit your favorite stories anytime."
            Icon={History}
            GhostIcon={Heart}
            color="orange"
          />
          <FeatureTile
            href="/writing"
            title="Writing Practice"
            description="Trace words and sentences to master writing."
            Icon={Type}
            GhostIcon={PencilLine}
            color="green"
          />
          <FeatureTile
            href="/math"
            title="Math Practice"
            description="Fun math quests tailored to your age level!"
            Icon={Brain}
            GhostIcon={Plus}
            color="purple"
          />
        </div>
      </section>
    </main>
  );
}
