"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupsManager = GroupsManager;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const button_1 = require("@/components/ui/button");
const actions_1 = require("../actions");
function GroupsManager({ groups }) {
    const [isOpen, setIsOpen] = (0, react_1.useState)(false);
    const [editingGroup, setEditingGroup] = (0, react_1.useState)(null);
    const [isCreating, setIsCreating] = (0, react_1.useState)(false);
    const [name, setName] = (0, react_1.useState)("");
    const [description, setDescription] = (0, react_1.useState)("");
    const [color, setColor] = (0, react_1.useState)("#3b82f6");
    const [isPending, startTransition] = (0, react_1.useTransition)();
    const handleOpen = () => setIsOpen(true);
    const handleClose = () => {
        setIsOpen(false);
        resetForm();
    };
    const resetForm = () => {
        setEditingGroup(null);
        setIsCreating(false);
        setName("");
        setDescription("");
        setColor("#3b82f6");
    };
    const startEdit = (g) => {
        setEditingGroup(g);
        setIsCreating(false);
        setName(g.name);
        setDescription(g.description || "");
        setColor(g.color || "#3b82f6");
    };
    const startCreate = () => {
        resetForm();
        setIsCreating(true);
    };
    const handleSave = async () => {
        if (!name.trim())
            return;
        startTransition(async () => {
            try {
                if (isCreating) {
                    await (0, actions_1.createGroup)({ name, description, color });
                }
                else if (editingGroup) {
                    await (0, actions_1.updateGroup)(editingGroup.id, { name, description, color });
                }
                resetForm();
            }
            catch (err) {
                console.error(err);
            }
        });
    };
    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this group?"))
            return;
        startTransition(async () => {
            try {
                await (0, actions_1.deleteGroup)(id);
            }
            catch (err) {
                console.error(err);
            }
        });
    };
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)(button_1.Button, { variant: "secondary", onClick: handleOpen, className: "w-full sm:w-auto gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.FolderGit2, { className: "h-4 w-4" }), "Manage Groups"] }), isOpen && ((0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm", children: (0, jsx_runtime_1.jsxs)("div", { className: "bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between p-4 border-b border-zinc-800", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-lg font-medium text-zinc-100", children: "Manage Groups" }), (0, jsx_runtime_1.jsx)("button", { onClick: handleClose, className: "p-1 text-zinc-400 hover:text-zinc-100 transition-colors", children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { className: "h-5 w-5" }) })] }), (0, jsx_runtime_1.jsx)("div", { className: "p-4 overflow-y-auto flex-1", children: !isCreating && !editingGroup ? ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)(button_1.Button, { onClick: startCreate, className: "w-full gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { className: "h-4 w-4" }), " Create New Group"] }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-2 mt-4", children: groups.length === 0 ? ((0, jsx_runtime_1.jsx)("p", { className: "text-sm text-zinc-500 text-center py-4", children: "No groups created yet." })) : (groups.map((g) => ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-800/30", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-4 h-4 rounded-full", style: { backgroundColor: g.color || "#3b82f6" } }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-medium text-zinc-200", children: g.name }), g.description && (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-zinc-500", children: g.description })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-2", children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => startEdit(g), className: "p-1.5 text-zinc-400 hover:text-blue-400 transition-colors", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Edit2, { className: "h-4 w-4" }) }), (0, jsx_runtime_1.jsx)("button", { onClick: () => handleDelete(g.id), className: "p-1.5 text-zinc-400 hover:text-red-400 transition-colors", children: isPending ? (0, jsx_runtime_1.jsx)(lucide_react_1.Loader2, { className: "h-4 w-4 animate-spin" }) : (0, jsx_runtime_1.jsx)(lucide_react_1.Trash2, { className: "h-4 w-4" }) })] })] }, g.id)))) })] })) : ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-zinc-300 mb-1", children: "Name" }), (0, jsx_runtime_1.jsx)("input", { type: "text", value: name, onChange: (e) => setName(e.target.value), className: "w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500", placeholder: "e.g. VIP Clients" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-zinc-300 mb-1", children: "Description (Optional)" }), (0, jsx_runtime_1.jsx)("input", { type: "text", value: description, onChange: (e) => setDescription(e.target.value), className: "w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500", placeholder: "e.g. High priority customers" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-zinc-300 mb-1", children: "Color" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)("input", { type: "color", value: color, onChange: (e) => setColor(e.target.value), className: "h-8 w-8 rounded cursor-pointer border-0 p-0" }), (0, jsx_runtime_1.jsx)("span", { className: "text-sm text-zinc-400", children: color })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex justify-end gap-3 mt-6 pt-4 border-t border-zinc-800", children: [(0, jsx_runtime_1.jsx)(button_1.Button, { variant: "ghost", onClick: resetForm, disabled: isPending, children: "Cancel" }), (0, jsx_runtime_1.jsxs)(button_1.Button, { onClick: handleSave, disabled: !name.trim() || isPending, children: [isPending && (0, jsx_runtime_1.jsx)(lucide_react_1.Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Save Group"] })] })] })) })] }) }))] }));
}
