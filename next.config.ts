import type { NextConfig } from "next";

const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com https://www.googletagmanager.com https://www.clarity.ms;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self';
  connect-src 'self' https://accounts.google.com https://api.stripe.com https://*.supabase.co https://www.google-analytics.com https://*.analytics.google.com https://*.clarity.ms;
  frame-src 'self' https://accounts.google.com https://js.stripe.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'self';
  upgrade-insecure-requests;
`;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async rewrites() {
    return [
      // MCP OAuth discovery — RFC 8414 / RFC 9728 require these exact
      // /.well-known/ URLs; map them to the route handlers under /api/mcp.
      {
        source: '/.well-known/oauth-authorization-server',
        destination: '/api/mcp/metadata/authorization-server',
      },
      {
        source: '/.well-known/oauth-protected-resource',
        destination: '/api/mcp/metadata/protected-resource',
      },
      {
        source: '/.well-known/oauth-protected-resource/:path*',
        destination: '/api/mcp/metadata/protected-resource',
      },
      // Affonso first-party proxy — routes /r/* through our domain so ad blockers
      // cannot distinguish affiliate tracking from first-party requests.
      {
        source: '/r/pixel.js',
        destination: 'https://cdn.affonso.io/js/pixel.min.js',
      },
      {
        source: '/r/psl.min.js',
        destination: 'https://cdn.affonso.io/js/psl.min.js',
      },
      {
        source: '/r/track',
        destination: 'https://api.affonso.io/v1/track',
      },
      {
        source: '/r/signups',
        destination: 'https://api.affonso.io/v1/signups',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: ContentSecurityPolicy.replace(/\s{2,}/g, ' ').trim(),
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(self)',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
