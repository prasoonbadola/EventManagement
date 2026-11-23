/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        card: "var(--card)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        line: "var(--line)",
        accent: "var(--accent)",
        "accent-ink": "var(--accent-ink)",
        good: "var(--good)",
        warn: "var(--warn)",
      },
      fontFamily: {
        serif: ["var(--serif)"],
        sans: ["var(--sans)"],
      },
      keyframes: {
        fade: { from: { opacity: "0" } },
        rise: { from: { transform: "translateY(14px) scale(0.98)", opacity: "0" } },
        pop: { from: { transform: "scale(0.5)", opacity: "0" } },
      },
      animation: {
        fade: "fade 0.15s ease-out",
        rise: "rise 0.18s ease-out",
        pop: "pop 0.35s cubic-bezier(0.3,1.6,0.5,1)",
      },
    },
  },
  plugins: [],
};
