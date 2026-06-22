import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Row,
  Column,
  Img
} from "@react-email/components";
import * as React from "react";

export interface CurrencyDigest {
  currencyCode: string;
  totalOutstanding: string;
  totalOverdue: string;
  totalCollected: string;
  revenueThisMonth: string;
  revenueLastMonth: string;
  averageDaysToPayment: number;
  collectionRate: number;
  promiseKeptRate: number;
  avgFollowupsBeforePayment: string;
  overdueCount: number;
  
  collectionTrendsChartUrl: string;
  pipelineStatusChartUrl: string;
  topOffendersChartUrl: string;
  agingChartUrl: string;
  followupActivityChartUrl: string;

  upcomingInvoices: any[];
  overdueInvoices: any[];
  promisesThisWeek: any[];
  paymentsReceived: any[];
  actionItems: string[];
}

export interface WeeklyDigestEmailProps {
  dateRange: string;
  currencies: CurrencyDigest[];
}

export const WeeklyDigestEmail = ({
  dateRange,
  currencies
}: WeeklyDigestEmailProps) => {

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

          {(!currencies || currencies.length === 0) && (
            <Section style={section}>
              <Text style={metricValue} className="text-primary">All caught up!</Text>
              <Text style={metricLabel} className="text-secondary">No outstanding invoices or activities found.</Text>
            </Section>
          )}

          {currencies && currencies.map((curr, cIdx) => (
            <div key={cIdx} style={{ marginBottom: '40px' }}>
              <Heading style={currencyTitle} className="text-primary">{curr.currencyCode} Analytics</Heading>

              {/* Action Items */}
              {curr.actionItems && curr.actionItems.length > 0 && (
                <Section style={actionItemsSection}>
                  <Heading style={sectionTitle} className="text-primary">Action Items</Heading>
                  <ul style={actionList}>
                    {curr.actionItems.map((item, idx) => (
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
                    <Text style={metricValue} className="text-primary">{curr.totalOutstanding}</Text>
                  </Column>
                  <Column style={metricCard} className="card">
                    <Text style={metricLabel} className="text-secondary">Total Overdue</Text>
                    <Text style={metricValueOverdue}>{curr.totalOverdue}</Text>
                  </Column>
                  <Column style={metricCard} className="card">
                    <Text style={metricLabel} className="text-secondary">Total Collected</Text>
                    <Text style={metricValue} className="text-primary">{curr.totalCollected}</Text>
                  </Column>
                </Row>
              </Section>

              {/* Metrics Row 2 */}
              <Section style={metricsSection}>
                <Row>
                  <Column style={metricCard} className="card">
                    <Text style={metricLabel} className="text-secondary">Collection Rate</Text>
                    <Text style={metricValue} className="text-primary">{curr.collectionRate.toFixed(1)}%</Text>
                  </Column>
                  <Column style={metricCard} className="card">
                    <Text style={metricLabel} className="text-secondary">Avg Days to Pay</Text>
                    <Text style={metricValue} className="text-primary">{curr.averageDaysToPayment}</Text>
                  </Column>
                  <Column style={metricCard} className="card">
                    <Text style={metricLabel} className="text-secondary">Avg Follow-ups to Pay</Text>
                    <Text style={metricValue} className="text-primary">{curr.avgFollowupsBeforePayment}</Text>
                  </Column>
                </Row>
              </Section>

              {/* Charts */}
              <Section style={metricsSection}>
                <Row>
                  <Column style={chartContainer}>
                    <Text style={chartTitle} className="text-primary">Pipeline Status</Text>
                    <Img src={curr.pipelineStatusChartUrl} alt="Pipeline Status" width="100%" />
                  </Column>
                </Row>
              </Section>

              <Section style={metricsSection}>
                <Row>
                  <Column style={chartContainer}>
                    <Text style={chartTitle} className="text-primary">Collection Trends</Text>
                    <Img src={curr.collectionTrendsChartUrl} alt="Collection Trends" width="100%" />
                  </Column>
                </Row>
              </Section>

              <Section style={metricsSection}>
                <Row>
                  <Column style={chartContainer}>
                    <Text style={chartTitle} className="text-primary">A/R Aging</Text>
                    <Img src={curr.agingChartUrl} alt="Aging" width="100%" />
                  </Column>
                </Row>
              </Section>
              
              <Section style={metricsSection}>
                <Row>
                  <Column style={chartContainer}>
                    <Text style={chartTitle} className="text-primary">Follow-up Activity</Text>
                    <Img src={curr.followupActivityChartUrl} alt="Follow-up Activity" width="100%" />
                  </Column>
                </Row>
              </Section>

              {/* Top Offenders */}
              {curr.overdueInvoices && curr.overdueInvoices.length > 0 && (
                <Section style={section}>
                  <Heading style={sectionTitle} className="text-primary">Top Offenders</Heading>
                  <Img src={curr.topOffendersChartUrl} alt="Top Offenders" width="100%" style={{ marginBottom: '15px' }} />
                  
                  <table style={table}>
                    <thead>
                      <tr>
                        <th style={th} className="table-th">Client</th>
                        <th style={th} className="table-th">Amount</th>
                        <th style={th} className="table-th">Days Overdue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {curr.overdueInvoices.map((inv, idx) => ( 
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

              {/* Upcoming Invoices */}
              {curr.upcomingInvoices && curr.upcomingInvoices.length > 0 && (
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
                      {curr.upcomingInvoices.map((inv, idx) => (
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

              {/* Promises this Week */}
              {curr.promisesThisWeek && curr.promisesThisWeek.length > 0 && (
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
                      {curr.promisesThisWeek.map((prom, idx) => (
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
              {curr.paymentsReceived && curr.paymentsReceived.length > 0 && (
                <Section style={section}>
                  <Heading style={sectionTitle} className="text-primary">Payments Received (Last 7 Days)</Heading>
                  <table style={table}>
                    <thead>
                      <tr>
                        <th style={th} className="table-th">Client</th>
                        <th style={th} className="table-th">Amount</th>
                        <th style={th} className="table-th">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {curr.paymentsReceived.map((pay, idx) => (
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

              <Hr style={hr} className="hr" />
            </div>
          ))}

          {/* CTA */}
          <Section style={ctaSection}>
            <Button href="https://duely.in/dashboard" style={button}>
              View Full Dashboard
            </Button>
          </Section>

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

const currencyTitle = {
  fontSize: "20px",
  lineHeight: "1.3",
  fontWeight: "600",
  color: "#18181b",
  margin: "0 0 15px 0",
  paddingBottom: "10px",
  borderBottom: "2px solid #3b82f6",
  display: "inline-block",
};

const chartTitle = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#18181b",
  margin: "0 0 5px 0",
  textAlign: "center" as const,
};

const chartContainer = {
  padding: "10px",
  backgroundColor: "#09090b", // explicitly dark so QuickChart renders well with transparent background
  borderRadius: "8px",
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
  marginBottom: "20px",
};

const metricCard = {
  padding: "15px",
  backgroundColor: "#f4f4f5", // zinc-100
  borderRadius: "8px",
  marginRight: "10px",
  textAlign: "center" as const,
  width: "33%"
};

const metricLabel = {
  fontSize: "11px",
  textTransform: "uppercase" as const,
  color: "#71717a", // zinc-500
  letterSpacing: "0.5px",
  margin: "0 0 5px 0",
};

const metricValue = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#18181b", // zinc-900
  margin: "0",
};

const metricValueOverdue = {
  fontSize: "18px",
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
