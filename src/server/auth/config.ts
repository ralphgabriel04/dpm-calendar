import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import MicrosoftEntraId from "next-auth/providers/microsoft-entra-id";
import Apple from "next-auth/providers/apple";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import type { OIDCConfig } from "next-auth/providers";
import { db } from "@/server/db/client";

// Check if OAuth providers are configured
const hasGoogleOAuth = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
const hasMicrosoftOAuth = process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET;
const hasAppleOAuth = process.env.APPLE_ID && process.env.APPLE_SECRET;
const hasGitHubOAuth = process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET;

// Enterprise SSO (OIDC)
const hasSSOOIDC = process.env.SSO_CLIENT_ID && process.env.SSO_CLIENT_SECRET && process.env.SSO_ISSUER;

// Build providers list dynamically
const providers = [];

if (hasGoogleOAuth) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events",
          access_type: "offline",
          prompt: "consent",
        },
      },
    })
  );
}

if (hasMicrosoftOAuth) {
  providers.push(
    MicrosoftEntraId({
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      issuer: "https://login.microsoftonline.com/common/v2.0",
      authorization: {
        params: {
          scope: "openid email profile User.Read Calendars.ReadWrite offline_access",
        },
      },
    })
  );
}

if (hasGitHubOAuth) {
  providers.push(
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    })
  );
}

if (hasAppleOAuth) {
  providers.push(
    Apple({
      clientId: process.env.APPLE_ID!,
      clientSecret: process.env.APPLE_SECRET!,
    })
  );
}

// Enterprise SSO via OIDC (works with Okta, Auth0, OneLogin, Azure AD, etc.)
if (hasSSOOIDC) {
  const ssoProvider: OIDCConfig<Record<string, unknown>> = {
    id: "sso",
    name: process.env.SSO_PROVIDER_NAME || "SSO",
    type: "oidc",
    clientId: process.env.SSO_CLIENT_ID!,
    clientSecret: process.env.SSO_CLIENT_SECRET!,
    issuer: process.env.SSO_ISSUER!,
    authorization: {
      params: {
        scope: "openid email profile",
      },
    },
    profile(profile) {
      return {
        id: profile.sub as string,
        name: (profile.name || profile.preferred_username || profile.email) as string,
        email: profile.email as string,
        image: profile.picture as string | undefined,
      };
    },
  };
  providers.push(ssoProvider);
}

// Check if any OAuth provider is configured
const hasAnyOAuth = hasGoogleOAuth || hasMicrosoftOAuth || hasAppleOAuth || hasGitHubOAuth || hasSSOOIDC;

// Demo credentials provider for testing (when no OAuth is configured)
// SECURITY: Disabled in production to prevent auth bypass (creates users without password verification)
if (!hasAnyOAuth && process.env.NODE_ENV !== "production") {
  providers.push(
    Credentials({
      name: "Demo Account",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "demo@example.com" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        // Find or create demo user
        let user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) {
          user = await db.user.create({
            data: {
              email: credentials.email as string,
              name: "Demo User",
            },
          });

          // Create a default calendar for the demo user
          await db.calendar.create({
            data: {
              userId: user.id,
              name: "My Calendar",
              color: "#3b82f6",
              isDefault: true,
              provider: "LOCAL",
            },
          });
        }

        return user;
      },
    })
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: hasAnyOAuth ? PrismaAdapter(db) : undefined,
  session: {
    strategy: hasAnyOAuth ? "database" : "jwt",
  },
  providers,
  events: {
    // Create default calendar when a new user signs up via OAuth
    async createUser({ user }) {
      if (user.id) {
        await db.calendar.create({
          data: {
            userId: user.id,
            name: "Mon Calendrier",
            color: "#3b82f6",
            isDefault: true,
            provider: "LOCAL",
          },
        });
      }
    },
  },
  callbacks: {
    async session({ session, user, token }) {
      if (session.user) {
        // For database sessions (Google OAuth)
        if (user) {
          session.user.id = user.id;
        }
        // For JWT sessions (Credentials)
        if (token?.sub) {
          session.user.id = token.sub;
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
  },
  trustHost: true,
});
