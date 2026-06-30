import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/infrastructure/auth/config";
import { dbAdmin } from "@/infrastructure/db/client";
import { encryptToken } from "@/lib/crypto";
import { exchangeCode, type OAuthProvider } from "@/lib/integrations/oauth";

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
  const userId = session.user.id;

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  // Provider-side denial (user clicked "cancel", etc.).
  if (oauthError) {
    return NextResponse.redirect(
      new URL("/integrations?error=oauth_denied", request.url)
    );
  }

  // CSRF: verify the state cookie matches the returned state.
  const cookieName = `oauth_state_${p.toLowerCase()}`;
  const expectedState = request.cookies.get(cookieName)?.value;
  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(
      new URL("/integrations?error=state_mismatch", request.url)
    );
  }

  let tok: Awaited<ReturnType<typeof exchangeCode>>;
  try {
    tok = await exchangeCode(p, code);
  } catch {
    // Never log token-exchange details (may leak codes/secrets).
    return NextResponse.redirect(
      new URL("/integrations?error=oauth_failed", request.url)
    );
  }

  const label = p === "NOTION" ? "Notion" : "TickTick";
  const data = {
    accessToken: encryptToken(tok.accessToken),
    refreshToken: tok.refreshToken ? encryptToken(tok.refreshToken) : null,
    expiresAt: tok.expiresIn
      ? new Date(Date.now() + tok.expiresIn * 1000)
      : null,
    label,
    isActive: true,
    lastError: null,
  };

  // The @@unique is ([userId, provider, sourceUrl]) and sourceUrl is null for
  // OAuth providers, so a null-keyed compound upsert isn't usable. Find-then-
  // write instead.
  const existing = await dbAdmin.externalIntegration.findFirst({
    where: { userId, provider: p },
  });

  if (existing) {
    await dbAdmin.externalIntegration.update({
      where: { id: existing.id },
      data,
    });
  } else {
    await dbAdmin.externalIntegration.create({
      data: { userId, provider: p, ...data },
    });
  }

  const response = NextResponse.redirect(
    new URL(`/integrations?connected=${p.toLowerCase()}`, request.url)
  );
  // Clear the one-time state cookie.
  response.cookies.set(cookieName, "", { path: "/", maxAge: 0 });

  return response;
}
