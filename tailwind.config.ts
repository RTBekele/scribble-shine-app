import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,js,jsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Scribble & Shine inspired palette
        ink: "#0F1B4C",
        primary: {
          DEFAULT: "#6C5CE7",
          50: "#F5F3FF",
          100: "#EDE9FE",
          500: "#6C5CE7",
          600: "#5B4BD6",
          700: "#4A3CC2",
        },
        accent: {
          pink: "#EC4899",
          orange: "#F59E0B",
          green: "#10B981",
          blue: "#3B82F6",
          purple: "#8B5CF6",
        },
        soft: {
          bg: "#FAFAFE",
          card: "#FFFFFF",
          muted: "#6B6F90",
        },
      },
      fontFamily: {
        display: ['"Nunito"', "system-ui", "sans-serif"],
        sans: ['"Nunito"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 24px -8px rgba(15, 27, 76, 0.08)",
        tile: "0 8px 32px -12px rgba(15, 27, 76, 0.12)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
export default config;
