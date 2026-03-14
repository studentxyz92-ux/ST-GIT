export interface RepoInfo {
    name: string;
    full_name: string;
    description: string | null;
    language: string | null;
    topics: string[];
    stargazers_count: number;
    forks_count: number;
    open_issues_count: number;
    created_at: string;
    updated_at: string;
    size: number;
    default_branch: string;
    license: { name: string } | null;
    has_wiki: boolean;
    has_pages: boolean;
    visibility: string;
    html_url: string;
}

export interface RepoFile {
    name: string;
    path: string;
    type: "file" | "dir";
    size?: number;
}

export interface TreeEntry {
    path: string;
    type: string;
}

const GITHUB_API = "https://api.github.com";

function getHeaders() {
    const token = process.env.GITHUB_TOKEN;
    return {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "DevScore-AI/1.0",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
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

export async function fetchRepoInfo(owner: string, repo: string): Promise<RepoInfo> {
    const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, {
        headers: getHeaders(),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `GitHub API returned ${res.status}`);
    }
    return res.json();
}

export async function fetchReadme(owner: string, repo: string): Promise<string> {
    try {
        const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/readme`, {
            headers: { ...getHeaders(), Accept: "application/vnd.github.v3.raw" },
        });
        if (!res.ok) return "";
        const text = await res.text();
        return text.slice(0, 3000); // limit size
    } catch {
        return "";
    }
}

export async function fetchFileTree(owner: string, repo: string, branch: string): Promise<string> {
    try {
        const res = await fetch(
            `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
            { headers: getHeaders() }
        );
        if (!res.ok) return "";
        const data = await res.json();
        const entries: TreeEntry[] = data.tree || [];
        const relevant = entries
            .filter((e) => e.type === "blob" || e.type === "tree")
            .slice(0, 120)
            .map((e) => e.path);
        return relevant.join("\n");
    } catch {
        return "";
    }
}

export async function fetchCodeSnippets(
    owner: string,
    repo: string
): Promise<string> {
    try {
        const res = await fetch(
            `${GITHUB_API}/repos/${owner}/${repo}/contents/`,
            { headers: getHeaders() }
        );
        if (!res.ok) return "";
        const files: RepoFile[] = await res.json();

        // Grab a few source files
        const codeExts = [".js", ".ts", ".py", ".java", ".go", ".rs", ".cpp", ".tsx", ".jsx"];
        const codeFiles = files.filter(
            (f) => f.type === "file" && codeExts.some((ext) => f.name.endsWith(ext))
        ).slice(0, 3);

        const snippets: string[] = [];
        for (const file of codeFiles) {
            const r = await fetch(
                `${GITHUB_API}/repos/${owner}/${repo}/contents/${file.path}`,
                { headers: { ...getHeaders(), Accept: "application/vnd.github.v3.raw" } }
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
