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
      <Head>
        <style>
          {`
            @media (prefers-color-scheme: dark) {
              .main { background-color: #09090b !important; color: #fafafa !important; }
              .container { background-color: #18181b !important; border-color: #27272a !important; }
              .header { border-color: #27272a !important; }
              .text-primary { color: #fafafa !important; }
              .text-secondary { color: #a1a1aa !important; }
              .action-item { color: #bfdbfe !important; }
              .card { background-color: #27272a !important; }
              .aging-container { background-color: #1f1f22 !important; }
              .aging-track { background-color: #27272a !important; }
              .table-th { border-color: #3f3f46 !important; color: #a1a1aa !important; }
              .table-tr { border-color: #27272a !important; }
              .table-td { color: #e4e4e7 !important; }
              .hr { border-color: #27272a !important; }
            }
          `}
        </style>
      </Head>
      <Preview>Your weekly collections snapshot - Duely</Preview>
      <Body style={main} className="main">
        <Container style={container} className="container">
          <Section style={header} className="header">
            <Text style={logoText} className="text-primary">Duely</Text>
            <Heading style={heading} className="text-primary">Your weekly collections snapshot</Heading>
            <Text style={dateText} className="text-secondary">{dateRange}</Text>
          </Section>

          {/* Action Items */}
          {actionItems && actionItems.length > 0 && (
            <Section style={actionItemsSection}>
              <Heading style={sectionTitle} className="text-primary">Action Items</Heading>
              <ul style={actionList}>
                {actionItems.map((item, idx) => (
                  <li key={idx} style={actionListItem} className="action-item">• {item}</li>
                ))}
              </ul>
            </Section>
          )}

          {/* Metrics Row 1 */}
          <Section style={metricsSection}>
            <Row>
              <Column style={metricCard} className="card">
                <Text style={metricLabel} className="text-secondary">Total Outstanding</Text>
                <Text style={metricValue} className="text-primary">{totalOutstanding}</Text>
              </Column>
              <Column style={metricCard} className="card">
                <Text style={metricLabel} className="text-secondary">Total Overdue</Text>
                <Text style={metricValueOverdue}>{totalOverdue}</Text>
              </Column>
              <Column style={metricCard} className="card">
                <Text style={metricLabel} className="text-secondary">Total Collected</Text>
                <Text style={metricValue} className="text-primary">{totalCollected}</Text>
              </Column>
            </Row>
          </Section>

          {/* Metrics Row 2 */}
          <Section style={metricsSection}>
            <Row>
              <Column style={metricCard} className="card">
                <Text style={metricLabel} className="text-secondary">Avg. Days to Payment</Text>
                <Text style={metricValue} className="text-primary">{averageDaysToPayment}</Text>
              </Column>
              <Column style={metricCard} className="card">
                <Text style={metricLabel} className="text-secondary">Revenue (This Month)</Text>
                <Text style={metricValue} className="text-primary">{revenueThisMonth}</Text>
              </Column>
              <Column style={metricCard} className="card">
                <Text style={metricLabel} className="text-secondary">Revenue (Last Month)</Text>
                <Text style={metricValue} className="text-primary">{revenueLastMonth}</Text>
              </Column>
            </Row>
          </Section>

          {/* Aging Analytics (Horizontal Bar) */}
          <Section style={section}>
            <Heading style={sectionTitle} className="text-primary">Aging Overview</Heading>
            <div style={agingContainer} className="aging-container">
              {Object.entries(agingBuckets).map(([label, value], i) => {
                const percent = Math.max(2, (value / totalAging) * 100);
                const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];
                return (
                  <div key={label} style={{ marginBottom: '10px' }}>
                    <Text style={agingLabel} className="text-secondary">{label} Days: {formatter.format(value)}</Text>
                    <div style={{ width: '100%', backgroundColor: '#e4e4e7', borderRadius: '4px', height: '8px' }} className="aging-track">
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
              <Heading style={sectionTitle} className="text-primary">Upcoming in 14 Days</Heading>
              <table style={table}>
                <thead>
                  <tr>
                    <th style={th} className="table-th">Client</th>
                    <th style={th} className="table-th">Amount</th>
                    <th style={th} className="table-th">Due In</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingInvoices.map((inv, idx) => (
                    <tr key={idx} style={tr} className="table-tr">
                      <td style={td} className="table-td">{inv.clientName}</td>
                      <td style={td} className="table-td">{inv.amount}</td>
                      <td style={{ ...td, color: '#3b82f6' }} className="table-td">{inv.dueInDays} days</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          {/* Overdue Invoices */}
          {overdueInvoices && overdueInvoices.length > 0 && (
            <Section style={section}>
              <Heading style={sectionTitle} className="text-primary">Overdue Invoices</Heading>
              <table style={table}>
                <thead>
                  <tr>
                    <th style={th} className="table-th">Client</th>
                    <th style={th} className="table-th">Amount</th>
                    <th style={th} className="table-th">Days Overdue</th>
                  </tr>
                </thead>
                <tbody>
                  {overdueInvoices.slice(0, 10).map((inv, idx) => ( // show top 10
                    <tr key={idx} style={tr} className="table-tr">
                      <td style={td} className="table-td">{inv.clientName}</td>
                      <td style={td} className="table-td">{inv.amount}</td>
                      <td style={{ ...td, color: '#ef4444' }} className="table-td">{inv.daysOverdue} days</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          {/* Promises this Week */}
          {promisesThisWeek && promisesThisWeek.length > 0 && (
            <Section style={section}>
              <Heading style={sectionTitle} className="text-primary">Promises Due This Week (Unpaid)</Heading>
              <table style={table}>
                <thead>
                  <tr>
                    <th style={th} className="table-th">Client</th>
                    <th style={th} className="table-th">Amount</th>
                    <th style={th} className="table-th">Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {promisesThisWeek.map((prom, idx) => (
                    <tr key={idx} style={tr} className="table-tr">
                      <td style={td} className="table-td">{prom.clientName}</td>
                      <td style={td} className="table-td">{prom.amount}</td>
                      <td style={td} className="table-td">{prom.dueDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          {/* Payments Received */}
          {paymentsReceived && paymentsReceived.length > 0 && (
            <Section style={section}>
              <Heading style={sectionTitle} className="text-primary">Payments Received</Heading>
              <table style={table}>
                <thead>
                  <tr>
                    <th style={th} className="table-th">Client</th>
                    <th style={th} className="table-th">Amount</th>
                    <th style={th} className="table-th">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentsReceived.map((pay, idx) => (
                    <tr key={idx} style={tr} className="table-tr">
                      <td style={td} className="table-td">{pay.clientName}</td>
                      <td style={{ ...td, color: '#10b981' }} className="table-td">{pay.amount}</td>
                      <td style={td} className="table-td">{pay.date}</td>
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

          <Hr style={hr} className="hr" />
          <Section>
            <Text style={footerText} className="text-secondary">
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
  LIGHT/DARK THEME STYLES 
  Defaults to Light, overridden by CSS classes for Dark.
*/

const main = {
  backgroundColor: "#f4f4f5", // zinc-100
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  color: "#18181b",
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  borderRadius: "12px",
  maxWidth: "600px",
  border: "1px solid #e4e4e7", // zinc-200
};

const header = {
  paddingBottom: "20px",
  borderBottom: "1px solid #e4e4e7",
  marginBottom: "30px",
};

const logoText = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#18181b",
  margin: "0 0 10px 0",
};

const heading = {
  fontSize: "22px",
  lineHeight: "1.3",
  fontWeight: "600",
  color: "#18181b",
  margin: "0 0 5px 0",
};

const dateText = {
  fontSize: "14px",
  color: "#71717a", // zinc-500
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
  color: "#1d4ed8", // blue-700
  fontSize: "14px",
  marginBottom: "6px",
};

const metricsSection = {
  marginBottom: "30px",
};

const metricCard = {
  padding: "15px",
  backgroundColor: "#f4f4f5", // zinc-100
  borderRadius: "8px",
  marginRight: "10px",
  textAlign: "center" as const,
};

const metricLabel = {
  fontSize: "12px",
  textTransform: "uppercase" as const,
  color: "#71717a", // zinc-500
  letterSpacing: "0.5px",
  margin: "0 0 5px 0",
};

const metricValue = {
  fontSize: "20px",
  fontWeight: "bold",
  color: "#18181b", // zinc-900
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
  color: "#18181b",
  margin: "0 0 15px 0",
};

const agingContainer = {
  padding: "15px",
  backgroundColor: "#f4f4f5", // zinc-100
  borderRadius: "8px",
};

const agingLabel = {
  fontSize: "13px",
  color: "#52525b", // zinc-600
  marginBottom: "4px",
};

const table = {
  width: "100%",
  borderCollapse: "collapse" as const,
};

const th = {
  textAlign: "left" as const,
  padding: "10px",
  borderBottom: "1px solid #e4e4e7", // zinc-200
  color: "#71717a", // zinc-500
  fontSize: "12px",
  textTransform: "uppercase" as const,
};

const tr = {
  borderBottom: "1px solid #f4f4f5", // zinc-100
};

const td = {
  padding: "12px 10px",
  color: "#3f3f46", // zinc-700
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
  borderColor: "#e4e4e7", // zinc-200
  margin: "20px 0",
};

const footerText = {
  color: "#a1a1aa", // zinc-400
  fontSize: "12px",
  textAlign: "center" as const,
};
