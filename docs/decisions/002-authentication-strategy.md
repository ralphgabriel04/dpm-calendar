# ADR-002: Authentication Strategy with NextAuth.js

## Status
Accepted

## Date
2024-03-15

## Context

DPM Calendar requires user authentication with the following requirements:

1. **Security**: Industry-standard security practices
2. **Multiple providers**: Google, GitHub OAuth for consumer users
3. **Enterprise SSO**: OIDC support for enterprise customers
4. **Calendar integration**: OAuth tokens for Google Calendar API access
5. **Session management**: Secure, scalable session handling
6. **Developer experience**: Easy to implement and maintain

## Decision

Use **NextAuth.js v4** (Auth.js) as the authentication solution with:

- **Google OAuth** as primary provider (for Google Calendar integration)
- **GitHub OAuth** as secondary provider
- **OIDC generic provider** for enterprise SSO
- **JWT + Database sessions** hybrid approach
- **Prisma adapter** for user/account persistence

Configuration:
```typescript
// src/infrastructure/auth/authOptions.ts
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({...}),
    GitHubProvider({...}),
    // OIDC for enterprise
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    jwt: async ({ token, account }) => {
      // Store OAuth tokens for API access
    },
    session: async ({ session, token }) => {
      // Enrich session with user data
    },
  },
};
```

## Consequences

### Positive
- **Security**: Battle-tested library with security best practices
- **Flexibility**: Easy to add/remove providers
- **Type safety**: Full TypeScript support
- **Next.js integration**: First-class App Router support
- **Token management**: Automatic refresh token handling
- **Community**: Large community, active maintenance

### Negative
- **Complexity**: Configuration can be complex for advanced use cases
- **Token encryption**: Need to encrypt stored OAuth tokens separately
- **Migration path**: Auth.js v5 migration will require effort

### Neutral
- Session strategy choice (JWT vs database) affects scalability vs features

## Alternatives Considered

### 1. Clerk
- **Pros**: Great DX, built-in UI components
- **Cons**: Vendor lock-in, monthly cost at scale, no self-hosting
- **Rejected**: Cost concerns for open-source project

### 2. Supabase Auth
- **Pros**: Integrated with database, good free tier
- **Cons**: Less flexible provider configuration, harder OIDC enterprise setup
- **Rejected**: Needed more control over OAuth token handling

### 3. Custom Implementation
- **Pros**: Full control
- **Cons**: Security risks, maintenance burden, reinventing the wheel
- **Rejected**: Not worth the risk and effort

## Implementation Notes

### Token Encryption
OAuth tokens for Google Calendar API are encrypted using AES-256-GCM before storage:

```typescript
// Encrypted in database
await prisma.account.update({
  data: {
    access_token: encrypt(accessToken),
    refresh_token: encrypt(refreshToken),
  },
});
```

### Demo Mode
For unauthenticated users, a demo mode is available with limited functionality:
- Read-only calendar view
- No data persistence
- Prompts to sign in for full features

## References

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
