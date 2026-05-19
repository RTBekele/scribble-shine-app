"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function BackBar({ title }: { title: string }) {
  return (
    <div className="px-6 md:px-10 py-5 flex items-center gap-4">
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-3 py-2 rounded-full hover:bg-primary-50 text-soft-muted hover:text-primary-600 transition text-sm font-bold"
      >
        <ArrowLeft size={16} strokeWidth={2.5} />
        Back
      </Link>
      <h1 className="font-display font-extrabold text-xl md:text-2xl text-ink">
        {title}
      </h1>
    </div>
  );
}
