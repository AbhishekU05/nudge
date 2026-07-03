"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerGroupsAssigner = CustomerGroupsAssigner;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const actions_1 = require("../actions");
function CustomerGroupsAssigner({ customerId, allGroups, assignedGroupIds, }) {
    const [isOpen, setIsOpen] = (0, react_1.useState)(false);
    const [isPending, startTransition] = (0, react_1.useTransition)();
    const popoverRef = (0, react_1.useRef)(null);
    // Close popover on click outside
    (0, react_1.useEffect)(() => {
        function handleClickOutside(event) {
            if (popoverRef.current && !popoverRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);
    const handleToggleGroup = (groupId, currentlyAssigned) => {
        startTransition(async () => {
            try {
                await (0, actions_1.toggleCustomerGroup)(customerId, groupId, !currentlyAssigned);
            }
            catch (err) {
                console.error(err);
            }
        });
    };
    const assignedGroups = allGroups.filter((g) => assignedGroupIds.includes(g.id));
    return ((0, jsx_runtime_1.jsxs)("div", { className: "relative flex items-center gap-1.5 flex-wrap", ref: popoverRef, children: [assignedGroups.map((g) => ((0, jsx_runtime_1.jsx)("button", { onClick: (e) => {
                    e.preventDefault();
                    setIsOpen(!isOpen);
                }, className: "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border transition-opacity hover:opacity-80", style: {
                    backgroundColor: `${g.color || "#3b82f6"}20`, // 20% opacity
                    color: g.color || "#3b82f6",
                    borderColor: `${g.color || "#3b82f6"}40`,
                }, title: "Change group", children: g.name }, g.id))), assignedGroupIds.length === 0 && ((0, jsx_runtime_1.jsx)("button", { onClick: (e) => {
                    e.preventDefault(); // Prevent navigating to client page if inside a row click
                    setIsOpen(!isOpen);
                }, className: "inline-flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-zinc-600 text-zinc-400 hover:text-zinc-200 hover:border-zinc-400 transition-colors bg-transparent", title: "Assign group", children: isPending ? (0, jsx_runtime_1.jsx)(lucide_react_1.Loader2, { className: "h-3 w-3 animate-spin" }) : (0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { className: "h-3 w-3" }) })), isOpen && ((0, jsx_runtime_1.jsxs)("div", { className: "absolute top-full left-0 mt-1.5 w-56 rounded-lg border border-zinc-800 bg-zinc-900 p-2 shadow-xl z-10", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs font-medium text-zinc-500 mb-2 px-2", children: "Assign Groups" }), allGroups.length === 0 ? ((0, jsx_runtime_1.jsx)("p", { className: "text-xs text-zinc-500 px-2 py-1", children: "No groups available." })) : ((0, jsx_runtime_1.jsx)("div", { className: "space-y-1 max-h-48 overflow-y-auto", children: allGroups.map((g) => {
                            const isAssigned = assignedGroupIds.includes(g.id);
                            return ((0, jsx_runtime_1.jsxs)("button", { onClick: (e) => {
                                    e.preventDefault();
                                    handleToggleGroup(g.id, isAssigned);
                                    if (!isAssigned)
                                        setIsOpen(false); // Close menu after picking a new group
                                }, className: "w-full flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-zinc-800 transition-colors", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-3 h-3 rounded-full", style: { backgroundColor: g.color || "#3b82f6" } }), (0, jsx_runtime_1.jsx)("span", { className: "text-zinc-200 truncate max-w-[120px] text-left", children: g.name })] }), isAssigned && (0, jsx_runtime_1.jsx)(lucide_react_1.Check, { className: "h-4 w-4 text-zinc-400" })] }, g.id));
                        }) }))] }))] }));
}
