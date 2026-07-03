"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCALE_LABELS = exports.QUESTIONS = void 0;
exports.calculateMaturity = calculateMaturity;
exports.getWeakestExplanation = getWeakestExplanation;
exports.getStrongestExplanation = getStrongestExplanation;
exports.getDuelyPositioning = getDuelyPositioning;
exports.QUESTIONS = [
    // Category 1 — Follow-Up Discipline
    { id: "q1", category: "followUpDiscipline", text: "Do you send reminders before invoice due dates?" },
    { id: "q2", category: "followUpDiscipline", text: "Do you follow up consistently on overdue invoices?" },
    { id: "q3", category: "followUpDiscipline", text: "Is there a defined escalation process?" },
    { id: "q4", category: "followUpDiscipline", text: "Does your team know who owns collections?" },
    { id: "q5", category: "followUpDiscipline", text: "Are follow-ups documented?" },
    // Category 2 — Payment Promise Tracking
    { id: "q6", category: "promiseTracking", text: "Do you record payment commitments from clients?" },
    { id: "q7", category: "promiseTracking", text: "Can you see all outstanding promises in one place?" },
    { id: "q8", category: "promiseTracking", text: "Are broken promises automatically surfaced?" },
    { id: "q9", category: "promiseTracking", text: "Can multiple team members access promise history?" },
    { id: "q10", category: "promiseTracking", text: "Is promise tracking standardized?" },
    // Category 3 — Visibility & Reporting
    { id: "q11", category: "visibility", text: "Do you know your current overdue balance?" },
    { id: "q12", category: "visibility", text: "Do you track average payment delays?" },
    { id: "q13", category: "visibility", text: "Do you review collections performance weekly?" },
    { id: "q14", category: "visibility", text: "Do you have collections dashboards?" },
    { id: "q15", category: "visibility", text: "Can leadership quickly identify problem accounts?" },
    // Category 4 — Automation
    { id: "q16", category: "automation", text: "Are reminders automated?" },
    { id: "q17", category: "automation", text: "Are recurring follow-ups automated?" },
    { id: "q18", category: "automation", text: "Are escalation workflows automated?" },
    { id: "q19", category: "automation", text: "Are collections tasks automatically assigned?" },
    { id: "q20", category: "automation", text: "Are collection activities logged automatically?" },
];
exports.SCALE_LABELS = ["Never", "Rarely", "Sometimes", "Usually", "Almost Always", "Always"];
const CATEGORY_LABELS = {
    followUpDiscipline: "Follow-Up Discipline",
    promiseTracking: "Payment Promise Tracking",
    visibility: "Visibility & Reporting",
    automation: "Automation",
};
const CATEGORY_ORDER = [
    "followUpDiscipline",
    "promiseTracking",
    "visibility",
    "automation",
];
function calculateMaturity(answers) {
    const categoryScores = {
        followUpDiscipline: 0,
        promiseTracking: 0,
        visibility: 0,
        automation: 0,
    };
    for (const q of exports.QUESTIONS) {
        categoryScores[q.category] += answers[q.id] ?? 0;
    }
    const categories = CATEGORY_ORDER.map((key) => {
        const maxScore = 25; // 5 questions × 5 max
        const score = categoryScores[key];
        return {
            key,
            label: CATEGORY_LABELS[key],
            score,
            maxScore,
            percentage: Math.round((score / maxScore) * 100),
        };
    });
    const totalScore = categories.reduce((sum, c) => sum + c.score, 0);
    const overallPercentage = Math.round((totalScore / 100) * 100);
    const weakest = categories.reduce((min, c) => (c.percentage < min.percentage ? c : min));
    const strongest = categories.reduce((max, c) => (c.percentage > max.percentage ? c : max));
    const level = getLevel(overallPercentage);
    const levelDescription = getLevelDescription(level);
    const recommendations = getRecommendations(weakest.key);
    return {
        overallScore: overallPercentage,
        overallPercentage,
        level,
        levelDescription,
        categories,
        weakest,
        strongest,
        recommendations,
    };
}
function getLevel(score) {
    if (score >= 86)
        return "Top Quartile";
    if (score >= 71)
        return "Operationally Strong";
    if (score >= 41)
        return "Growing Agency";
    return "Collections At Risk";
}
function getLevelDescription(level) {
    switch (level) {
        case "Collections At Risk":
            return "Your collections process relies heavily on manual effort and likely creates avoidable payment delays.";
        case "Growing Agency":
            return "You have some structure, but important collections processes are inconsistent and difficult to scale.";
        case "Operationally Strong":
            return "Your collections process is healthier than most agencies but still has opportunities for improvement.";
        case "Top Quartile":
            return "Your collections operation is highly disciplined and scalable.";
    }
}
function getWeakestExplanation(key) {
    switch (key) {
        case "followUpDiscipline":
            return "You are relying on memory and ad-hoc reminders to follow up on overdue invoices. This creates avoidable payment delays as client count grows.";
        case "promiseTracking":
            return "You are relying on memory, inboxes, or spreadsheets to manage payment commitments. This creates collection risk as invoice volume grows.";
        case "visibility":
            return "Your team lacks visibility into collections performance. Without dashboards and regular reviews, problem accounts go unnoticed.";
        case "automation":
            return "Your collections process depends almost entirely on manual effort. This limits scalability and increases the risk of dropped follow-ups.";
    }
}
function getStrongestExplanation(key) {
    switch (key) {
        case "followUpDiscipline":
            return "Your team has strong follow-up habits. Consistent reminders and documented processes keep invoices from slipping through the cracks.";
        case "promiseTracking":
            return "Your team actively tracks payment promises and can surface broken commitments. This reduces collection risk significantly.";
        case "visibility":
            return "Your team has strong visibility into collections performance. Regular reviews and dashboards help identify problem accounts quickly.";
        case "automation":
            return "Your collections workflows are well-automated, reducing manual effort and ensuring consistent follow-up.";
    }
}
function getRecommendations(weakestCategory) {
    switch (weakestCategory) {
        case "followUpDiscipline":
            return [
                "Send reminders before invoice due dates",
                "Create a consistent follow-up cadence",
                "Define a clear escalation process",
                "Assign collections ownership",
                "Document every follow-up interaction",
            ];
        case "promiseTracking":
            return [
                "Record every payment commitment with a date",
                "Centralize promise tracking in one system",
                "Surface broken promises automatically",
                "Give team members access to promise history",
                "Standardize how promises are tracked",
            ];
        case "visibility":
            return [
                "Know your current overdue balance at all times",
                "Track average payment delay trends",
                "Review collections performance weekly",
                "Build or adopt collections dashboards",
                "Identify problem accounts proactively",
            ];
        case "automation":
            return [
                "Automate reminders for overdue invoices",
                "Standardize escalation workflows",
                "Centralize collections activity logging",
                "Auto-assign collections tasks",
                "Reduce manual tracking wherever possible",
            ];
    }
}
function getDuelyPositioning(weakestCategory) {
    switch (weakestCategory) {
        case "followUpDiscipline":
            return {
                headline: "Inconsistent follow-ups create avoidable payment delays.",
                body: "Duely ensures every follow-up happens on time with automated reminders and structured escalation workflows.",
            };
        case "promiseTracking":
            return {
                headline: "Client payment commitments are easy to lose track of.",
                body: "Duely centralizes payment promises and automatically surfaces broken commitments so nothing falls through the cracks.",
            };
        case "visibility":
            return {
                headline: "You can\u2019t improve what you can\u2019t see.",
                body: "Duely provides visibility into overdue invoices, promises, and collections activity — all in one dashboard.",
            };
        case "automation":
            return {
                headline: "Your collections process depends too much on manual work.",
                body: "Duely automates reminders, follow-ups, and collections workflows so nothing falls through the cracks.",
            };
    }
}
