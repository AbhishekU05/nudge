export type PaymentLeakInputs = {
  activeClients: number;
  averageInvoiceValue: number;
  latePaymentPercentage: number;
  paymentDelayDays: number;
  monthlyOperatingExpenses?: number | null;
};

export type RiskLevel = "Low" | "Medium" | "High";

export type PaymentLeakResults = {
  annualImpact: number;
  cashTiedUp: number;
  clientConcentrationScore: number;
  delayDaysScore: number;
  latePaymentScore: number;
  operatingExpenseCoverage: number | null;
  recommendations: string[];
  riskLevel: RiskLevel;
  riskScore: number;
};

export const BENCHMARKS = {
  healthyAgency: 28,
  averageAgency: 54,
  highRiskAgency: 82,
} as const;

export function calculatePaymentLeak(
  inputs: PaymentLeakInputs,
): PaymentLeakResults {
  const activeClients = clamp(inputs.activeClients, 1, 200);
  const averageInvoiceValue = Math.max(0, inputs.averageInvoiceValue);
  const latePaymentPercentage = clamp(inputs.latePaymentPercentage, 0, 100);
  const paymentDelayDays = clamp(inputs.paymentDelayDays, 0, 180);

  const cashTiedUp =
    activeClients *
    averageInvoiceValue *
    (latePaymentPercentage / 100) *
    (paymentDelayDays / 30);

  const annualImpact = cashTiedUp * 12;
  const latePaymentScore = (latePaymentPercentage / 100) * 50;
  const delayDaysScore = (Math.min(paymentDelayDays, 60) / 60) * 30;
  const clientConcentrationScore =
    activeClients >= 20 ? 0 : ((20 - activeClients) / 19) * 20;
  const riskScore = Math.round(
    clamp(latePaymentScore + delayDaysScore + clientConcentrationScore, 0, 100),
  );
  const riskLevel = getRiskLevel(riskScore);
  const monthlyOperatingExpenses =
    inputs.monthlyOperatingExpenses && inputs.monthlyOperatingExpenses > 0
      ? inputs.monthlyOperatingExpenses
      : null;

  return {
    annualImpact,
    cashTiedUp,
    clientConcentrationScore,
    delayDaysScore,
    latePaymentScore,
    operatingExpenseCoverage: monthlyOperatingExpenses
      ? cashTiedUp / monthlyOperatingExpenses
      : null,
    recommendations: getRecommendations(riskLevel),
    riskLevel,
    riskScore,
  };
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

function getRiskLevel(score: number): RiskLevel {
  if (score >= 70) {
    return "High";
  }

  if (score >= 40) {
    return "Medium";
  }

  return "Low";
}

function getRecommendations(riskLevel: RiskLevel) {
  if (riskLevel === "High") {
    return [
      "Automate collections workflows",
      "Monitor commitments",
      "Escalate reminders",
    ];
  }

  if (riskLevel === "Medium") {
    return ["Improve follow-up consistency", "Track payment promises"];
  }

  return ["Continue monitoring", "Standard reminders"];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
