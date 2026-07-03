"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cn = cn;
exports.getInitials = getInitials;
exports.getDisplayName = getDisplayName;
const clsx_1 = require("clsx");
const tailwind_merge_1 = require("tailwind-merge");
function cn(...inputs) {
    return (0, tailwind_merge_1.twMerge)((0, clsx_1.clsx)(inputs));
}
function getInitials(name) {
    return name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}
function getDisplayName(name, fallback) {
    const trimmed = name?.trim();
    return trimmed && trimmed.length > 0 ? trimmed : fallback;
}
