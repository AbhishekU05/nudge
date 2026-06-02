import { Section } from "@react-email/components";

import { EmailCard } from "@/emails/components/EmailCard";
import { EmailLayout } from "@/emails/components/EmailLayout";
import {
  EmailHeading,
  EmailMutedText,
  EmailText,
} from "@/emails/components/Typography";
import type { MaturityResults } from "@/lib/collections-maturity/calculations";

export type CollectionsMaturityReportEmailProps = {
  appUrl: string;
  name: string;
  results: MaturityResults;
};

export function CollectionsMaturityReportEmail({
  appUrl,
  name,
  results,
}: CollectionsMaturityReportEmailProps) {
  return (
    <EmailLayout
      appUrl={appUrl}
      eyebrow="Maturity assessment"
      preview={`Your Duely collections maturity report is ready`}
    >
      <EmailCard>
        <EmailHeading>Your maturity report is ready</EmailHeading>
        <EmailText>
          Hi {name}, your personalized Collections Maturity Assessment report is
          attached.
        </EmailText>

        <Section style={summaryGrid}>
          <EmailText>
            Overall score: <strong>{results.overallScore}/100</strong>
          </EmailText>
          <EmailText>
            Maturity level: <strong>{results.level}</strong>
          </EmailText>
          <EmailText>
            Weakest area: <strong>{results.weakest.label}</strong>
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
