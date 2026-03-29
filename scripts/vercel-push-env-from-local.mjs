/**
 * דוחף משתנים מ־.env.local ל־Vercel — **production** בלבד.
 * stdin לערכים (מתאים ל-& ב-DATABASE_URL ולסיסמאות ב-Windows).
 * Preview: בפרויקט ללא Git מחובר ה-CLI דורש branch — להגדיר בדשבורד או לחבר מאגר.
 */
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { platform } from "node:os";
import { performance } from "node:perf_hooks";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const envPath = resolve(root, ".env.local");

const SKIP_KEYS = new Set(["VERCEL_OIDC_TOKEN"]);
const ENVIRONMENTS = ["production"];
const DELAY_MS = 650;
const NEVER_SENSITIVE = new Set(["NEXTAUTH_URL", "AUTH_URL"]);

function sleepSync(ms) {
  const until = performance.now() + ms;
  while (performance.now() < until) {
    /* throttle */
  }
}

const useSensitiveFlag = (key) =>
  !key.startsWith("NEXT_PUBLIC_") && !NEVER_SENSITIVE.has(key);

function parseDotenv(content) {
  const out = [];
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
    if (!key || SKIP_KEYS.has(key)) continue;
    if (val === "") continue;
    out.push({ key, val });
  }
  return out;
}

function pushOne(key, val, environment) {
  const args = ["vercel", "env", "add", key, environment, "--yes", "--force"];
  if (useSensitiveFlag(key)) args.push("--sensitive");

  const r = spawnSync("npx", args, {
    cwd: root,
    input: val,
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
    shell: platform() === "win32",
  });

  const out = `${r.stdout || ""}${r.stderr || ""}`;
  const success =
    r.status === 0 ||
    /Overridden|Added Environment Variable|Environment Variables configured/i.test(
      out,
    );
  return { ok: success, msg: out.trim().slice(-800) };
}

function main() {
  if (!existsSync(envPath)) {
    console.error("חסר קובץ .env.local");
    process.exit(1);
  }

  const pairs = parseDotenv(readFileSync(envPath, "utf8"));
  const byKey = Object.fromEntries(pairs.map((p) => [p.key, p.val]));
  const authUrl = byKey.AUTH_URL || byKey.NEXT_PUBLIC_SITE_URL || "https://bsd-ybm.co.il";
  const filtered = pairs.filter((p) => p.key !== "NEXTAUTH_URL");

  console.log(
    `מעלה ${filtered.length} משתנים ל־production (+ NEXTAUTH_URL). Preview: דרך דשבורד.\n`,
  );

  let ok = 0;
  let fail = 0;

  function run(key, val, env) {
    const { ok: success, msg } = pushOne(key, val, env);
    if (!success) {
      console.error(`[שגיאה] ${key} (${env})\n${msg}`);
      fail++;
    } else {
      console.log(`[ok] ${key} → ${env}`);
      ok++;
    }
    sleepSync(DELAY_MS);
  }

  for (const { key, val } of filtered) {
    for (const env of ENVIRONMENTS) {
      run(key, val, env);
    }
  }

  for (const env of ENVIRONMENTS) {
    run("NEXTAUTH_URL", authUrl.replace(/\/$/, ""), env);
  }

  console.log(`\nסיום: ${ok} הצלחות, ${fail} כשלונות`);
  process.exit(fail > 0 ? 1 : 0);
}

main();
