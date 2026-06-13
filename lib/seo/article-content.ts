export type FaqItem = {
  question: string;
  answer: string;
};

export function extractQuickAnswer(content: string): string | null {
  const match = content.match(
    /^## Quick Answer\s*\n+([\s\S]*?)(?=\n## |\n---|\n*$)/m,
  );
  if (!match) return null;
  return match[1].trim().replace(/\n+/g, " ");
}

export function extractFaqItems(content: string): FaqItem[] {
  const faqSection = content.match(/^## FAQ\s*\n+([\s\S]*?)$/m);
  if (!faqSection) return [];

  const items: FaqItem[] = [];
  const blocks = faqSection[1].split(/^### /m).slice(1);

  for (const block of blocks) {
    const newlineIndex = block.indexOf("\n");
    if (newlineIndex === -1) continue;

    const question = block.slice(0, newlineIndex).trim();
    const answer = block
      .slice(newlineIndex + 1)
      .trim()
      .split(/\n## /)[0]
      .trim()
      .replace(/\n+/g, " ");

    if (question && answer) {
      items.push({ question, answer });
    }
  }

  return items;
}

export function splitArticleContent(content: string): {
  quickAnswer: string | null;
  body: string;
} {
  const quickAnswer = extractQuickAnswer(content);
  const body = content.replace(
    /^## Quick Answer\s*\n+[\s\S]*?(?=\n## |\n---|\n*$)/m,
    "",
  );
  return { quickAnswer, body: body.trim() };
}
