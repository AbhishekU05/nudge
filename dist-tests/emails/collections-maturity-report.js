"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollectionsMaturityReportEmail = CollectionsMaturityReportEmail;
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@react-email/components");
const EmailCard_1 = require("@/emails/components/EmailCard");
const EmailLayout_1 = require("@/emails/components/EmailLayout");
const Typography_1 = require("@/emails/components/Typography");
function CollectionsMaturityReportEmail({ appUrl, name, results, }) {
    return ((0, jsx_runtime_1.jsx)(EmailLayout_1.EmailLayout, { appUrl: appUrl, eyebrow: "Maturity assessment", preview: `Your Duely collections maturity report is ready`, children: (0, jsx_runtime_1.jsxs)(EmailCard_1.EmailCard, { children: [(0, jsx_runtime_1.jsx)(Typography_1.EmailHeading, { children: "Your maturity report is ready" }), (0, jsx_runtime_1.jsxs)(Typography_1.EmailText, { children: ["Hi ", name, ", your personalized Collections Maturity Assessment report is attached."] }), (0, jsx_runtime_1.jsxs)(components_1.Section, { style: summaryGrid, children: [(0, jsx_runtime_1.jsxs)(Typography_1.EmailText, { children: ["Overall score: ", (0, jsx_runtime_1.jsxs)("strong", { children: [results.overallScore, "/100"] })] }), (0, jsx_runtime_1.jsxs)(Typography_1.EmailText, { children: ["Maturity level: ", (0, jsx_runtime_1.jsx)("strong", { children: results.level })] }), (0, jsx_runtime_1.jsxs)(Typography_1.EmailText, { children: ["Weakest area: ", (0, jsx_runtime_1.jsx)("strong", { children: results.weakest.label })] })] }), (0, jsx_runtime_1.jsx)(Typography_1.EmailMutedText, { children: "Duely tracks payment promises, follow-ups, and reminders automatically so nothing slips through the cracks." })] }) }));
}
const summaryGrid = {
    margin: "20px 0",
};
