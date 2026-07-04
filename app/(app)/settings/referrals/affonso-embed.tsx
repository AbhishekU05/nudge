"use client";

import { useEffect, useState } from "react";

export default function AffonsoEmbed() {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/affonso/embed-token")
      .then((r) => r.json())
      .then((d) => {
        if (d.token) setToken(d.token);
        else setError(true);
      })
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 rounded-xl border border-dashed border-white/10 text-zinc-500 text-sm">
        Unable to load affiliate dashboard. Please try again later.
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex items-center justify-center h-[600px] rounded-xl border border-white/10 bg-zinc-900/50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
          <p className="text-sm text-zinc-500">Loading affiliate dashboard…</p>
        </div>
      </div>
    );
  }

  // First-party mode: iframe served from /r/embed/* (proxied through our domain)
  const src = `/r/embed/referrals?token=${token}&theme=dark&lang=en&bg=09090b&padding=true`;

  return (
    <iframe
      id="affonso-embed"
      src={src}
      style={{ width: "100%", height: "700px", border: "none", borderRadius: "0.75rem" }}
      allow="clipboard-write"
      title="Affiliate Dashboard"
    />
  );
}
