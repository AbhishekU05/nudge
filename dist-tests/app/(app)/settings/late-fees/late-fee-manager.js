"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LateFeeManager = LateFeeManager;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const lucide_react_1 = require("lucide-react");
const late_fees_1 = require("@/app/actions/late-fees");
function LateFeeManager({ initialPolicies, groups }) {
    const [policies, setPolicies] = (0, react_1.useState)(initialPolicies);
    const [editingId, setEditingId] = (0, react_1.useState)(null);
    const [isCreating, setIsCreating] = (0, react_1.useState)(false);
    const [loading, setLoading] = (0, react_1.useState)(false);
    async function handleToggleActive(id, currentActive) {
        try {
            setPolicies(policies.map(p => p.id === id ? { ...p, active: !currentActive } : p));
            await (0, late_fees_1.toggleLateFeePolicyActive)(id, !currentActive);
        }
        catch (e) {
            // revert on error
            setPolicies(initialPolicies);
        }
    }
    async function handleDelete(id) {
        if (!confirm("Are you sure you want to delete this policy?"))
            return;
        try {
            setPolicies(policies.filter(p => p.id !== id));
            await (0, late_fees_1.deleteLateFeePolicy)(id);
        }
        catch (e) {
            setPolicies(initialPolicies);
        }
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [!isCreating && editingId === null && ((0, jsx_runtime_1.jsx)("div", { className: "flex justify-end", children: (0, jsx_runtime_1.jsxs)(button_1.Button, { onClick: () => setIsCreating(true), className: "gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { className: "h-4 w-4" }), "Create Policy"] }) })), (isCreating || editingId !== null) && ((0, jsx_runtime_1.jsx)(PolicyForm, { policy: editingId ? policies.find(p => p.id === editingId) : undefined, groups: groups, onCancel: () => {
                    setIsCreating(false);
                    setEditingId(null);
                }, onSuccess: () => {
                    setIsCreating(false);
                    setEditingId(null);
                    // In a real app we'd refresh from server or optimistically update, 
                    // but the server action calls revalidatePath which will reload the page data.
                } })), (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-4", children: [policies.map(policy => ((0, jsx_runtime_1.jsxs)(card_1.Card, { className: "border-white/10 bg-white/[0.035]", children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { className: "pb-3 flex flex-row items-start justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-lg font-medium", children: policy.name }), (0, jsx_runtime_1.jsxs)(card_1.CardDescription, { className: "mt-1", children: [policy.fee_type === "flat" ? `$${policy.fee_value}` : `${policy.fee_value}%`, " • ", policy.frequency === "once" ? "Applied once" : `Applied ${policy.frequency}`, " • ", policy.grace_period_days, " days grace"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: policy.active, onChange: () => handleToggleActive(policy.id, policy.active), className: "h-4 w-4 bg-transparent border-white/10 rounded accent-primary" }), (0, jsx_runtime_1.jsx)(label_1.Label, { className: "text-xs text-zinc-400", children: policy.active ? "Active" : "Inactive" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-1", children: [(0, jsx_runtime_1.jsx)(button_1.Button, { variant: "ghost", size: "sm", onClick: () => setEditingId(policy.id), className: "px-2", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Edit2, { className: "h-4 w-4 text-zinc-400" }) }), (0, jsx_runtime_1.jsx)(button_1.Button, { variant: "ghost", size: "sm", onClick: () => handleDelete(policy.id), className: "px-2", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Trash2, { className: "h-4 w-4 text-red-400 hover:text-red-300" }) })] })] })] }), (0, jsx_runtime_1.jsx)(card_1.CardContent, { className: "text-sm text-zinc-400", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("span", { className: "font-medium text-zinc-300", children: "Applies to:" }), " ", policy.apply_to === "existing_invoice" ? "Existing Invoices" : "New Invoices Only"] }), policy.excluded_group_ids && policy.excluded_group_ids.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("span", { className: "font-medium text-zinc-300", children: "Excluded groups:" }), " ", policy.excluded_group_ids.length] }))] }) })] }, policy.id))), policies.length === 0 && !isCreating && ((0, jsx_runtime_1.jsx)("div", { className: "text-center py-12 border border-white/10 rounded-lg bg-white/[0.02]", children: (0, jsx_runtime_1.jsx)("p", { className: "text-zinc-500", children: "No late fee policies defined yet." }) }))] })] }));
}
function PolicyForm({ policy, groups, onCancel, onSuccess }) {
    const [loading, setLoading] = (0, react_1.useState)(false);
    // "Apply to" group selection — default: all groups included (none excluded)
    const allGroupIds = groups.map(g => g.id);
    const initialSelected = allGroupIds.filter(id => !policy?.excluded_group_ids?.includes(id));
    const initialNoGroup = policy
        ? !(policy.excluded_group_ids ?? []).includes("__no_group__")
        : true;
    const [selectedGroupIds, setSelectedGroupIds] = (0, react_1.useState)(new Set(initialSelected));
    const [includeNoGroup, setIncludeNoGroup] = (0, react_1.useState)(initialNoGroup);
    const allChecked = groups.length > 0 && selectedGroupIds.size === groups.length;
    const someChecked = selectedGroupIds.size > 0 && !allChecked;
    function toggleAll() {
        if (allChecked) {
            setSelectedGroupIds(new Set());
        }
        else {
            setSelectedGroupIds(new Set(allGroupIds));
        }
    }
    function toggleGroup(id) {
        setSelectedGroupIds(prev => {
            const next = new Set(prev);
            if (next.has(id))
                next.delete(id);
            else
                next.add(id);
            return next;
        });
    }
    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        try {
            const formData = new FormData(e.currentTarget);
            // Compute excluded = groups NOT selected + optionally "__no_group__"
            const excludedGroupIds = allGroupIds.filter(id => !selectedGroupIds.has(id));
            if (!includeNoGroup)
                excludedGroupIds.push("__no_group__");
            // Remove any stale excluded_group_ids from the form and inject computed ones
            formData.delete("excluded_group_ids");
            excludedGroupIds.forEach(id => formData.append("excluded_group_ids", id));
            if (policy) {
                await (0, late_fees_1.updateLateFeePolicy)(policy.id, formData);
            }
            else {
                await (0, late_fees_1.createLateFeePolicy)(formData);
            }
            onSuccess();
        }
        catch (error) {
            console.error(error);
            alert("An error occurred");
        }
        finally {
            setLoading(false);
        }
    }
    return ((0, jsx_runtime_1.jsxs)(card_1.Card, { className: "border-white/20 bg-white/[0.05]", children: [(0, jsx_runtime_1.jsx)(card_1.CardHeader, { children: (0, jsx_runtime_1.jsx)(card_1.CardTitle, { children: policy ? "Edit Policy" : "Create New Policy" }) }), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, children: [(0, jsx_runtime_1.jsxs)(card_1.CardContent, { className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "name", children: "Policy Name" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "name", name: "name", defaultValue: policy?.name, required: true, placeholder: "e.g. Standard 5% Late Fee", className: "bg-black/20 border-white/10" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "fee_type", children: "Fee Type" }), (0, jsx_runtime_1.jsxs)("select", { id: "fee_type", name: "fee_type", defaultValue: policy?.fee_type || "percentage", className: "flex h-10 w-full items-center justify-between rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50", children: [(0, jsx_runtime_1.jsx)("option", { value: "percentage", children: "Percentage (%)" }), (0, jsx_runtime_1.jsx)("option", { value: "flat", children: "Flat Amount ($)" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "fee_value", children: "Fee Value" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "fee_value", name: "fee_value", type: "number", step: "0.01", min: "0", defaultValue: policy?.fee_value, required: true, className: "bg-black/20 border-white/10" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "grace_period_days", children: "Grace Period (Days)" }), (0, jsx_runtime_1.jsx)(input_1.Input, { id: "grace_period_days", name: "grace_period_days", type: "number", min: "0", defaultValue: policy?.grace_period_days || 0, required: true, className: "bg-black/20 border-white/10" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-zinc-500", children: "Days after due date before fee applies." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "frequency", children: "Frequency" }), (0, jsx_runtime_1.jsxs)("select", { id: "frequency", name: "frequency", defaultValue: policy?.frequency || "once", className: "flex h-10 w-full items-center justify-between rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50", children: [(0, jsx_runtime_1.jsx)("option", { value: "once", children: "Apply Once" }), (0, jsx_runtime_1.jsx)("option", { value: "weekly", children: "Apply Weekly" }), (0, jsx_runtime_1.jsx)("option", { value: "monthly", children: "Apply Monthly" })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "apply_to", children: "Apply To" }), (0, jsx_runtime_1.jsxs)("select", { id: "apply_to", name: "apply_to", defaultValue: policy?.apply_to || "existing_invoice", className: "flex h-10 w-full items-center justify-between rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50", children: [(0, jsx_runtime_1.jsx)("option", { value: "existing_invoice", children: "All Applicable Invoices" }), (0, jsx_runtime_1.jsx)("option", { value: "new_invoice", children: "Only New Invoices created after today" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { children: "Apply Late Fee to Groups" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-zinc-500", children: "Check the groups this fee should apply to." }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-md border border-white/10 bg-black/10 p-3 space-y-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between pb-2 border-b border-white/10", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", id: "group-check-all", checked: allChecked, ref: el => { if (el)
                                                                    el.indeterminate = someChecked; }, onChange: toggleAll, className: "h-4 w-4 bg-transparent border-white/10 rounded accent-primary" }), (0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: "group-check-all", className: "text-sm font-medium cursor-pointer text-zinc-200", children: allChecked ? "Deselect all" : "Select all" })] }), (0, jsx_runtime_1.jsxs)("span", { className: "text-xs text-zinc-500", children: [selectedGroupIds.size, " of ", groups.length, " selected"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 gap-2 max-h-36 overflow-y-auto", children: [groups.map(group => ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", id: `group-${group.id}`, checked: selectedGroupIds.has(group.id), onChange: () => toggleGroup(group.id), className: "h-4 w-4 bg-transparent border-white/10 rounded accent-primary" }), (0, jsx_runtime_1.jsx)(label_1.Label, { htmlFor: `group-${group.id}`, className: "text-sm font-normal cursor-pointer", children: group.name })] }, group.id))), groups.length === 0 && ((0, jsx_runtime_1.jsx)("div", { className: "col-span-2 text-zinc-500 text-sm italic", children: "No groups available." }))] }), (0, jsx_runtime_1.jsx)("div", { className: "pt-2 border-t border-white/10", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", id: "group-no-group", checked: includeNoGroup, onChange: e => setIncludeNoGroup(e.target.checked), className: "h-4 w-4 bg-transparent border-white/10 rounded accent-primary" }), (0, jsx_runtime_1.jsxs)(label_1.Label, { htmlFor: "group-no-group", className: "text-sm font-normal cursor-pointer", children: ["No group ", (0, jsx_runtime_1.jsx)("span", { className: "text-zinc-500", children: "(invoices not assigned to any group)" })] })] }) })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex justify-end gap-2 border-t border-white/10 pt-4 px-6 pb-6", children: [(0, jsx_runtime_1.jsx)(button_1.Button, { type: "button", variant: "ghost", onClick: onCancel, disabled: loading, children: "Cancel" }), (0, jsx_runtime_1.jsx)(button_1.Button, { type: "submit", disabled: loading, children: loading ? "Saving..." : "Save Policy" })] })] })] }));
}
