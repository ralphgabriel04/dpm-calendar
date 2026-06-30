import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/infrastructure/auth/config";
import {
  buildAuthorizeUrl,
  isOAuthConfigured,
  type OAuthProvider,
} from "@/lib/integrations/oauth";

export const runtime = "nodejs";

const VALID: readonly OAuthProvider[] = ["NOTION", "TICKTICK"];

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  const p = params.provider.toUpperCase() as OAuthProvider;
  if (!VALID.includes(p)) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 404 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Config-gated: never start a flow we cannot complete. Clear, honest error.
  if (!isOAuthConfigured(p)) {
    return NextResponse.redirect(
      new URL("/integrations?error=not_configured", request.url)
    );
  }

  // CSRF protection: random state echoed back by the provider, stored in an
  // httpOnly cookie and verified on callback.
  const state = randomUUID();
  const response = NextResponse.redirect(buildAuthorizeUrl(p, state));
  response.cookies.set(`oauth_state_${p.toLowerCase()}`, state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return response;
}
