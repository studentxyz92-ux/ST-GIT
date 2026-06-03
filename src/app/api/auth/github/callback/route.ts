import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSessionToken } from "../../../../../lib/auth";

// This route uses Node.js crypto for JWT signing
export const runtime = "nodejs";

/**
 * GitHub OAuth callback.
 * Exchanges the authorization code for a token, fetches the user,
 * and creates a session by setting a cookie.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Handle OAuth errors from GitHub
  if (error) {
    return NextResponse.redirect(
      new URL("/login?error=oauth_failed", request.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/login?error=missing_params", request.url)
    );
  }

  // Verify state (CSRF protection)
  const cookieStore = await cookies();
  const storedState = cookieStore.get("github_oauth_state")?.value;

  if (!storedState || storedState !== state) {
    return NextResponse.redirect(
      new URL("/login?error=state_mismatch", request.url)
    );
  }

  const clientId = process.env.DEVSCORE_GITHUB_CLIENT_ID;
  const clientSecret = process.env.DEVSCORE_GITHUB_CLIENT_SECRET;
  const callbackUrl = process.env.DEVSCORE_URL
    ? `${process.env.DEVSCORE_URL}/api/auth/github/callback`
    : `http://localhost:3000/api/auth/github/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL("/login?error=oauth_not_configured", request.url)
    );
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "DevScore-AI/1.0",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: callbackUrl,
      }),
    });

    if (!tokenRes.ok) {
      throw new Error(`Token exchange failed: ${tokenRes.status}`);
    }

    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      throw new Error(`OAuth error: ${tokenData.error_description || tokenData.error}`);
    }

    const accessToken = tokenData.access_token;

    // Fetch user info
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "DevScore-AI/1.0",
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!userRes.ok) {
      throw new Error(`Failed to fetch user: ${userRes.status}`);
    }

    const user = await userRes.json();

    // Create session token using the shared utility (HMAC-SHA256 signed)
    const sessionToken = createSessionToken({
      id: user.id.toString(),
      username: user.login,
      provider: "github",
      name: user.name,
      email: user.email,
      avatar_url: user.avatar_url,
      accessToken,
    });

    // Redirect to app with session cookie
    const redirectUrl = new URL("/", request.url);
    const response = NextResponse.redirect(redirectUrl);

    // Set session cookie (httpOnly — safe from XSS)
    response.cookies.set("devscore.session-token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 3600, // 7 days
      path: "/",
    });

    // Also store user info in a non-httpOnly cookie for the frontend
    response.cookies.set("devscore.user", JSON.stringify({
      id: user.id,
      username: user.login,
      name: user.name,
      email: user.email,
      avatar_url: user.avatar_url,
    }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 3600,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("GitHub OAuth callback error:", err);
    return NextResponse.redirect(
      new URL("/login?error=oauth_failed", request.url)
    );
  }
}
