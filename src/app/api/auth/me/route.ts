import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/core/auth/apiAuth";

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's info.
 * Works with both web session cookies and Authorization headers.
 */
export async function GET(request: NextRequest) {
  // Check session cookie first (browser)
  const sessionCookie = request.cookies.get("devscore.session-token")?.value;
  const userCookie = request.cookies.get("devscore.user")?.value;

  if (sessionCookie && userCookie) {
    // Validate the session token
    const result = await validateRequest(`Bearer ${sessionCookie}`);

    if (result.valid && result.user) {
      const { accessToken, ...safeUser } = result.user;

      // Merge with stored user info from cookie
      try {
        const storedUser = JSON.parse(userCookie);
        return NextResponse.json({
          authenticated: true,
          user: {
            ...safeUser,
            ...storedUser,
          },
          authMethod: "session",
        });
      } catch {
        return NextResponse.json({
          authenticated: true,
          user: safeUser,
          authMethod: "session",
        });
      }
    }
  }

  // Fallback: check Authorization header
  const authHeader = request.headers.get("authorization");

  if (authHeader) {
    const result = await validateRequest(authHeader);

    if (result.valid && result.user) {
      const { accessToken, ...safeUser } = result.user;
      return NextResponse.json({
        authenticated: true,
        user: safeUser,
        authMethod: result.type === "api_key" ? "api_key" : "token",
      });
    }
  }

  return NextResponse.json(
    {
      authenticated: false,
      user: null,
    },
    { status: 401 }
  );
}
