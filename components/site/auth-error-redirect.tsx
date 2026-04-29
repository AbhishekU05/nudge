"use client";

import { useEffect } from "react";

import { getEmailLinkErrorMessage } from "@/lib/auth-errors";

export function AuthErrorRedirect() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(
      window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash,
    );

    const description =
      params.get("error_description") ?? hashParams.get("error_description");
    const error = params.get("error") ?? hashParams.get("error");

    if (!description && !error) {
      return;
    }

    const target = new URL("/forgot-password", window.location.origin);
    target.searchParams.set("error", getEmailLinkErrorMessage(description ?? error));
    window.location.replace(target.toString());
  }, []);

  return null;
}
