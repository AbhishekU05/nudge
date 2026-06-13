/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || "https://duely.in",
  generateRobotsTxt: true,
  sitemapSize: 7000,
  outDir: "public",
  exclude: [
    "/article",
    "/payment-leak-calculator",
    "/checkout",
    "/dashboard",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/settings/*",
    "/customers/*",
    "/reminders/*",
    "/feedback",
    "/unsubscribe",
    "/payment-received",
    "/auth/*",
    "/api/*",
  ],
  additionalPaths: async () => [
    {
      loc: "/",
      changefreq: "weekly",
      priority: 1.0,
      lastmod: new Date().toISOString(),
    },
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
      },
      {
        userAgent: "GPTBot",
        allow: "/",
      },
      {
        userAgent: "ChatGPT-User",
        allow: "/",
      },
      {
        userAgent: "ClaudeBot",
        allow: "/",
      },
      {
        userAgent: "anthropic-ai",
        allow: "/",
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
      },
      {
        userAgent: "Googlebot",
        allow: "/",
      },
    ],
    additionalSitemaps: [],
  },
};
