"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mutedText = exports.baseText = exports.fontFamily = exports.colors = void 0;
exports.colors = {
    accent: "#4F46E5",
    background: "#F6F7F9",
    border: "#E5E7EB",
    card: "#FFFFFF",
    muted: "#6B7280",
    softBorder: "#EEF0F3",
    softText: "#9CA3AF",
    text: "#111827",
};
exports.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
exports.baseText = {
    color: exports.colors.text,
    fontFamily: exports.fontFamily,
    fontSize: "15px",
    lineHeight: "24px",
    margin: "0",
};
exports.mutedText = {
    ...exports.baseText,
    color: exports.colors.muted,
};
