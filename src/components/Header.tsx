"use client";

import Link from "next/link";
import { Sparkles, User } from "lucide-react";

export function Header() {
  return (
    <header className="w-full px-6 md:px-10 py-5 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-3 group">
        <span className="w-10 h-10 rounded-2xl bg-primary text-white grid place-items-center shadow-soft group-hover:scale-105 transition">
          <Sparkles size={20} strokeWidth={2.5} />
        </span>
        <span className="font-display font-extrabold text-2xl tracking-tight text-ink">
          Scribble <span className="text-accent-pink">&</span> Shine
        </span>
      </Link>

      <Link
        href="/login"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-50 text-primary-600 hover:bg-primary-100 font-bold text-sm transition"
      >
        <User size={16} strokeWidth={2.5} />
        Parent Login
      </Link>
    </header>
  );
}
