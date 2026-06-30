import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Content Security Policy. Sent Report-Only (see securityHeaders) with a
// report-uri sink at /api/csp-report. ROLLOUT TO ENFORCED:
//   1. Observe /api/csp-report logs in production for ~1-2 weeks.
//   2. Once quiet, switch the header key below from
//      "Content-Security-Policy-Report-Only" to "Content-Security-Policy".
//   3. Hardening (separate change): adopt a per-request nonce in middleware to
//      drop 'unsafe-inline'/'unsafe-eval' from script-src.
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://vitals.vercel-insights.com https://js.stripe.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://*.supabase.co https://*.vercel.app https://va.vercel-scripts.com https://vitals.vercel-insights.com https://api.stripe.com wss:",
  "frame-src 'self' https://accounts.google.com https://login.microsoftonline.com https://js.stripe.com https://checkout.stripe.com",
  "frame-ancestors 'none'",
  "form-action 'self' https://accounts.google.com https://login.microsoftonline.com",
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
  "report-uri /api/csp-report",
].join("; ");

const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(self), geolocation=(), interest-cohort=()",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Content-Security-Policy-Report-Only",
    value: cspDirectives,
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
