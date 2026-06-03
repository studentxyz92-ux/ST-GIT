import { createHmac, timingSafeEqual } from "crypto";
import type { AuthProvider, SessionUser } from "@/core/types";

/**
 * DevScore Web Authentication configuration.
 * 
 * Provides:
 * - GitHub OAuth login for web app
 * - JWT session management
 * - Session cookie handling
 * - Auth context for React components
 */

const GITHUB_CLIENT_ID = process.env.DEVSCORE_GITHUB_CLIENT_ID || "";
const GITHUB_CLIENT_SECRET = process.env.DEVSCORE_GITHUB_CLIENT_SECRET || "";
const NEXTAUTH_SECRET = process.env.DEVSCORE_NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET || "devscore-dev-secret-change-in-production";
const NEXTAUTH_URL = process.env.DEVSCORE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

/**
 * Whether GitHub OAuth is configured.
 */
export function isOAuthConfigured(): boolean {
  return !!(GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET);
}

/**
 * Generate the GitHub OAuth authorization URL.
 */
export function getGitHubAuthUrl(state: string): string {
  const redirectUri = `${NEXTAUTH_URL}/api/auth/github/callback`;
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: "read:user repo read:org",
    state,
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

/**
 * Exchange an authorization code for an access token.
 */
export async function exchangeGitHubCode(code: string): Promise<{
  access_token: string;
  token_type: string;
  scope: string;
}> {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "DevScore-AI/1.0",
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  if (!res.ok) {
    throw new Error(`Token exchange failed: ${res.status}`);
  }

  return res.json();
}

/**
 * Fetch a GitHub user profile with an access token.
 */
export async function fetchGitHubUser(token: string): Promise<{
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}> {
  const res = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "DevScore-AI/1.0",
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch user: ${res.status}`);
  }

  return res.json();
}

/**
 * Signing key derived from the configured secret.
 */
function getSigningKey(): string {
  return NEXTAUTH_SECRET;
}

/**
 * Create a session token (JWT-like) for the web app.
 * Uses HMAC-SHA256 for signing.
 * In production, replace with a proper JWT library like `jose`.
 */
export function createSessionToken(user: {
  id: string;
  username: string;
  provider: AuthProvider;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  accessToken?: string;
}): string {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: user.id,
    username: user.username,
    provider: user.provider,
    name: user.name,
    email: user.email,
    picture: user.avatar_url,
    accessToken: user.accessToken || "",
    iat: now,
    exp: now + 7 * 24 * 3600, // 7 days
  };

  const encodeB64 = (data: object) =>
    Buffer.from(JSON.stringify(data)).toString("base64url");

  const h = encodeB64(header);
  const p = encodeB64(payload);

  // Proper HMAC-SHA256 signature
  const signature = createHmac("sha256", getSigningKey())
    .update(`${h}.${p}`)
    .digest()
    .toString("base64url");

  return `${h}.${p}.${signature}`;
}

/**
 * Verify a JWT signature against the secret key.
 */
function verifySignature(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    const [header, payload, signature] = parts;
    const expectedSig = createHmac("sha256", getSigningKey())
      .update(`${header}.${payload}`)
      .digest()
      .toString("base64url");

    // Constant-time comparison to prevent timing attacks
    if (signature.length !== expectedSig.length) return false;

    return timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSig)
    );
  } catch {
    return false;
  }
}

/**
 * Decode and verify a session token.
 * Verifies HMAC-SHA256 signature before returning the payload.
 */
export function decodeSessionToken(token: string): SessionUser | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // Verify the HMAC signature first
    if (!verifySignature(token)) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8")
    );

    // Verify expiry
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      id: payload.sub,
      provider: payload.provider || "github",
      providerAccountId: payload.sub,
      username: payload.username,
      name: payload.name || null,
      email: payload.email || null,
      avatar_url: payload.picture || null,
      accessToken: payload.accessToken || "",
      tokenExpiresAt: payload.exp
        ? new Date(payload.exp * 1000).toISOString()
        : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Extract auth info from a Next.js request.
 */
export function getSessionFromRequest(request: Request): SessionUser | null {
  // Check Authorization header first (for API calls)
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match) {
      const user = decodeSessionToken(match[1]);
      if (user) return user;
    }
  }

  // Check cookie (for browser requests)
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((c) => {
        const [k, ...v] = c.trim().split("=");
        return [k, v.join("=")];
      })
    );
    const sessionCookie = cookies["devscore.session-token"];
    if (sessionCookie) {
      const decoded = decodeURIComponent(sessionCookie);
      return decodeSessionToken(decoded);
    }
  }

  return null;
}

/**
 * Check if a session is valid and not expired.
 */
export function isSessionValid(user: SessionUser | null): boolean {
  if (!user) return false;
  if (!user.tokenExpiresAt) return true;
  return new Date(user.tokenExpiresAt) > new Date();
}
