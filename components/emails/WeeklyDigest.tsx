import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
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
  overdueCount: number;
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
}

export const WeeklyDigestEmail = ({
  dateRange,
  totalOutstanding,
  totalOverdue,
  overdueCount,
  overdueInvoices,
  promisesThisWeek,
  paymentsReceived
}: WeeklyDigestEmailProps) => {
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

          {/* Metrics Row */}
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
                <Text style={metricLabel}>Overdue Invoices</Text>
                <Text style={metricValue}>{overdueCount}</Text>
              </Column>
            </Row>
          </Section>

          {/* Overdue Invoices */}
          {overdueInvoices.length > 0 && (
            <Section style={section}>
              <Heading style={sectionTitle}>Overdue Invoices</Heading>
              <table style={table}>
                <thead>
                  <tr>
                    <th style={th}>Client</th>
                    <th style={th}>Amount</th>
                    <th style={th}>Days Overdue</th>
                    <th style={th}>Last Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {overdueInvoices.map((inv, idx) => (
                    <tr key={idx} style={tr}>
                      <td style={td}>{inv.clientName}</td>
                      <td style={td}>{inv.amount}</td>
                      <td style={{ ...td, color: '#e53e3e', fontWeight: 'bold' }}>{inv.daysOverdue} days</td>
                      <td style={td}>{inv.lastContact || 'None'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          {/* Promises this Week */}
          {promisesThisWeek.length > 0 && (
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
          {paymentsReceived.length > 0 && (
            <Section style={section}>
              <Heading style={sectionTitle}>Payments Received This Week</Heading>
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
                      <td style={{ ...td, color: '#38a169', fontWeight: 'bold' }}>{pay.amount}</td>
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
              View Dashboard
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

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  borderRadius: "8px",
  maxWidth: "600px",
};

const header = {
  paddingBottom: "20px",
  borderBottom: "1px solid #e2e8f0",
  marginBottom: "30px",
};

const logoText = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#1a202c",
  margin: "0 0 10px 0",
};

const heading = {
  fontSize: "24px",
  lineHeight: "1.3",
  fontWeight: "700",
  color: "#1a202c",
  margin: "0 0 5px 0",
};

const dateText = {
  fontSize: "14px",
  color: "#718096",
  margin: "0",
};

const metricsSection = {
  marginBottom: "30px",
};

const metricCard = {
  padding: "15px",
  backgroundColor: "#f7fafc",
  borderRadius: "6px",
  marginRight: "10px",
  textAlign: "center" as const,
};

const metricLabel = {
  fontSize: "12px",
  textTransform: "uppercase" as const,
  color: "#718096",
  letterSpacing: "0.5px",
  margin: "0 0 5px 0",
};

const metricValue = {
  fontSize: "20px",
  fontWeight: "bold",
  color: "#2d3748",
  margin: "0",
};

const metricValueOverdue = {
  fontSize: "20px",
  fontWeight: "bold",
  color: "#e53e3e",
  margin: "0",
};

const section = {
  marginBottom: "30px",
};

const sectionTitle = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#2d3748",
  margin: "0 0 15px 0",
};

const table = {
  width: "100%",
  borderCollapse: "collapse" as const,
};

const th = {
  textAlign: "left" as const,
  padding: "10px",
  borderBottom: "2px solid #e2e8f0",
  color: "#4a5568",
  fontSize: "12px",
  textTransform: "uppercase" as const,
};

const tr = {
  borderBottom: "1px solid #e2e8f0",
};

const td = {
  padding: "12px 10px",
  color: "#2d3748",
  fontSize: "14px",
};

const ctaSection = {
  textAlign: "center" as const,
  marginTop: "40px",
  marginBottom: "40px",
};

const button = {
  backgroundColor: "#1a202c",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
  fontWeight: "600",
};

const hr = {
  borderColor: "#e2e8f0",
  margin: "20px 0",
};

const footerText = {
  color: "#a0aec0",
  fontSize: "12px",
  textAlign: "center" as const,
};
