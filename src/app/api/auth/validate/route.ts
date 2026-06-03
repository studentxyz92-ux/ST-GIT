import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/core/auth/apiAuth";

/**
 * POST /api/auth/validate
 * Validates an authentication token or API key.
 * Used by the CLI to verify tokens, and by the web app to check sessions.
 *
 * Request body:
 *   { token?: string, apiKey?: string }
 *
 * Or via Authorization header:
 *   Authorization: Bearer <token|api_key>
 *
 * Response:
 *   { valid, type, user?, error? }
 */
export async function POST(request: NextRequest) {
  try {
    // Try Authorization header first
    const authHeader = request.headers.get("authorization");
    let result;

    if (authHeader) {
      result = await validateRequest(authHeader);
    } else {
      // Try request body
      const body = await request.json().catch(() => ({}));
      const token = body.token || body.apiKey;

      if (!token) {
        return NextResponse.json({
          valid: false,
          type: "none",
          error: "No token or API key provided. Pass via Authorization header or request body.",
        });
      }

      result = await validateRequest(`Bearer ${token}`);
    }

    // Don't expose the actual token in response
    if (result.user) {
      const { accessToken, ...safeUser } = result.user;
      return NextResponse.json({
        ...result,
        user: safeUser,
      });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("Token validation error:", err);
    return NextResponse.json(
      {
        valid: false,
        type: "none",
        error: "Internal validation error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/validate
 * Validates the session from the request cookie (browser).
 */
export async function GET(request: NextRequest) {
  // Check session cookie
  const sessionCookie = request.cookies.get("devscore.session-token")?.value;
  if (!sessionCookie) {
    return NextResponse.json({
      authenticated: false,
      valid: false,
    });
  }

  // Validate via the same engine
  const result = await validateRequest(`Bearer ${sessionCookie}`);

  if (result.valid && result.user) {
    const { accessToken, ...safeUser } = result.user;
    return NextResponse.json({
      authenticated: true,
      valid: true,
      user: safeUser,
    });
  }

  return NextResponse.json({
    authenticated: false,
    valid: false,
  });
}
