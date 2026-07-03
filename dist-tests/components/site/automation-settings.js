"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomationSettings = AutomationSettings;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const react_dom_1 = require("react-dom");
const navigation_1 = require("next/navigation");
const button_1 = require("@/components/ui/button");
const badge_1 = require("@/components/ui/badge");
const label_1 = require("@/components/ui/label");
const input_1 = require("@/components/ui/input");
const textarea_1 = require("@/components/ui/textarea");
const automation_1 = require("@/app/actions/automation");
function SubmitButton({ children, pendingText }) {
    const { pending } = (0, react_dom_1.useFormStatus)();
    return ((0, jsx_runtime_1.jsx)(button_1.Button, { type: "submit", disabled: pending, children: pending ? pendingText || "Saving..." : children }));
}
function AutomationSettings({ entityType, entityId, active, autoApprove, reminderType, reminderTemplates, targetEmail, isAllowed = true, }) {
    const [isEditing, setIsEditing] = (0, react_1.useState)(false);
    const [type, setType] = (0, react_1.useState)(reminderType || "recurring");
    const cleanTemplates = (reminderTemplates?.length > 0
        ? reminderTemplates
        : [{ subject: "Reminder", body_html: "Your balance is due.", days_offset: 7 }]).map(tpl => ({
        ...tpl,
        body_html: tpl.body_html
            .replace(/<\/?p>/g, '\n')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim()
    }));
    const [templates, setTemplates] = (0, react_1.useState)(cleanTemplates);
    const router = (0, navigation_1.useRouter)();
    const [showEmailPrompt, setShowEmailPrompt] = (0, react_1.useState)(false);
    const [emailInput, setEmailInput] = (0, react_1.useState)("");
    const formRef = (0, react_1.useRef)(null);
    const onFormSubmit = (e) => {
        const hasEmail = targetEmail?.trim() || emailInput.trim();
        if (!hasEmail) {
            e.preventDefault();
            setShowEmailPrompt(true);
        }
    };
    const handleAddTemplate = () => {
        setTemplates([...templates, { subject: "", body_html: "", days_offset: 7 }]);
    };
    const handleRemoveTemplate = (index) => {
        setTemplates(templates.filter((_, i) => i !== index));
    };
    const handleUpdateTemplate = (index, field, value) => {
        const newTemplates = [...templates];
        newTemplates[index] = { ...newTemplates[index], [field]: value };
        setTemplates(newTemplates);
    };
    const handleSave = async (formData) => {
        let emailToUse = targetEmail?.trim() || emailInput.trim();
        if (!emailToUse) {
            alert("Automation save cancelled. An email address is required.");
            return;
        }
        if (emailInput.trim()) {
            formData.append("new_email", emailInput.trim());
        }
        formData.append("entity_type", entityType);
        formData.append("entity_id", entityId);
        formData.append("reminder_type", type);
        formData.append("reminder_templates", JSON.stringify(templates));
        try {
            await (0, automation_1.saveAutomationSettings)(formData);
            setIsEditing(false);
            router.refresh();
        }
        catch (e) {
            alert(e instanceof Error ? e.message : "Error saving automation");
        }
    };
    const handlePause = async () => {
        await (0, automation_1.pauseAutomation)(entityType, entityId);
        router.refresh();
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "rounded-2xl border border-white/10 bg-zinc-900/50 p-6 flex flex-col h-full", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between mb-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Zap, { className: "h-5 w-5 text-zinc-400" }), (0, jsx_runtime_1.jsx)("h2", { className: "text-xl font-medium text-zinc-100", children: entityType === "client" ? "Statement Automation" : "Invoice Automation" })] }), (0, jsx_runtime_1.jsx)("div", { children: active ? ((0, jsx_runtime_1.jsx)(badge_1.Badge, { variant: "default", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", children: "Active" })) : ((0, jsx_runtime_1.jsx)(badge_1.Badge, { variant: "muted", className: "bg-zinc-800 text-zinc-400 border-zinc-700", children: "Inactive" })) })] }), !active && !isEditing && ((0, jsx_runtime_1.jsxs)("div", { className: "flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/10 rounded-xl", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Zap, { className: "h-8 w-8 text-zinc-600 mb-3" }), (0, jsx_runtime_1.jsx)("h3", { className: "text-sm font-medium text-zinc-300", children: "Automated Reminders" }), (0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-xs text-zinc-500 max-w-[200px]", children: "Send automated emails on a schedule or via a sequence." }), !isAllowed ? ((0, jsx_runtime_1.jsx)("p", { className: "mt-4 text-sm text-rose-400 font-medium bg-rose-500/10 px-3 py-1.5 rounded-md", children: "Upgrade to a paid subscription to enable automations." })) : ((0, jsx_runtime_1.jsxs)(button_1.Button, { className: "mt-4 gap-2", variant: "secondary", onClick: () => setIsEditing(true), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.PlayCircle, { className: "h-4 w-4" }), "Enable Automation"] }))] })), (active || isEditing) && !isAllowed && ((0, jsx_runtime_1.jsxs)("div", { className: "mb-6 p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 flex flex-col items-center text-center", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-medium text-rose-400 mb-2", children: "Automations are paused. Upgrade to a paid subscription to resume sending reminders." }), (0, jsx_runtime_1.jsx)(button_1.Button, { variant: "secondary", size: "sm", onClick: handlePause, children: "Pause Automation" })] })), (active || isEditing) && isAllowed && ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "rounded-xl border border-white/5 bg-white/[0.02] p-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 mb-1", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Clock, { className: "h-4 w-4 text-zinc-500" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs font-medium text-zinc-400", children: "Type" })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-zinc-200 capitalize", children: reminderType })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-xl border border-white/5 bg-white/[0.02] p-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 mb-1", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.ShieldCheck, { className: "h-4 w-4 text-zinc-500" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs font-medium text-zinc-400", children: "Auto Approve" })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-zinc-200", children: autoApprove ? "Yes" : "Requires Approval" })] })] }), isEditing ? ((0, jsx_runtime_1.jsxs)("form", { ref: formRef, action: handleSave, onSubmit: onFormSubmit, className: "space-y-6 rounded-xl border border-white/10 bg-black/20 p-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-4 border-b border-white/10 pb-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "auto_approve", children: "Approval" }), (0, jsx_runtime_1.jsxs)("select", { id: "auto_approve", name: "auto_approve", defaultValue: autoApprove ? "true" : "false", className: "flex h-10 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50", children: [(0, jsx_runtime_1.jsx)("option", { value: "false", children: "Queue emails for my review" }), (0, jsx_runtime_1.jsx)("option", { value: "true", children: "Send emails automatically" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { children: "Strategy" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-4", children: [(0, jsx_runtime_1.jsxs)("label", { className: "flex items-center gap-2 text-sm text-zinc-300", children: [(0, jsx_runtime_1.jsx)("input", { type: "radio", checked: type === "recurring", onChange: () => {
                                                                    setType("recurring");
                                                                    setTemplates([templates[0] || { subject: "Reminder", body_html: "", days_offset: 7 }]);
                                                                } }), "Recurring (Same email)"] }), (0, jsx_runtime_1.jsxs)("label", { className: "flex items-center gap-2 text-sm text-zinc-300", children: [(0, jsx_runtime_1.jsx)("input", { type: "radio", checked: type === "sequence", onChange: () => setType("sequence") }), "Sequence (Multiple emails)"] })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [templates.map((tpl, idx) => ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-3 relative p-4 rounded-lg bg-white/[0.02] border border-white/5", children: [type === "sequence" && ((0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-center mb-2", children: [(0, jsx_runtime_1.jsxs)("span", { className: "text-xs font-semibold uppercase tracking-widest text-zinc-500", children: ["Email ", idx + 1] }), templates.length > 1 && ((0, jsx_runtime_1.jsx)(button_1.Button, { type: "button", variant: "ghost", size: "sm", className: "h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10", onClick: () => handleRemoveTemplate(idx), children: (0, jsx_runtime_1.jsx)(lucide_react_1.Trash2, { className: "h-3.5 w-3.5" }) }))] })), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 gap-4", children: [type === "recurring" ? ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-1.5", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { children: "Send every (days)" }), (0, jsx_runtime_1.jsx)(input_1.Input, { type: "number", min: "1", value: tpl.days_offset || 7, onChange: (e) => handleUpdateTemplate(idx, "days_offset", parseInt(e.target.value)), className: "bg-black/40" })] })) : ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-1.5", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { children: "Send after (days)" }), (0, jsx_runtime_1.jsx)(input_1.Input, { type: "number", min: "1", value: tpl.days_offset || 7, onChange: (e) => handleUpdateTemplate(idx, "days_offset", parseInt(e.target.value)), className: "bg-black/40" })] })), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-1.5", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { children: "Subject Line" }), (0, jsx_runtime_1.jsx)(input_1.Input, { value: tpl.subject, onChange: (e) => handleUpdateTemplate(idx, "subject", e.target.value), className: "bg-black/40" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-1.5", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { children: "Email Message" }), (0, jsx_runtime_1.jsx)(textarea_1.Textarea, { value: tpl.body_html, onChange: (e) => handleUpdateTemplate(idx, "body_html", e.target.value), rows: 6, className: "text-xs bg-black/40 resize-none", placeholder: "Type your plain text message here..." }), (0, jsx_runtime_1.jsxs)("p", { className: "text-[10px] text-zinc-500", children: ["Available variables: ", "{{first_name}}", ", ", "{{company_name}}", ", ", "{{amount_owed}}", entityType === "invoice" ? ", {{invoice_number}}" : ", {{invoice_count}}"] })] })] })] }, idx))), type === "sequence" && ((0, jsx_runtime_1.jsxs)(button_1.Button, { type: "button", variant: "secondary", size: "sm", className: "w-full gap-2 border-dashed border-white/20", onClick: handleAddTemplate, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { className: "h-4 w-4" }), " Add Email to Sequence"] }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-2 justify-end pt-4 border-t border-white/10 mt-6", children: [(0, jsx_runtime_1.jsx)(button_1.Button, { type: "button", variant: "ghost", onClick: () => setIsEditing(false), children: "Cancel" }), (0, jsx_runtime_1.jsx)(SubmitButton, { children: "Save Automation" })] })] })) : ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3 pt-2", children: [(0, jsx_runtime_1.jsxs)(button_1.Button, { type: "button", variant: "secondary", className: "gap-2 border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300", onClick: handlePause, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.PauseCircle, { className: "h-4 w-4" }), "Pause"] }), (0, jsx_runtime_1.jsxs)(button_1.Button, { type: "button", variant: "secondary", className: "gap-2", onClick: () => setIsEditing(true), children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Settings2, { className: "h-4 w-4" }), "Configure"] })] }))] })), showEmailPrompt && ((0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "w-full max-w-md rounded-xl border border-white/10 bg-zinc-900 shadow-2xl overflow-hidden", children: [(0, jsx_runtime_1.jsxs)("div", { className: "p-6", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-lg font-medium text-white mb-2", children: "Email Address Required" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-zinc-400 mb-6", children: "This automation requires an email address. Please enter the recipient's email address below to continue." }), (0, jsx_runtime_1.jsx)(input_1.Input, { type: "email", value: emailInput, onChange: (e) => setEmailInput(e.target.value), placeholder: "recipient@example.com", className: "mb-2", autoFocus: true, onKeyDown: (e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            if (!emailInput.trim()) {
                                                alert("Please enter a valid email.");
                                                return;
                                            }
                                            setShowEmailPrompt(false);
                                            setTimeout(() => formRef.current?.requestSubmit(), 50);
                                        }
                                    } })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex justify-end gap-3 bg-zinc-950/50 p-4 border-t border-white/5", children: [(0, jsx_runtime_1.jsx)(button_1.Button, { variant: "ghost", onClick: () => setShowEmailPrompt(false), children: "Cancel" }), (0, jsx_runtime_1.jsx)(button_1.Button, { onClick: () => {
                                        if (!emailInput.trim()) {
                                            alert("Please enter a valid email.");
                                            return;
                                        }
                                        setShowEmailPrompt(false);
                                        setTimeout(() => formRef.current?.requestSubmit(), 50);
                                    }, children: "Save & Continue" })] })] }) }))] }));
}
