"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentLeakReportEmail = PaymentLeakReportEmail;
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@react-email/components");
const EmailCard_1 = require("@/emails/components/EmailCard");
const EmailLayout_1 = require("@/emails/components/EmailLayout");
const Typography_1 = require("@/emails/components/Typography");
const calculations_1 = require("@/lib/payment-leak-calculator/calculations");
function PaymentLeakReportEmail({ appUrl, name, results, }) {
    return ((0, jsx_runtime_1.jsx)(EmailLayout_1.EmailLayout, { appUrl: appUrl, eyebrow: "Collections report", preview: `Your Duely payment leak report is ready`, children: (0, jsx_runtime_1.jsxs)(EmailCard_1.EmailCard, { children: [(0, jsx_runtime_1.jsx)(Typography_1.EmailHeading, { children: "Your collections report is ready" }), (0, jsx_runtime_1.jsxs)(Typography_1.EmailText, { children: ["Hi ", name, ", your personalized Agency Payment Leak Estimator report is attached."] }), (0, jsx_runtime_1.jsxs)(components_1.Section, { style: summaryGrid, children: [(0, jsx_runtime_1.jsxs)(Typography_1.EmailText, { children: ["Cash tied up: ", (0, jsx_runtime_1.jsx)("strong", { children: (0, calculations_1.formatCurrency)(results.cashTiedUp) })] }), (0, jsx_runtime_1.jsxs)(Typography_1.EmailText, { children: ["Annual impact: ", (0, jsx_runtime_1.jsx)("strong", { children: (0, calculations_1.formatCurrency)(results.annualImpact) })] }), (0, jsx_runtime_1.jsxs)(Typography_1.EmailText, { children: ["Risk score: ", (0, jsx_runtime_1.jsxs)("strong", { children: [results.riskScore, "/100"] })] })] }), (0, jsx_runtime_1.jsx)(Typography_1.EmailMutedText, { children: "Duely tracks payment promises, follow-ups, and reminders automatically so nothing slips through the cracks." })] }) }));
}
const summaryGrid = {
    margin: "20px 0",
};
