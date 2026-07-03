"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FadeIn = FadeIn;
exports.SlideUp = SlideUp;
exports.Reveal = Reveal;
exports.SlideIn = SlideIn;
const jsx_runtime_1 = require("react/jsx-runtime");
const framer_motion_1 = require("framer-motion");
function FadeIn({ children, delay = 0, className = "", }) {
    return ((0, jsx_runtime_1.jsx)(framer_motion_1.motion.div, { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-10%" }, transition: { duration: 0.7, delay, ease: [0.21, 0.47, 0.32, 0.98] }, className: className, children: children }));
}
function SlideUp({ children, delay = 0, className = "", }) {
    return ((0, jsx_runtime_1.jsx)(framer_motion_1.motion.div, { initial: { opacity: 0, y: 40 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-10%" }, transition: { duration: 0.8, delay, ease: [0.21, 0.47, 0.32, 0.98] }, className: className, children: children }));
}
function Reveal({ children, delay = 0, className = "", }) {
    return ((0, jsx_runtime_1.jsx)(framer_motion_1.motion.div, { initial: { opacity: 0, scale: 0.95 }, whileInView: { opacity: 1, scale: 1 }, viewport: { once: true, margin: "-10%" }, transition: { duration: 0.6, delay, ease: [0.21, 0.47, 0.32, 0.98] }, className: className, children: children }));
}
function SlideIn({ children, left = false, right = false, delay = 0, className = "", }) {
    return ((0, jsx_runtime_1.jsx)(framer_motion_1.motion.div, { initial: { opacity: 0, x: left ? -40 : right ? 40 : 0 }, whileInView: { opacity: 1, x: 0 }, viewport: { once: true, margin: "-10%" }, transition: { duration: 0.8, delay, ease: [0.21, 0.47, 0.32, 0.98] }, className: className, children: children }));
}
