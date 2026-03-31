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
      minHeight: {
        /** תאימות מובייל: dvh כשזמין, גיבוי ל-vh */
        screen: "100vh",
        "screen-dvh": "100dvh",
      },
      height: {
        "screen-dvh": "100dvh",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
