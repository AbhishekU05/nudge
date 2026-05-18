const fs = require('fs');
const path = require('path');

const articlesDir = path.join(__dirname, 'public', 'articles');
const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.md'));

for (const file of files) {
  const filePath = path.join(articlesDir, file);
  const content = fs.readFileSync(filePath, 'utf8');

  if (!content.startsWith('---')) {
    // Try to extract title from first line or filename
    let title = '';
    const firstLineMatch = content.match(/^#\s+(.+)$/m);
    if (firstLineMatch) {
      title = firstLineMatch[1].trim();
    } else {
      title = file.replace('.md', '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }

    const frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
description: "A comprehensive guide on ${title.toLowerCase()}"
audience: "Freelancers, Consultants, and Agencies"
---

`;
    // Remove the original # Title if we found one so it doesn't duplicate? 
    // Usually it's fine, but let's keep it simple and just prepend.
    let newContent = content;
    if (firstLineMatch && content.indexOf(firstLineMatch[0]) < 50) {
      newContent = content.replace(firstLineMatch[0], '').trimStart();
    }

    fs.writeFileSync(filePath, frontmatter + newContent);
    console.log(`Added frontmatter to ${file}`);
  }
}
