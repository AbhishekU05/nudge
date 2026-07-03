"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardBackgroundSync = DashboardBackgroundSync;
const react_1 = require("react");
const integrations_1 = require("@/app/actions/integrations");
function DashboardBackgroundSync() {
    const hasSynced = (0, react_1.useRef)(false);
    (0, react_1.useEffect)(() => {
        if (!hasSynced.current) {
            hasSynced.current = true;
            // Fire and forget
            (0, integrations_1.dailyBackgroundSync)().catch(console.error);
        }
    }, []);
    return null;
}
