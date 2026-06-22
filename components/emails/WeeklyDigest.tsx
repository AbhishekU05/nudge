import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Column,
  Row,
  Button
} from "@react-email/components";
import * as React from "react";

interface WeeklyDigestEmailProps {
  dateRange: string;
  totalOutstanding: string;
  totalOverdue: string;
  totalCollected: string;
  revenueThisMonth: string;
  revenueLastMonth: string;
  averageDaysToPayment: number;
  overdueCount: number;
  agingBuckets: {
    "1-30": number;
    "31-60": number;
    "61-90": number;
    "90+": number;
  };
  upcomingInvoices: {
    clientName: string;
    amount: string;
    dueInDays: number;
  }[];
  overdueInvoices: {
    clientName: string;
    amount: string;
    daysOverdue: number;
    lastContact?: string;
  }[];
  promisesThisWeek: {
    clientName: string;
    amount: string;
    dueDate: string;
  }[];
  paymentsReceived: {
    clientName: string;
    amount: string;
    date: string;
  }[];
  actionItems: string[];
}

export const WeeklyDigestEmail = ({
  dateRange,
  totalOutstanding,
  totalOverdue,
  totalCollected,
  revenueThisMonth,
  revenueLastMonth,
  averageDaysToPayment,
  overdueCount,
  agingBuckets,
  upcomingInvoices,
  overdueInvoices,
  promisesThisWeek,
  paymentsReceived,
  actionItems
}: WeeklyDigestEmailProps) => {
  const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  const totalAging = Object.values(agingBuckets).reduce((a, b) => a + b, 0) || 1; // prevent div by zero

  return (
    <Html>
      <Head />
      <Preview>Your weekly collections snapshot - Duely</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logoText}>Duely</Text>
            <Heading style={heading}>Your weekly collections snapshot</Heading>
            <Text style={dateText}>{dateRange}</Text>
          </Section>

          {/* Action Items */}
          {actionItems && actionItems.length > 0 && (
            <Section style={actionItemsSection}>
              <Heading style={sectionTitle}>Action Items</Heading>
              <ul style={actionList}>
                {actionItems.map((item, idx) => (
                  <li key={idx} style={actionListItem}>• {item}</li>
                ))}
              </ul>
            </Section>
          )}

          {/* Metrics Row 1 */}
          <Section style={metricsSection}>
            <Row>
              <Column style={metricCard}>
                <Text style={metricLabel}>Total Outstanding</Text>
                <Text style={metricValue}>{totalOutstanding}</Text>
              </Column>
              <Column style={metricCard}>
                <Text style={metricLabel}>Total Overdue</Text>
                <Text style={metricValueOverdue}>{totalOverdue}</Text>
              </Column>
              <Column style={metricCard}>
                <Text style={metricLabel}>Total Collected</Text>
                <Text style={metricValue}>{totalCollected}</Text>
              </Column>
            </Row>
          </Section>

          {/* Metrics Row 2 */}
          <Section style={metricsSection}>
            <Row>
              <Column style={metricCard}>
                <Text style={metricLabel}>Avg. Days to Payment</Text>
                <Text style={metricValue}>{averageDaysToPayment}</Text>
              </Column>
              <Column style={metricCard}>
                <Text style={metricLabel}>Revenue (This Month)</Text>
                <Text style={metricValue}>{revenueThisMonth}</Text>
              </Column>
              <Column style={metricCard}>
                <Text style={metricLabel}>Revenue (Last Month)</Text>
                <Text style={metricValue}>{revenueLastMonth}</Text>
              </Column>
            </Row>
          </Section>

          {/* Aging Analytics (Horizontal Bar) */}
          <Section style={section}>
            <Heading style={sectionTitle}>Aging Overview</Heading>
            <div style={agingContainer}>
              {Object.entries(agingBuckets).map(([label, value], i) => {
                const percent = Math.max(2, (value / totalAging) * 100);
                const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];
                return (
                  <div key={label} style={{ marginBottom: '10px' }}>
                    <Text style={agingLabel}>{label} Days: {formatter.format(value)}</Text>
                    <div style={{ width: '100%', backgroundColor: '#27272a', borderRadius: '4px', height: '8px' }}>
                      <div style={{ width: `${percent}%`, backgroundColor: colors[i], borderRadius: '4px', height: '8px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* Upcoming Invoices */}
          {upcomingInvoices && upcomingInvoices.length > 0 && (
            <Section style={section}>
              <Heading style={sectionTitle}>Upcoming in 14 Days</Heading>
              <table style={table}>
                <thead>
                  <tr>
                    <th style={th}>Client</th>
                    <th style={th}>Amount</th>
                    <th style={th}>Due In</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingInvoices.map((inv, idx) => (
                    <tr key={idx} style={tr}>
                      <td style={td}>{inv.clientName}</td>
                      <td style={td}>{inv.amount}</td>
                      <td style={{ ...td, color: '#3b82f6' }}>{inv.dueInDays} days</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          {/* Overdue Invoices */}
          {overdueInvoices && overdueInvoices.length > 0 && (
            <Section style={section}>
              <Heading style={sectionTitle}>Overdue Invoices</Heading>
              <table style={table}>
                <thead>
                  <tr>
                    <th style={th}>Client</th>
                    <th style={th}>Amount</th>
                    <th style={th}>Days Overdue</th>
                  </tr>
                </thead>
                <tbody>
                  {overdueInvoices.slice(0, 10).map((inv, idx) => ( // show top 10
                    <tr key={idx} style={tr}>
                      <td style={td}>{inv.clientName}</td>
                      <td style={td}>{inv.amount}</td>
                      <td style={{ ...td, color: '#ef4444' }}>{inv.daysOverdue} days</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          {/* Promises this Week */}
          {promisesThisWeek && promisesThisWeek.length > 0 && (
            <Section style={section}>
              <Heading style={sectionTitle}>Promises Due This Week (Unpaid)</Heading>
              <table style={table}>
                <thead>
                  <tr>
                    <th style={th}>Client</th>
                    <th style={th}>Amount</th>
                    <th style={th}>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {promisesThisWeek.map((prom, idx) => (
                    <tr key={idx} style={tr}>
                      <td style={td}>{prom.clientName}</td>
                      <td style={td}>{prom.amount}</td>
                      <td style={td}>{prom.dueDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          {/* Payments Received */}
          {paymentsReceived && paymentsReceived.length > 0 && (
            <Section style={section}>
              <Heading style={sectionTitle}>Payments Received</Heading>
              <table style={table}>
                <thead>
                  <tr>
                    <th style={th}>Client</th>
                    <th style={th}>Amount</th>
                    <th style={th}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentsReceived.map((pay, idx) => (
                    <tr key={idx} style={tr}>
                      <td style={td}>{pay.clientName}</td>
                      <td style={{ ...td, color: '#10b981' }}>{pay.amount}</td>
                      <td style={td}>{pay.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          {/* CTA */}
          <Section style={ctaSection}>
            <Button href="https://duely.in/dashboard" style={button}>
              View Full Dashboard
            </Button>
          </Section>

          <Hr style={hr} />
          <Section>
            <Text style={footerText}>
              You are receiving this because you have the Weekly Digest enabled in your Duely settings.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default WeeklyDigestEmail;

/* 
  DARK THEME STYLES 
  Mimicking Duely's zinc-950 / zinc-900 / blue-600 palette 
*/

const main = {
  backgroundColor: "#09090b", // zinc-950
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  color: "#fafafa",
};

const container = {
  backgroundColor: "#18181b", // zinc-900
  margin: "0 auto",
  padding: "40px 20px",
  borderRadius: "12px",
  maxWidth: "600px",
  border: "1px solid #27272a", // zinc-800
};

const header = {
  paddingBottom: "20px",
  borderBottom: "1px solid #27272a",
  marginBottom: "30px",
};

const logoText = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#fafafa",
  margin: "0 0 10px 0",
};

const heading = {
  fontSize: "22px",
  lineHeight: "1.3",
  fontWeight: "600",
  color: "#fafafa",
  margin: "0 0 5px 0",
};

const dateText = {
  fontSize: "14px",
  color: "#a1a1aa", // zinc-400
  margin: "0",
};

const actionItemsSection = {
  backgroundColor: "rgba(59, 130, 246, 0.1)", // faint blue
  borderLeft: "4px solid #3b82f6", // blue-500
  padding: "15px",
  marginBottom: "30px",
  borderRadius: "0 8px 8px 0",
};

const actionList = {
  margin: 0,
  padding: 0,
  listStyle: "none",
};

const actionListItem = {
  color: "#bfdbfe", // blue-200
  fontSize: "14px",
  marginBottom: "6px",
};

const metricsSection = {
  marginBottom: "30px",
};

const metricCard = {
  padding: "15px",
  backgroundColor: "#27272a", // zinc-800
  borderRadius: "8px",
  marginRight: "10px",
  textAlign: "center" as const,
};

const metricLabel = {
  fontSize: "12px",
  textTransform: "uppercase" as const,
  color: "#a1a1aa", // zinc-400
  letterSpacing: "0.5px",
  margin: "0 0 5px 0",
};

const metricValue = {
  fontSize: "20px",
  fontWeight: "bold",
  color: "#fafafa", // zinc-50
  margin: "0",
};

const metricValueOverdue = {
  fontSize: "20px",
  fontWeight: "bold",
  color: "#ef4444", // red-500
  margin: "0",
};

const section = {
  marginBottom: "30px",
};

const sectionTitle = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#fafafa",
  margin: "0 0 15px 0",
};

const agingContainer = {
  padding: "15px",
  backgroundColor: "#1f1f22", // dark gray
  borderRadius: "8px",
};

const agingLabel = {
  fontSize: "13px",
  color: "#d4d4d8", // zinc-300
  marginBottom: "4px",
};

const table = {
  width: "100%",
  borderCollapse: "collapse" as const,
};

const th = {
  textAlign: "left" as const,
  padding: "10px",
  borderBottom: "1px solid #3f3f46", // zinc-700
  color: "#a1a1aa", // zinc-400
  fontSize: "12px",
  textTransform: "uppercase" as const,
};

const tr = {
  borderBottom: "1px solid #27272a", // zinc-800
};

const td = {
  padding: "12px 10px",
  color: "#e4e4e7", // zinc-200
  fontSize: "14px",
};

const ctaSection = {
  textAlign: "center" as const,
  marginTop: "40px",
  marginBottom: "30px",
};

const button = {
  backgroundColor: "#2563eb", // blue-600
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "14px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
  fontWeight: "600",
};

const hr = {
  borderColor: "#27272a", // zinc-800
  margin: "20px 0",
};

const footerText = {
  color: "#71717a", // zinc-500
  fontSize: "12px",
  textAlign: "center" as const,
};
