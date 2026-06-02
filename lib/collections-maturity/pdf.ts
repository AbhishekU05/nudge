import "server-only";

import type { MaturityResults } from "@/lib/collections-maturity/calculations";

type PdfParams = {
  email: string;
  name: string;
  results: MaturityResults;
};

export function buildMaturityReportPdf(params: PdfParams) {
  const lines = [
    "Duely Collections Maturity Report",
    "",
    `Prepared for: ${params.name}`,
    `Email: ${params.email}`,
    `Generated: ${new Date().toISOString()}`,
    "",
    "Overall Score",
    `${params.results.overallScore}/100 - ${params.results.level}`,
    params.results.levelDescription,
    "",
    "Category Scores",
    ...params.results.categories.map(
      (c) => `${c.label}: ${c.percentage}% (${c.score}/${c.maxScore})`,
    ),
    "",
    `Weakest Area: ${params.results.weakest.label} (${params.results.weakest.percentage}%)`,
    `Strongest Area: ${params.results.strongest.label} (${params.results.strongest.percentage}%)`,
    "",
    "Personalized Recommendations",
    ...params.results.recommendations.map((r) => `- ${r}`),
    "",
    "30-Day Improvement Roadmap",
    "Week 1: Audit current collections process",
    "Week 2: Address weakest category",
    "Week 3: Implement standardized workflows",
    "Week 4: Review performance and identify bottlenecks",
    "",
    "Duely tracks payment promises, follow-ups, and reminders automatically.",
    "Start your free trial at https://duely.in/signup",
  ];

  return createSimplePdf(lines);
}

function createSimplePdf(lines: string[]) {
  const escapedLines = lines.map(escapePdfText);
  const content = [
    "BT",
    "/F1 18 Tf",
    "72 760 Td",
    "(Collections Maturity Assessment) Tj",
    "/F1 10 Tf",
    "0 -26 Td",
    ...escapedLines.flatMap((line) => [`(${line}) Tj`, "0 -15 Td"]),
    "ET",
  ].join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(content, "utf8")} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${offset.toString().padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
}

function escapePdfText(value: string) {
  return value.replace(/[\\()]/g, (character) => `\\${character}`);
}
