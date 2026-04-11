/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-heebo)",
          "var(--font-assistant)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      /* ─── Design Tokens ──────────────────────────────────────────────── */
      colors: {
        /* Brand — single source of truth for indigo */
        brand: {
          50:  "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
        /* Dark surfaces (landing page / auth pages) */
        dark: {
          900: "#050508",
          800: "#0a0a0f",
          700: "#0f0f16",
          600: "#16161f",
          500: "#1e1e2a",
          border: "rgba(255,255,255,0.07)",
        },
        /* Dashboard surfaces (light work environment) */
        surface: {
          bg:     "#f8f9fb",
          card:   "#ffffff",
          border: "#e8eaf0",
          muted:  "#f1f3f7",
        },
      },
      /* ─── Shadows ────────────────────────────────────────────────────── */
      boxShadow: {
        "brand-sm": "0 1px 3px 0 rgba(79,70,229,0.15)",
        "brand-md": "0 4px 16px 0 rgba(79,70,229,0.20)",
        "brand-lg": "0 8px 32px 0 rgba(79,70,229,0.25)",
        "card":     "0 1px 4px 0 rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
        "card-hover": "0 4px 16px 0 rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.06)",
      },
      /* ─── Border radius ──────────────────────────────────────────────── */
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      minHeight: {
        screen: "100vh",
        "screen-dvh": "100dvh",
      },
      height: {
        "screen-dvh": "100dvh",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    function ({ addUtilities, theme }) {
      addUtilities({
        ".bg-grid-white": {
          "background-image": `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='white' stroke-opacity='0.05'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e")`,
        },
        ".bg-grid-indigo": {
          "background-image": `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='%234f46e5' stroke-opacity='0.1'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e")`,
        },
      });
    },
  ],
};
