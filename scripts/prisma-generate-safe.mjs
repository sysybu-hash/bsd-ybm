import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const workspaceRoot = process.cwd();
const prismaClientDir = path.join(workspaceRoot, "node_modules", ".prisma", "client");
const clientEntry = path.join(prismaClientDir, "index.js");
const windowsEngine = path.join(prismaClientDir, "query_engine-windows.dll.node");

const result = spawnSync("npx", ["prisma", "generate"], {
  cwd: workspaceRoot,
  shell: process.platform === "win32",
  env: process.env,
  encoding: "utf8",
});

if (result.stdout) {
  process.stdout.write(result.stdout);
}

if (result.stderr) {
  process.stderr.write(result.stderr);
}

if (result.status === 0) {
  process.exit(0);
}

const stderr = [result.stderr, result.stdout].filter(Boolean).join("\n");
const hasLockedWindowsEngineError =
  process.platform === "win32" &&
  /EPERM: operation not permitted, rename/i.test(stderr) &&
  /query_engine-windows\.dll\.node/i.test(stderr);

const hasExistingGeneratedClient = fs.existsSync(clientEntry) && fs.existsSync(windowsEngine);

if (hasLockedWindowsEngineError && hasExistingGeneratedClient) {
  console.warn("\n[build] Prisma generate hit a locked Windows engine file. Reusing the existing generated client and continuing.\n");
  process.exit(0);
}

process.exit(result.status ?? 1);