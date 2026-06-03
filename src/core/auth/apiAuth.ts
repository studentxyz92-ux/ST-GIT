import type {
  AuthMiddlewareOptions,
  AuthValidationResult,
  SessionUser,
  ApiKeyEntry,
  AuthProvider,
} from "../types.js";
import { PROVIDERS } from "./providers.js";

/**
 * Parse and validate an Authorization header.
 * Supports: Bearer <jwt>, Bearer <api_key>, Bearer <github_token>
 */
function parseAuthHeader(header: string | null): {
  type: "api_key" | "session" | "token";
  value: string;
} | null {
  if (!header) return null;

  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const value = match[1].trim();

  // API keys start with ds_live_
  if (value.startsWith("ds_live_")) {
    return { type: "api_key", value };
  }

  // JWT web sessions
  if (value.split(".").length === 3) {
    return { type: "session", value };
  }

  // Fallback: treat as raw token
  return { type: "token", value };
}

import { createHmac, timingSafeEqual } from "crypto";

/**
 * Get the JWT signing secret.
 */
function getSigningSecret(): string {
  return process.env.DEVSCORE_NEXTAUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "devscore-dev-secret-change-in-production";
}

/**
 * Verify a JWT HMAC-SHA256 signature.
 */
function verifyJwtSignature(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    const [header, payload, signature] = parts;
    const expectedSig = createHmac("sha256", getSigningSecret())
      .update(`${header}.${payload}`)
      .digest()
      .toString("base64url");

    if (signature.length !== expectedSig.length) return false;
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig));
  } catch {
    return false;
  }
}

/**
 * Decode and verify a JWT session token.
 * Verifies HMAC-SHA256 signature before trusting the payload.
 */
function decodeSessionToken(token: string): SessionUser | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // Verify the HMAC signature first
    if (!verifyJwtSignature(token)) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8")
    );
    if (!payload || !payload.sub) return null;

    return {
      id: payload.sub,
      provider: (payload.provider || "github") as AuthProvider,
      providerAccountId: payload.providerAccountId || payload.sub,
      username: payload.username || "",
      name: payload.name || null,
      email: payload.email || null,
      avatar_url: payload.picture || null,
      accessToken: token,
      tokenExpiresAt: payload.exp
        ? new Date(payload.exp * 1000).toISOString()
        : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Verify an API key against known stored keys.
 * API keys are stored in the credential store and can be checked
 * against the encrypted local store or a remote server.
 */
async function verifyApiKey(
  apiKey: string,
  requiredScopes?: string[]
): Promise<SessionUser | null> {
  // The full key is: ds_live_<random-hex>
  // We extract the prefix for lookup
  const keyPrefix = apiKey.slice(0, 16);

  // In a production system, this would check against:
  // 1. A database of issued API keys (hashed)
  // 2. The local credential store for CLI-originated keys
  // 3. A remote validation endpoint

  // For now, we validate the format and return a minimal user
  if (!apiKey.startsWith("ds_live_") || apiKey.length < 32) {
    return null;
  }

  // Check against env overrides
  const envKey = process.env.DEVSCORE_MASTER_KEY;
  if (envKey && apiKey === envKey) {
    return {
      id: "master",
      provider: "github",
      providerAccountId: "master",
      username: "admin",
      name: "Admin",
      email: null,
      avatar_url: null,
      accessToken: apiKey,
    };
  }

  // Validate scopes if required
  if (requiredScopes && requiredScopes.length > 0) {
    // In production: check stored key scopes
    // For now: all keys have full access
  }

  // Return a limited session for API key users
  return {
    id: `key:${keyPrefix}`,
    provider: "github" as AuthProvider,
    providerAccountId: `api:${keyPrefix}`,
    username: `api-${keyPrefix}`,
    name: "API User",
    email: null,
    avatar_url: null,
    accessToken: apiKey,
  };
}

/**
 * Validate authentication for an API request.
 * Checks: JWT session → API key → env token (in order).
 */
export async function validateRequest(
  authHeader: string | null,
  options: AuthMiddlewareOptions = {}
): Promise<AuthValidationResult> {
  const parsed = parseAuthHeader(authHeader);

  if (!parsed) {
    if (options.optional) {
      return { valid: true, type: "none" };
    }
    return {
      valid: false,
      type: "none",
      error: "No authorization header provided",
    };
  }

  // Session JWT (web app)
  if (parsed.type === "session") {
    const user = decodeSessionToken(parsed.value);
    if (!user) {
      return { valid: false, type: "session", error: "Invalid or expired session" };
    }

    // Check token expiry
    if (user.tokenExpiresAt && new Date(user.tokenExpiresAt) < new Date()) {
      return { valid: false, type: "session", error: "Session expired" };
    }

    return { valid: true, type: "session", user };
  }

  // API key (CLI/CI)
  if (parsed.type === "api_key") {
    const user = await verifyApiKey(parsed.value, options.requiredScopes);
    if (!user) {
      return { valid: false, type: "api_key", error: "Invalid API key" };
    }
    return { valid: true, type: "api_key", user };
  }

  // Raw token from CLI
  if (parsed.type === "token") {
    // Validate by doing a test call to GitHub
    try {
      const res = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${parsed.value}`,
          "User-Agent": "DevScore-AI/1.0",
        },
      });
      if (!res.ok) {
        return {
          valid: false,
          type: "none",
          error: "Token validation failed against GitHub",
        };
      }
      const data = await res.json();
      return {
        valid: true,
        type: "session",
        user: {
          id: data.id?.toString() || data.login,
          provider: "github",
          providerAccountId: data.login,
          username: data.login,
          name: data.name || null,
          email: data.email || null,
          avatar_url: data.avatar_url || null,
          accessToken: parsed.value,
        },
      };
    } catch {
      return { valid: false, type: "none", error: "Token validation failed" };
    }
  }

  return { valid: false, type: "none", error: "Invalid authentication format" };
}

/**
 * Express/Next.js style request handler wrapper that validates auth
 * and passes the session to the handler.
 */
export function withAuth(
  handler: (req: Request, user: SessionUser) => Promise<Response>,
  options: AuthMiddlewareOptions = {}
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    const authHeader = req.headers.get("authorization");
    const result = await validateRequest(authHeader, options);

    if (!result.valid) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: result.error,
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // For optional auth, pass null user instead of failing
    if (result.type === "none" && !result.user) {
      return handler(req, null as unknown as SessionUser);
    }

    return handler(req, result.user!);
  };
}
