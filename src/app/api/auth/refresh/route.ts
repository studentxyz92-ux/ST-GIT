import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/core/auth/apiAuth";

/**
 * POST /api/auth/refresh
 * Refreshes the session token.
 * Requires a valid session cookie or Authorization header.
 *
 * Returns a new session cookie and token.
 */
export async function POST(request: NextRequest) {
  const sessionCookie = request.cookies.get("devscore.session-token")?.value;
  const authHeader = request.headers.get("authorization");

  const token = sessionCookie
    ? `Bearer ${sessionCookie}`
    : authHeader;

  if (!token) {
    return NextResponse.json(
      {
        error: "No session to refresh. Please log in.",
      },
      { status: 401 }
    );
  }

  const result = await validateRequest(token);

  if (!result.valid || !result.user) {
    return NextResponse.json(
      {
        error: "Invalid or expired session. Please log in again.",
        refreshed: false,
      },
      { status: 401 }
    );
  }

  try {
    // Fetch fresh user data from GitHub
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${result.user.accessToken}`,
        "User-Agent": "DevScore-AI/1.0",
        Accept: "application/vnd.github.v3+json",
      },
    });

    let userData = null;
    if (userRes.ok) {
      userData = await userRes.json();
    }

    // Create new session token
    const now = Math.floor(Date.now() / 1000);
    const newPayload = {
      sub: result.user.id,
      username: userData?.login || result.user.username,
      provider: result.user.provider,
      name: userData?.name || result.user.name,
      email: userData?.email || result.user.email,
      picture: userData?.avatar_url || result.user.avatar_url,
      iat: now,
      exp: now + 7 * 24 * 3600, // 7 days from now
    };

    const secret = process.env.DEVSCORE_NEXTAUTH_SECRET ||
      process.env.NEXTAUTH_SECRET ||
      "devscore-dev-secret-change-in-production";

    const encodeB64 = (data: object) =>
      Buffer.from(JSON.stringify(data)).toString("base64url");

    const header = { alg: "HS256", typ: "JWT" };
    const h = encodeB64(header);
    const p = encodeB64(newPayload);
    const signature = Buffer.from(
      require("crypto")
        .createHmac("sha256", secret)
        .update(`${h}.${p}`)
        .digest()
    ).toString("base64url");

    const newToken = `${h}.${p}.${signature}`;

    // Set new cookies
    const response = NextResponse.json({
      refreshed: true,
      expiresAt: new Date(newPayload.exp * 1000).toISOString(),
      user: {
        id: result.user.id,
        username: newPayload.username,
        name: newPayload.name,
        email: newPayload.email,
        avatar_url: newPayload.picture,
      },
    });

    response.cookies.set("devscore.session-token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 3600,
      path: "/",
    });

    if (userData) {
      response.cookies.set("devscore.user", JSON.stringify({
        id: userData.id,
        username: userData.login,
        name: userData.name,
        email: userData.email,
        avatar_url: userData.avatar_url,
      }), {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 3600,
        path: "/",
      });
    }

    return response;
  } catch (err) {
    console.error("Session refresh error:", err);
    return NextResponse.json(
      {
        error: "Failed to refresh session. Please log in again.",
        refreshed: false,
      },
      { status: 500 }
    );
  }
}
