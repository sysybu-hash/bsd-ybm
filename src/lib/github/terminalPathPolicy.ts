/**
 * Allow-list for Owner AI Terminal → GitHub writes. Rejects traversal and sensitive paths.
 */

const ALLOWED_PREFIXES = ['src/', 'public/', 'prisma/'] as const;

const ALLOWED_ROOT_FILES = new Set([
  'package.json',
  'package-lock.json',
  'next.config.js',
  'next.config.mjs',
  'next.config.ts',
  'tsconfig.json',
  'eslint.config.mjs',
  'postcss.config.mjs',
  'middleware.ts',
  'template.env',
  'README.md',
  'AGENTS.md',
  'CLAUDE.md',
]);

function hasBadSegments(p: string): boolean {
  const parts = p.split('/').filter((s) => s.length > 0);
  for (const seg of parts) {
    if (seg === '..') return true;
    if (seg.startsWith('.')) return true;
  }
  return false;
}

/**
 * Returns normalized repo-relative path or null if disallowed.
 */
export function sanitizeTerminalRepoPath(raw: string): string | null {
  const trimmed = raw.trim().replace(/\\/g, '/');
  if (!trimmed || trimmed.startsWith('/') || trimmed.includes('\0')) return null;
  if (trimmed.includes('..')) return null;
  if (hasBadSegments(trimmed)) return null;
  if (trimmed.includes('.env') && trimmed !== 'template.env') return null;

  for (const prefix of ALLOWED_PREFIXES) {
    if (trimmed.startsWith(prefix) && trimmed.length > prefix.length) return trimmed;
  }
  if (ALLOWED_ROOT_FILES.has(trimmed)) return trimmed;
  return null;
}

export function encodeGithubContentPath(path: string): string {
  return path
    .split('/')
    .filter((s) => s.length > 0)
    .map((s) => encodeURIComponent(s))
    .join('/');
}
