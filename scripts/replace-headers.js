/* eslint-disable */
const fs = require('fs');
const path = require('path');

const pages = [
  'app/about/page.tsx',
  'app/tools/page.tsx',
  'app/faq/page.tsx',
  'app/privacy/page.tsx',
  'app/terms/page.tsx',
  'app/feedback/page.tsx',
  'app/not-found.tsx',
  'app/learn/[slug]/page.tsx'
];

for (const p of pages) {
  const filePath = path.join(__dirname, p);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf8');

  // Replace header
  content = content.replace(/<header[\s\S]*?<\/header>/, '<SiteHeader />');
  
  // Replace footer
  content = content.replace(/<footer[\s\S]*?<\/footer>/, '<SiteFooter />');

  // Add imports if missing
  if (!content.includes('SiteHeader')) {
    // Find where to insert
    const importMatch = content.match(/import .*?;?\n/g);
    if (importMatch) {
      const lastImport = importMatch[importMatch.length - 1];
      content = content.replace(lastImport, lastImport + `import { SiteHeader } from "@/components/site/site-header";\nimport { SiteFooter } from "@/components/site/site-footer";\n`);
    } else {
      content = `import { SiteHeader } from "@/components/site/site-header";\nimport { SiteFooter } from "@/components/site/site-footer";\n` + content;
    }
  }

  // Remove the old Button/Image/Link/Container if they become unused, but simpler to just let ESLint fix it or leave it
  // Wait, `Container` is used by the main content, so keep it.
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated ' + p);
}
