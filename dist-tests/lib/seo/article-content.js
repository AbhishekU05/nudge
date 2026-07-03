"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractQuickAnswer = extractQuickAnswer;
exports.extractFaqItems = extractFaqItems;
exports.splitArticleContent = splitArticleContent;
function extractQuickAnswer(content) {
    const match = content.match(/^## Quick Answer\s*\n+([\s\S]*?)(?=\n## |\n---|\n*$)/m);
    if (!match)
        return null;
    return match[1].trim().replace(/\n+/g, " ");
}
function extractFaqItems(content) {
    const faqSection = content.match(/(?:^|\n)## (?:FAQ|Frequently asked questions)\s*\n+([\s\S]*?)(?=\n## |\s*$)/i);
    if (!faqSection)
        return [];
    const items = [];
    const blocks = faqSection[1].split(/^### /m).slice(1);
    for (const block of blocks) {
        const newlineIndex = block.indexOf("\n");
        if (newlineIndex === -1)
            continue;
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
function splitArticleContent(content) {
    const quickAnswer = extractQuickAnswer(content);
    const body = content.replace(/^## Quick Answer\s*\n+[\s\S]*?(?=\n## |\n---|\n*$)/m, "");
    return { quickAnswer, body: body.trim() };
}
