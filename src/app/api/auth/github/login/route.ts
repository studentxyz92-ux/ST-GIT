import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

/**
 * GitHub OAuth login endpoint.
 * Redirects to GitHub's OAuth authorization page.
 */
export async function GET() {
  const clientId = process.env.DEVSCORE_GITHUB_CLIENT_ID;

  if (!clientId) {
    return new Response(
      JSON.stringify({
        error: "GitHub OAuth not configured. Set DEVSCORE_GITHUB_CLIENT_ID and DEVSCORE_GITHUB_CLIENT_SECRET.",
      }),
      {
        status: 501,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Generate a random state for CSRF protection
  const state = randomBytes(32).toString("hex");

  const callbackUrl = process.env.DEVSCORE_URL
    ? `${process.env.DEVSCORE_URL}/api/auth/github/callback`
    : `http://localhost:3000/api/auth/github/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    scope: "read:user repo read:org",
    state,
  });

  // Store state in a response cookie for CSRF verification
  const response = NextResponse.redirect(
    `https://github.com/login/oauth/authorize?${params.toString()}`
  );

  response.cookies.set("github_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  });

  return response;
}
