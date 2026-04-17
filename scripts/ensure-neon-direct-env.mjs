/**
 * יוצר DIRECT_URL מ־DATABASE_URL של Neon (pooler → direct) אם חסר.
 * לא מדפיס סודות — רק הודעות סטטוס.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const envPath = resolve(root, ".env.local");

function parseDotenvKeys(content) {
  const map = new Map();
  for (const line of content.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    map.set(key, val);
  }
  return map;
}

function poolerToDirectNeon(databaseUrl) {
  if (!databaseUrl || typeof databaseUrl !== "string") return null;
  if (!/neon\.tech/i.test(databaseUrl)) return null;
  if (!/-pooler/i.test(databaseUrl)) return null;

  const at = databaseUrl.indexOf("@");
  if (at === -1) return null;
  const afterAt = databaseUrl.slice(at + 1);
  const slash = afterAt.indexOf("/");
  if (slash === -1) return null;

  let hostPort = afterAt.slice(0, slash);
  const rest = afterAt.slice(slash);

  let host;
  let port = "";
  const lastColon = hostPort.lastIndexOf(":");
  if (lastColon > 0 && /^\d+$/.test(hostPort.slice(lastColon + 1))) {
    host = hostPort.slice(0, lastColon);
    port = hostPort.slice(lastColon);
  } else {
    host = hostPort;
    port = ":5432";
  }

  if (!host.includes("-pooler")) return null;
  const directHost = host.replace("-pooler", "");
  const newAfterAt = `${directHost}${port}${rest}`;
  return databaseUrl.slice(0, at + 1) + newAfterAt;
}

function main() {
  if (!existsSync(envPath)) {
    console.error("חסר .env.local");
    process.exit(1);
  }

  const raw = readFileSync(envPath, "utf8");
  const map = parseDotenvKeys(raw);
  const existingDirect = map.get("DIRECT_URL");
  if (existingDirect && String(existingDirect).trim().length > 0) {
    console.log("DIRECT_URL כבר מוגדר — אין צורך בשינוי.");
    process.exit(0);
  }

  const db = map.get("DATABASE_URL");
  if (!db) {
    console.error("חסר DATABASE_URL ב-.env.local");
    process.exit(1);
  }

  const derived = poolerToDirectNeon(db);
  if (!derived) {
    console.error(
      "לא ניתן לגזור DIRECT_URL אוטומטית (צפוי Neon עם pooler ב-host). הוסף ידנית DIRECT_URL מ-Neon עם Connection pooling כבוי.",
    );
    process.exit(1);
  }

  const sep = raw.endsWith("\n") ? "" : "\n";
  const line = `${sep}DIRECT_URL=${JSON.stringify(derived)}\n`;
  writeFileSync(envPath, raw + line, "utf8");
  console.log("נוסף DIRECT_URL (חיבור ישיר ל-Neon) ל-.env.local — ללא הצגת הערך.");
  process.exit(0);
}

main();
