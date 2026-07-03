"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureFadeIn = FeatureFadeIn;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
function FeatureFadeIn({ children, delay = 0, className, }) {
    const ref = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        const el = ref.current;
        if (!el)
            return;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                el.style.opacity = "1";
                el.style.transform = "translateY(0)";
                observer.unobserve(el);
            }
        }, { threshold: 0.1 });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
    return ((0, jsx_runtime_1.jsx)("div", { ref: ref, className: className, style: {
            opacity: 0,
            transform: "translateY(36px)",
            transition: `opacity 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        }, children: children }));
}
