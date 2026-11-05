import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// CSP without nonces, so public pages can stay statically cached (ISR). Inline scripts are still needed
// for Next.js hydration; eval only in development (React's dev tooling).
// Images are plain <img> tags with admin-supplied URLs (next/image's optimiser isn't used), so any https image is allowed.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000" }]),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Later entries override earlier ones for the same header.
      // Private member links carry a secret token in the URL: never send it anywhere, never cache the page.
      {
        source: "/kemaskini/:path*",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Cache-Control", value: "private, no-store" },
        ],
      },
      { source: "/admin/:path*", headers: [{ key: "Referrer-Policy", value: "same-origin" }] },
    ];
  },
};

export default nextConfig;
