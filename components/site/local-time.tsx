"use client";

import { useEffect, useState } from "react";

export function LocalTime({
  value,
  fallback = "Not sent yet",
}: {
  value: string | null;
  fallback?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!value) {
    return <>{fallback}</>;
  }

  const date = new Date(value);

  if (!mounted) {
    // Server-side: render empty or a skeleton to prevent layout shift mismatch,
    // or render the UTC but we must ensure it replaces on client.
    // If we return the formatted server time here, we STILL have a mismatch because
    // the client first-render MUST match the server.
    return (
      <span suppressHydrationWarning className="opacity-0">
        {date.toLocaleString("en-US", {
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          month: "short",
          timeZone: "UTC",
        })}
      </span>
    );
  }

  const formattedClient = date.toLocaleString(undefined, {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  });

  return <span>{formattedClient}</span>;
}
