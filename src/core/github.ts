import type { RepoAnalysisInput, RepoFile, TreeEntry, UserRepo } from "./types";

const GITHUB_API = "https://api.github.com";

function getHeaders(token?: string) {
  return {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "DevScore-AI/1.0",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function getToken(): string | undefined {
  return process.env.GITHUB_TOKEN || process.env.DEVSCORE_GITHUB_TOKEN;
}

export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const cleaned = url.trim().replace(/\/$/, "").replace(/\.git$/, "");
    const patterns = [
      /github\.com[/:]([\w.-]+)\/([\w.-]+)/,
      /^([\w.-]+)\/([\w.-]+)$/,
    ];
    for (const p of patterns) {
      const m = cleaned.match(p);
      if (m) return { owner: m[1], repo: m[2] };
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchRepoInfo(owner: string, repo: string): Promise<RepoAnalysisInput> {
  const token = getToken();
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `GitHub API returned ${res.status}`);
  }
  const data = await res.json();
  return {
    name: data.name,
    full_name: data.full_name,
    description: data.description,
    language: data.language,
    topics: data.topics || [],
    stargazers_count: data.stargazers_count,
    forks_count: data.forks_count,
    open_issues_count: data.open_issues_count,
    size: data.size,
    license: data.license ? { name: data.license.name } : null,
    updated_at: data.updated_at,
    html_url: data.html_url,
    default_branch: data.default_branch || "main",
    visibility: data.visibility || "public",
    owner: { login: data.owner.login, avatar_url: data.owner.avatar_url },
  };
}

export async function fetchReadme(owner: string, repo: string): Promise<string> {
  try {
    const token = getToken();
    const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/readme`, {
      headers: { ...getHeaders(token), Accept: "application/vnd.github.v3.raw" },
    });
    if (!res.ok) return "";
    const text = await res.text();
    return text.slice(0, 3000);
  } catch {
    return "";
  }
}

export async function fetchFileTree(owner: string, repo: string, branch?: string): Promise<string> {
  try {
    const token = getToken();
    let b = branch || "main";
    const res = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${b}?recursive=1`,
      { headers: getHeaders(token) }
    );
    if (!res.ok) {
      // Try master branch
      if (b === "main") return fetchFileTree(owner, repo, "master");
      return "";
    }
    const data = await res.json();
    const entries: TreeEntry[] = data.tree || [];
    return entries
      .filter((e) => e.type === "blob" || e.type === "tree")
      .slice(0, 120)
      .map((e) => e.path)
      .join("\n");
  } catch {
    return "";
  }
}

export async function fetchCodeSnippets(owner: string, repo: string): Promise<string> {
  try {
    const token = getToken();
    const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/`, {
      headers: getHeaders(token),
    });
    if (!res.ok) return "";
    const files: RepoFile[] = await res.json();
    const codeExts = [".js", ".ts", ".py", ".java", ".go", ".rs", ".cpp", ".tsx", ".jsx"];
    const codeFiles = files.filter(
      (f) => f.type === "file" && codeExts.some((ext) => f.name.endsWith(ext))
    ).slice(0, 3);

    const snippets: string[] = [];
    for (const file of codeFiles) {
      const r = await fetch(
        `${GITHUB_API}/repos/${owner}/${repo}/contents/${file.path}`,
        { headers: { ...getHeaders(token), Accept: "application/vnd.github.v3.raw" } }
      );
      if (r.ok) {
        const content = await r.text();
        snippets.push(`--- ${file.path} ---\n${content.slice(0, 800)}`);
      }
    }
    return snippets.join("\n\n");
  } catch {
    return "";
  }
}

export async function fetchUserRepos(username: string): Promise<UserRepo[]> {
  const token = getToken();
  const allRepos: UserRepo[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore && page <= 5) {
    const res = await fetch(
      `${GITHUB_API}/users/${username}/repos?per_page=100&page=${page}&sort=updated&type=public`,
      { headers: getHeaders(token) }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `GitHub API returned ${res.status}`);
    }
    const repos: UserRepo[] = await res.json();
    allRepos.push(...repos);
    hasMore = repos.length === 100;
    page++;
  }

  return allRepos.filter((r) => !r.fork && !r.archived);
}

export async function fetchUserInfo(username: string): Promise<{
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  blog: string | null;
  location: string | null;
  company: string | null;
  html_url: string;
}> {
  const token = getToken();
  const res = await fetch(`${GITHUB_API}/users/${username}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `GitHub API returned ${res.status}`);
  }
  return res.json();
}
