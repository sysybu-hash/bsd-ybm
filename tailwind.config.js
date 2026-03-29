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
