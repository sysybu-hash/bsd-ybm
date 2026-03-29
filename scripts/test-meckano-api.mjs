import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env.local");

function stripQuotes(s) {
  const t = s.trim();
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    return t.slice(1, -1);
  }
  return t;
}

let key = process.env.MECKANO_API_KEY?.trim();
if (!key && fs.existsSync(envPath)) {
  const raw = fs.readFileSync(envPath, "utf8");
  const m = raw.match(/^MECKANO_API_KEY=(.+)$/m);
  if (m) key = stripQuotes(m[1]);
}

if (!key) {
  console.error("MECKANO_API_KEY חסר — הגדר ב-.env.local או במשתנה סביבה.");
  process.exit(2);
}

const url =
  process.env.MECKANO_USERS_URL?.trim() ||
  "https://app.meckano.co.il/rest/users";

const res = await fetch(url, {
  method: "GET",
  headers: {
    key,
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  cache: "no-store",
});

const text = await res.text();
let body;
try {
  body = JSON.parse(text);
} catch {
  body = { _parseError: true, snippet: text.slice(0, 300) };
}

console.log("HTTP_STATUS:", res.status);
console.log(
  "TOP_LEVEL_KEYS:",
  body && typeof body === "object" && !Array.isArray(body)
    ? Object.keys(body)
    : [],
);
console.log("STATUS_FIELD:", body?.status, "(typeof:", typeof body?.status + ")");
const d = body?.data;
if (Array.isArray(d)) {
  console.log("DATA: מערך, אורך:", d.length);
  if (d.length) console.log("FIRST_ITEM_KEYS:", Object.keys(d[0] || {}).slice(0, 20));
} else {
  console.log("DATA: סוג:", typeof d);
}

if (!res.ok) {
  console.log("RAW_SNIPPET:", text.slice(0, 400));
  process.exit(1);
}

if (!body?.status) {
  console.log("אזהרה: body.status לא truthy — ייתכן שהשרת שלנו ידחה תשובה זו.");
  process.exit(1);
}

console.log("סיכום: קריאה ל-Meckano הצליחה מבחינת HTTP ו-status מה-JSON.");
