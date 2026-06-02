import "server-only";

import {
  BENCHMARKS,
  formatCurrency,
  type PaymentLeakInputs,
  type PaymentLeakResults,
} from "@/lib/payment-leak-calculator/calculations";

type PdfParams = {
  email: string;
  inputs: PaymentLeakInputs;
  name: string;
  results: PaymentLeakResults;
};

export function buildPaymentLeakReportPdf(params: PdfParams) {
  const lines = [
    "Duely Collections Report",
    "",
    `Prepared for: ${params.name}`,
    `Email: ${params.email}`,
    `Generated: ${new Date().toISOString()}`,
    "",
    "Inputs",
    `Active clients: ${params.inputs.activeClients}`,
    `Average monthly invoice value: ${formatCurrency(params.inputs.averageInvoiceValue)}`,
    `Invoices paid late: ${params.inputs.latePaymentPercentage}%`,
    `Average payment delay: ${params.inputs.paymentDelayDays} days`,
    `Monthly operating expenses: ${
      params.inputs.monthlyOperatingExpenses
        ? formatCurrency(params.inputs.monthlyOperatingExpenses)
        : "Not provided"
    }`,
    "",
    "Calculations",
    `Cash currently tied up: ${formatCurrency(params.results.cashTiedUp)}`,
    `Estimated annual impact: ${formatCurrency(params.results.annualImpact)}`,
    `Collections risk score: ${params.results.riskScore}/100 (${params.results.riskLevel})`,
    params.results.operatingExpenseCoverage
      ? `Cash tied up equals ${(params.results.operatingExpenseCoverage * 100).toFixed(0)}% of monthly operating expenses`
      : "Operating expense coverage: Not calculated",
    "",
    "Risk Score Breakdown",
    `Late payment percentage contribution: ${params.results.latePaymentScore.toFixed(1)}/50`,
    `Delay days contribution: ${params.results.delayDaysScore.toFixed(1)}/30`,
    `Client concentration contribution: ${params.results.clientConcentrationScore.toFixed(1)}/20`,
    "",
    "Recommended Actions",
    ...params.results.recommendations.map((recommendation) => `- ${recommendation}`),
    "",
    "Benchmark Comparison",
    `Your agency: ${params.results.riskScore}/100`,
    `Healthy agency: ${BENCHMARKS.healthyAgency}/100`,
    `Average agency: ${BENCHMARKS.averageAgency}/100`,
    `High-risk agency: ${BENCHMARKS.highRiskAgency}/100`,
    "",
    "Duely tracks payment promises, follow-ups, and reminders automatically so nothing slips through the cracks.",
  ];

  return createSimplePdf(lines);
}

function createSimplePdf(lines: string[]) {
  const escapedLines = lines.map(escapePdfText);
  const content = [
    "BT",
    "/F1 18 Tf",
    "72 760 Td",
    "(Agency Payment Leak Calculator) Tj",
    "/F1 10 Tf",
    "0 -26 Td",
    ...escapedLines.flatMap((line) => [`(${line}) Tj`, "0 -15 Td"]),
    "ET",
  ].join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
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
