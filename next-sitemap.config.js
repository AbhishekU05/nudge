/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://duely.in',
  generateRobotsTxt: true,
  sitemapSize: 7000,
  outDir: 'public',
}
