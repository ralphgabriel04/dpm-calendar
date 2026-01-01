import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/server/db/client";

// Check if Google OAuth is configured
const hasGoogleOAuth = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;

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

// Demo credentials provider for testing (when no OAuth is configured)
if (!hasGoogleOAuth) {
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
  adapter: hasGoogleOAuth ? PrismaAdapter(db) : undefined,
  session: {
    strategy: hasGoogleOAuth ? "database" : "jwt",
  },
  providers,
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
