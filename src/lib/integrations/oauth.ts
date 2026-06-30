/**
 * Provider OAuth 2.0 configuration + helpers for Notion and TickTick.
 *
 * Server-only: reads CLIENT_ID / CLIENT_SECRET from process.env and never
 * exposes secrets to the client. No React here — pure config + fetch helpers.
 *
 * Config-gated: when a provider's client id/secret are absent, the calling
 * route returns a clear "not configured" response (never a fake success).
 */

export type OAuthProvider = "NOTION" | "TICKTICK";

interface OAuthConfig {
  authorizeUrl: string;
  tokenUrl: string;
  clientId?: string;
  clientSecret?: string;
  scopes: string;
}

/** Return the static OAuth endpoints + (optional) credentials for a provider. */
export function getOAuthConfig(p: OAuthProvider): OAuthConfig {
  switch (p) {
    case "NOTION":
      return {
        authorizeUrl: "https://api.notion.com/v1/oauth/authorize",
        tokenUrl: "https://api.notion.com/v1/oauth/token",
        clientId: process.env.NOTION_CLIENT_ID,
        clientSecret: process.env.NOTION_CLIENT_SECRET,
        // Notion does not use OAuth scopes; it uses owner=user + response_type=code.
        scopes: "",
      };
    case "TICKTICK":
      return {
        authorizeUrl: "https://ticktick.com/oauth/authorize",
        tokenUrl: "https://ticktick.com/oauth/token",
        clientId: process.env.TICKTICK_CLIENT_ID,
        clientSecret: process.env.TICKTICK_CLIENT_SECRET,
        scopes: "tasks:read tasks:write",
      };
  }
}

/** True only when both client id AND secret are present for the provider. */
export function isOAuthConfigured(p: OAuthProvider): boolean {
  const cfg = getOAuthConfig(p);
  return Boolean(cfg.clientId && cfg.clientSecret);
}

/** The redirect/callback URL registered with the provider for this app. */
export function redirectUri(p: OAuthProvider): string {
  const base = process.env.AUTH_URL ?? "http://localhost:3000";
  return `${base}/api/integrations/oauth/${p.toLowerCase()}/callback`;
}

/** Build the provider's authorize URL (the URL we redirect the user to). */
export function buildAuthorizeUrl(p: OAuthProvider, state: string): string {
  const cfg = getOAuthConfig(p);
  const params = new URLSearchParams({
    client_id: cfg.clientId ?? "",
    response_type: "code",
    redirect_uri: redirectUri(p),
    state,
  });

  if (p === "NOTION") {
    // Notion requires owner=user for public OAuth integrations.
    params.set("owner", "user");
  } else if (p === "TICKTICK") {
    params.set("scope", cfg.scopes);
  }

  return `${cfg.authorizeUrl}?${params.toString()}`;
}

interface TokenResult {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

/**
 * Exchange an authorization code for tokens at the provider's token endpoint.
 *
 * NOTION: HTTP Basic auth (clientId:clientSecret) + JSON body.
 * TICKTICK: form-urlencoded body with client_id/client_secret inline.
 *
 * Throws Error(`OAUTH_${provider}_${status}`) on a non-2xx response. Never logs
 * tokens.
 */
export async function exchangeCode(
  p: OAuthProvider,
  code: string
): Promise<TokenResult> {
  const cfg = getOAuthConfig(p);
  const uri = redirectUri(p);

  let res: Response;

  if (p === "NOTION") {
    const basic = Buffer.from(
      `${cfg.clientId}:${cfg.clientSecret}`
    ).toString("base64");
    res = await fetch(cfg.tokenUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: uri,
      }),
    });
  } else {
    const body = new URLSearchParams({
      client_id: cfg.clientId ?? "",
      client_secret: cfg.clientSecret ?? "",
      code,
      grant_type: "authorization_code",
      redirect_uri: uri,
      scope: cfg.scopes,
    });
    res = await fetch(cfg.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: body.toString(),
    });
  }

  if (!res.ok) {
    throw new Error(`OAUTH_${p}_${res.status}`);
  }

  const data = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };

  if (!data.access_token) {
    throw new Error(`OAUTH_${p}_no_access_token`);
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}
