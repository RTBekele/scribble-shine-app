"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type ColorKey = "primary" | "pink" | "blue" | "orange" | "green" | "purple";

const colorMap: Record<
  ColorKey,
  { bg: string; text: string; ghost: string; ring: string }
> = {
  primary: {
    bg: "bg-primary",
    text: "text-primary-600",
    ghost: "text-primary-100",
    ring: "ring-primary-100",
  },
  pink: {
    bg: "bg-accent-pink",
    text: "text-accent-pink",
    ghost: "text-pink-100",
    ring: "ring-pink-100",
  },
  blue: {
    bg: "bg-accent-blue",
    text: "text-accent-blue",
    ghost: "text-blue-100",
    ring: "ring-blue-100",
  },
  orange: {
    bg: "bg-accent-orange",
    text: "text-accent-orange",
    ghost: "text-orange-100",
    ring: "ring-orange-100",
  },
  green: {
    bg: "bg-accent-green",
    text: "text-accent-green",
    ghost: "text-green-100",
    ring: "ring-green-100",
  },
  purple: {
    bg: "bg-accent-purple",
    text: "text-accent-purple",
    ghost: "text-purple-100",
    ring: "ring-purple-100",
  },
};

export function FeatureTile({
  href,
  title,
  description,
  Icon,
  GhostIcon,
  color = "primary",
}: {
  href: string;
  title: string;
  description: string;
  Icon: LucideIcon;
  GhostIcon?: LucideIcon;
  color?: ColorKey;
}) {
  const c = colorMap[color];
  return (
    <Link
      href={href}
      className="group relative overflow-hidden bg-soft-card rounded-xl2 p-6 md:p-7 shadow-tile hover:-translate-y-1 hover:shadow-[0_16px_40px_-12px_rgba(15,27,76,0.18)] transition-all duration-200 ring-1 ring-transparent hover:ring-2 hover:ring-offset-0 dot-grid min-h-[200px] flex flex-col justify-between"
    >
      {/* Soft ghost icon decoration */}
      {GhostIcon ? (
        <GhostIcon
          className={`absolute -right-4 -bottom-2 w-40 h-40 ${c.ghost} opacity-60`}
          strokeWidth={1.4}
        />
      ) : null}

      <div className="relative">
        <span
          className={`inline-grid place-items-center w-12 h-12 rounded-2xl ${c.bg} text-white shadow-soft`}
        >
          <Icon size={22} strokeWidth={2.5} />
        </span>
      </div>

      <div className="relative">
        <h3 className="font-display font-extrabold text-xl md:text-2xl text-ink mb-1.5">
          {title}
        </h3>
        <p className="text-soft-muted text-sm md:text-[15px] leading-relaxed">
          {description}
        </p>
      </div>
    </Link>
  );
}
