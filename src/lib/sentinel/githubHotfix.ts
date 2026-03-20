/**
 * Push a proposed patch as a `.diff` file on a new hotfix branch (GitHub REST, no extra deps).
 */

function parseRepo(): { owner: string; repo: string } | null {
  const raw = process.env.GITHUB_REPO?.trim();
  if (!raw || !raw.includes('/')) return null;
  const [owner, repo] = raw.split('/').map((s) => s.trim());
  if (!owner || !repo) return null;
  return { owner, repo };
}

export async function pushSentinelPatchToHotfixBranch(opts: {
  patchBody: string;
  analysisSummary: string;
}): Promise<{ branch: string; htmlUrl: string } | null> {
  const token = process.env.GITHUB_TOKEN?.trim();
  const repo = parseRepo();
  if (!token || !repo) return null;

  const base = process.env.GITHUB_DEFAULT_BRANCH?.trim() || 'main';
  const ts = Date.now();
  const branch = `hotfix/sentinel-${ts}`;
  const path = `sentinel/proposed-patch-${ts}.diff`;

  const headers = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  };

  const refRes = await fetch(
    `https://api.github.com/repos/${repo.owner}/${repo.repo}/git/ref/heads/${base}`,
    { headers }
  );
  if (!refRes.ok) {
    throw new Error(`github_ref_${refRes.status}`);
  }
  const refJson = (await refRes.json()) as { object?: { sha?: string } };
  const sha = refJson.object?.sha;
  if (!sha) throw new Error('github_missing_base_sha');

  const createRef = await fetch(`https://api.github.com/repos/${repo.owner}/${repo.repo}/git/refs`, {
    method: 'POST',
    headers: { ...headers, 'content-type': 'application/json' },
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha }),
  });
  if (!createRef.ok) {
    const t = await createRef.text();
    throw new Error(`github_create_ref_${createRef.status}: ${t.slice(0, 400)}`);
  }

  const content = Buffer.from(
    `# BSD-YBM Sentinel (automated proposed patch)\n# ${new Date().toISOString()}\n\n${opts.analysisSummary}\n\n---\n\n${opts.patchBody}`,
    'utf8'
  ).toString('base64');

  const put = await fetch(
    `https://api.github.com/repos/${repo.owner}/${repo.repo}/contents/${encodeURIComponent(path)}`,
    {
      method: 'PUT',
      headers: { ...headers, 'content-type': 'application/json' },
      body: JSON.stringify({
        message: `chore(sentinel): proposed patch ${branch}`,
        content,
        branch,
      }),
    }
  );
  if (!put.ok) {
    const t = await put.text();
    throw new Error(`github_put_${put.status}: ${t.slice(0, 400)}`);
  }
  const putJson = (await put.json()) as { content?: { html_url?: string } };
  const htmlUrl = putJson.content?.html_url || `https://github.com/${repo.owner}/${repo.repo}/tree/${branch}`;
  return { branch, htmlUrl };
}
