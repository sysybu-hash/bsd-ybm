const { FlatCompat } = require("@eslint/eslintrc");
const path = require("path");

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

module.exports = [
  ...compat.extends("next/core-web-vitals"),
  {
    ignores: [".next/**", "node_modules/**", "test-results/**", "playwright-report/**", "scratch/**"],
  },
  {
    rules: {
      "no-restricted-syntax": [
        "warn",
        {
          selector: 'Literal[value=/\\\\b(left-|right-)/]',
          message:
            "עדיפות ל-start-/end- ב-Tailwind לתמיכה ב-RTL (או הקשר מפורש שאושר בקוד).",
        },
      ],
    },
  },
];
