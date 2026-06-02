import { Section } from "@react-email/components";

import { EmailCard } from "@/emails/components/EmailCard";
import { EmailLayout } from "@/emails/components/EmailLayout";
import {
  EmailHeading,
  EmailMutedText,
  EmailText,
} from "@/emails/components/Typography";
import {
  formatCurrency,
  type PaymentLeakResults,
} from "@/lib/payment-leak-calculator/calculations";

export type PaymentLeakReportEmailProps = {
  appUrl: string;
  name: string;
  results: PaymentLeakResults;
};

export function PaymentLeakReportEmail({
  appUrl,
  name,
  results,
}: PaymentLeakReportEmailProps) {
  return (
    <EmailLayout
      appUrl={appUrl}
      eyebrow="Collections report"
      preview={`Your Duely payment leak report is ready`}
    >
      <EmailCard>
        <EmailHeading>Your collections report is ready</EmailHeading>
        <EmailText>
          Hi {name}, your personalized Agency Payment Leak Calculator report is
          attached.
        </EmailText>

        <Section style={summaryGrid}>
          <EmailText>
            Cash tied up: <strong>{formatCurrency(results.cashTiedUp)}</strong>
          </EmailText>
          <EmailText>
            Annual impact: <strong>{formatCurrency(results.annualImpact)}</strong>
          </EmailText>
          <EmailText>
            Risk score: <strong>{results.riskScore}/100</strong>
          </EmailText>
        </Section>

        <EmailMutedText>
          Duely tracks payment promises, follow-ups, and reminders automatically
          so nothing slips through the cracks.
        </EmailMutedText>
      </EmailCard>
    </EmailLayout>
  );
}

const summaryGrid = {
  margin: "20px 0",
};
