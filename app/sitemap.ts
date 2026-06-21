/* eslint-disable */
import { MetadataRoute } from "next";
import fs from "fs";
import path from "path";

const SITE_URL = "https://duely.in";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/faq`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/articles`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/tools`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
  ];

  // Landing pages
  const landingPages = ["/for-freelancers", "/for-agencies", "/for-consultants"];
  for (const page of landingPages) {
    routes.push({
      url: `${SITE_URL}${page}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    });
  }

  // Comparison pages
  const comparisonPages = ["/vs/freshbooks", "/vs/honeybook", "/vs/bonsai", "/vs/quickbooks"];
  for (const page of comparisonPages) {
    routes.push({
      url: `${SITE_URL}${page}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }

  // Tool pages
  const toolsDir = path.join(process.cwd(), "app", "tools");
  if (fs.existsSync(toolsDir)) {
    const toolFolders = fs.readdirSync(toolsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
      
    for (const tool of toolFolders) {
      routes.push({
        url: `${SITE_URL}/tools/${tool}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.8,
      });
    }
  }

  // Article pages
  const articlesDir = path.join(process.cwd(), "public", "articles");
  if (fs.existsSync(articlesDir)) {
    const articles = fs.readdirSync(articlesDir).filter((f) => f.endsWith(".md"));
    for (const article of articles) {
      const slug = article.replace(".md", "");
      routes.push({
        url: `${SITE_URL}/articles/${slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  // SEO Programmatic pages
  const seoModules = [
    { prefix: "alternatives/duely-vs-", keys: Object.keys(require("@/lib/seo-data").competitors) },
    { prefix: "for/", keys: Object.keys(require("@/lib/seo-data").industries) },
    { prefix: "integrations/", keys: Object.keys(require("@/lib/seo-data").integrations) },
    { prefix: "location/", keys: Object.keys(require("@/lib/seo-data").locations) },
    { prefix: "use-case/", keys: Object.keys(require("@/lib/seo-data").useCases) },
  ];

  for (const module of seoModules) {
    for (const key of module.keys) {
      routes.push({
        url: `${SITE_URL}/${module.prefix}${key}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.8,
      });
    }
  }

  return routes;
}
