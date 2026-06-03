import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/logout
 * Clears all session cookies.
 */
export async function POST() {
  const response = NextResponse.json({
    loggedOut: true,
    message: "Successfully logged out",
  });

  // Clear all auth cookies
  response.cookies.set("devscore.session-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  response.cookies.set("devscore.user", "", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  response.cookies.set("github_oauth_state", "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });

  return response;
}

/**
 * GET /api/auth/logout
 * Redirects to login page after clearing cookies.
 */
export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url));

  response.cookies.set("devscore.session-token", "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });

  response.cookies.set("devscore.user", "", {
    httpOnly: false,
    maxAge: 0,
    path: "/",
  });

  response.cookies.set("github_oauth_state", "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });

  return response;
}
