"use client";

import { useEffect, useRef } from "react";
import { dailyBackgroundSync } from "@/app/actions/integrations";

export function DashboardBackgroundSync() {
  const hasSynced = useRef(false);

  useEffect(() => {
    if (!hasSynced.current) {
      hasSynced.current = true;
      
      // Fire and forget
      dailyBackgroundSync().catch(console.error);
    }
  }, []);

  return null;
}
