"use client";

export function LocalTime({
  value,
  fallback = "Not sent yet",
}: {
  value: string | null;
  fallback?: string;
}) {
  if (!value) {
    return <>{fallback}</>;
  }

  const date = new Date(value);
  const formattedClient = date.toLocaleString(undefined, {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  });

  return <span suppressHydrationWarning>{formattedClient}</span>;
}
