# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1   | :x:                |

## Reporting a Vulnerability

We take security seriously at DPM Calendar. If you discover a security vulnerability, please follow responsible disclosure practices.

### How to Report

1. **Do NOT create a public GitHub issue** for security vulnerabilities
2. Email security concerns to: **security@dpmcalendar.com** (or use GitHub's private vulnerability reporting)
3. Include as much detail as possible:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Acknowledgment**: Within 48 hours of your report
- **Initial Assessment**: Within 5 business days
- **Resolution Timeline**: Varies based on severity
  - Critical: 24-72 hours
  - High: 1-2 weeks
  - Medium: 2-4 weeks
  - Low: Next release cycle

### Scope

The following are in scope for security reports:

- Authentication and authorization flaws
- Data exposure or leakage
- Cross-site scripting (XSS)
- Cross-site request forgery (CSRF)
- SQL injection
- Server-side request forgery (SSRF)
- Remote code execution
- Privilege escalation
- Insecure direct object references

### Out of Scope

- Rate limiting issues (unless causing DoS)
- Missing security headers (unless exploitable)
- Clickjacking on non-sensitive pages
- Social engineering attacks
- Physical security issues

---

## Security Measures

### Authentication

- **NextAuth.js** for secure session management
- **OAuth 2.0** providers (Google, GitHub)
- **Enterprise SSO** (OIDC) support
- **Secure session cookies** with HttpOnly and Secure flags
- **CSRF protection** via NextAuth.js

### Data Protection

- **At-rest encryption**: Supabase database encryption
- **In-transit encryption**: TLS 1.3 for all connections
- **Sensitive field encryption**: Using AES-256-GCM via `ENCRYPTION_KEY`
- **No plaintext secrets**: All secrets in environment variables

### Infrastructure

- **Vercel deployment** with edge security
- **Supabase** managed PostgreSQL with RLS (Row Level Security)
- **Environment isolation**: Separate staging and production

### Code Security

- **Dependency scanning**: Dependabot enabled
- **Static analysis**: ESLint security plugins
- **Type safety**: Full TypeScript coverage
- **Input validation**: Zod schemas for all API inputs
- **Parameterized queries**: Prisma ORM prevents SQL injection

---

## Security Checklist

### For Contributors

- [ ] Never commit secrets or API keys
- [ ] Use environment variables for configuration
- [ ] Validate all user inputs with Zod
- [ ] Use parameterized queries (Prisma handles this)
- [ ] Escape user content in UI (React handles this)
- [ ] Follow OWASP guidelines

### For Deployments

- [ ] Rotate `ENCRYPTION_KEY` if compromised
- [ ] Verify OAuth redirect URIs
- [ ] Enable Vercel preview protection
- [ ] Review Supabase RLS policies
- [ ] Check CORS configuration

---

## Known Security Considerations

### OAuth Token Storage

OAuth tokens for Google Calendar sync are encrypted at rest using AES-256-GCM. The encryption key is stored in `ENCRYPTION_KEY` environment variable.

### Push Notification Subscriptions

VAPID keys are used for Web Push notifications. The private key must never be exposed client-side.

### Rate Limiting

Currently implemented at the Vercel edge level. Consider adding application-level rate limiting for sensitive endpoints in future releases.

---

## Security Headers

The following security headers are configured in `next.config.js`:

```javascript
{
  'X-DNS-Prefetch-Control': 'on',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}
```

### Content Security Policy

CSP is configured to allow:
- Self-hosted scripts and styles
- Google OAuth endpoints
- Supabase API endpoints
- Vercel analytics

---

## Incident Response

### If a Security Incident Occurs

1. **Contain**: Immediately revoke compromised credentials
2. **Assess**: Determine scope and impact
3. **Notify**: Inform affected users within 72 hours (GDPR/Loi 25)
4. **Remediate**: Fix the vulnerability
5. **Review**: Post-incident analysis and documentation

### Contact

- Security Team: security@dpmcalendar.com
- Emergency: [GitHub Security Advisories](https://github.com/ralphchrg/dpm-calendar/security/advisories)

---

## Acknowledgments

We thank the following individuals for responsibly disclosing security issues:

*No reports yet. Be the first!*

---

## Related Documents

- [Privacy Policy](./legal/privacy-policy.md)
- [Terms of Service](./legal/terms-of-service.md)
- [Data Inventory](./docs/compliance/DATA_INVENTORY.md)
- [Contributing Guidelines](./CONTRIBUTING.md)
