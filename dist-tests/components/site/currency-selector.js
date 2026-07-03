"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrencySelector = CurrencySelector;
const jsx_runtime_1 = require("react/jsx-runtime");
const navigation_1 = require("next/navigation");
function CurrencySelector({ currencies, selected, }) {
    const router = (0, navigation_1.useRouter)();
    const pathname = (0, navigation_1.usePathname)();
    const searchParams = (0, navigation_1.useSearchParams)();
    if (currencies.length <= 1)
        return null;
    return ((0, jsx_runtime_1.jsx)("select", { value: selected, onChange: (e) => {
            const val = e.target.value;
            const params = new URLSearchParams(searchParams.toString());
            params.set("currency", val);
            router.push(`${pathname}?${params.toString()}`);
        }, className: "h-9 w-[120px] rounded-md border border-white/10 bg-white/[0.05] px-3 py-1 text-sm text-zinc-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500", children: currencies.map((c) => ((0, jsx_runtime_1.jsx)("option", { value: c, className: "bg-[#18181b] text-zinc-200", children: c }, c))) }));
}
