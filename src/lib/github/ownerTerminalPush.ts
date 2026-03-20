/**
 * Create a branch from default and PUT file contents via GitHub REST (owner terminal).
 */

import { encodeGithubContentPath } from '@/lib/github/terminalPathPolicy';

export type GithubRepoRef = { owner: string; repo: string };

export function parseGithubRepo(): GithubRepoRef | null {
  const raw = process.env.GITHUB_REPO?.trim();
  if (!raw || !raw.includes('/')) return null;
  const [owner, repo] = raw.split('/').map((s) => s.trim());
  if (!owner || !repo) return null;
  return { owner, repo };
}

const HEADERS_BASE = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
} as const;

function authHeaders(token: string): Record<string, string> {
  return { ...HEADERS_BASE, Authorization: `Bearer ${token}` };
}

export async function createBranchFromDefault(opts: {
  token: string;
  owner: string;
  repo: string;
  baseBranch: string;
  newBranch: string;
}): Promise<void> {
  const { token, owner, repo, baseBranch, newBranch } = opts;
  const headers = authHeaders(token);

  const refRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(baseBranch)}`,
    { headers }
  );
  if (!refRes.ok) {
    throw new Error(`github_ref_${refRes.status}`);
  }
  const refJson = (await refRes.json()) as { object?: { sha?: string } };
  const sha = refJson.object?.sha;
  if (!sha) throw new Error('github_missing_base_sha');

  const createRef = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
    method: 'POST',
    headers: { ...headers, 'content-type': 'application/json' },
    body: JSON.stringify({ ref: `refs/heads/${newBranch}`, sha }),
  });
  if (!createRef.ok) {
    const t = await createRef.text();
    throw new Error(`github_create_ref_${createRef.status}: ${t.slice(0, 400)}`);
  }
}

async function getBlobSha(opts: {
  token: string;
  owner: string;
  repo: string;
  path: string;
  branch: string;
}): Promise<string | undefined> {
  const { token, owner, repo, path, branch } = opts;
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeGithubContentPath(path)}?ref=${encodeURIComponent(branch)}`;
  const res = await fetch(url, { headers: authHeaders(token) });
  if (res.status === 404) return undefined;
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`github_get_${res.status}: ${t.slice(0, 400)}`);
  }
  const j = (await res.json()) as { sha?: string };
  return j.sha;
}

export async function putRepositoryFile(opts: {
  token: string;
  owner: string;
  repo: string;
  path: string;
  content: string;
  branch: string;
  message: string;
}): Promise<{ html_url?: string }> {
  const { token, owner, repo, path, content, branch, message } = opts;
  const headers = { ...authHeaders(token), 'content-type': 'application/json' };
  const existingSha = await getBlobSha({ token, owner, repo, path, branch });

  const body: Record<string, string> = {
    message,
    content: Buffer.from(content, 'utf8').toString('base64'),
    branch,
  };
  if (existingSha) body.sha = existingSha;

  const put = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${encodeGithubContentPath(path)}`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    }
  );
  if (!put.ok) {
    const t = await put.text();
    throw new Error(`github_put_${put.status}: ${t.slice(0, 400)}`);
  }
  const putJson = (await put.json()) as { content?: { html_url?: string } };
  return { html_url: putJson.content?.html_url };
}

export async function pushOwnerTerminalFiles(opts: {
  files: Array<{ path: string; content: string }>;
  commitMessage: string;
}): Promise<{ branch: string; htmlUrl: string }> {
  const token = process.env.GITHUB_TOKEN?.trim();
  const repo = parseGithubRepo();
  if (!token || !repo) {
    throw new Error('GITHUB_TOKEN or GITHUB_REPO not configured');
  }

  const base = process.env.GITHUB_DEFAULT_BRANCH?.trim() || 'main';
  const branch = `owner-terminal/${Date.now()}`;
  await createBranchFromDefault({
    token,
    owner: repo.owner,
    repo: repo.repo,
    baseBranch: base,
    newBranch: branch,
  });

  let lastUrl = `https://github.com/${repo.owner}/${repo.repo}/tree/${branch}`;
  for (let i = 0; i < opts.files.length; i++) {
    const f = opts.files[i]!;
    const msg =
      opts.files.length === 1
        ? opts.commitMessage
        : `${opts.commitMessage} (${i + 1}/${opts.files.length}: ${f.path})`;
    const r = await putRepositoryFile({
      token,
      owner: repo.owner,
      repo: repo.repo,
      path: f.path,
      content: f.content,
      branch,
      message: msg,
    });
    if (r.html_url) lastUrl = r.html_url;
  }

  return { branch, htmlUrl: lastUrl };
}
