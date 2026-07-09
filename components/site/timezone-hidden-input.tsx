"use client";

import { useEffect, useRef } from "react";

export function TimezoneHiddenInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && inputRef.current) {
        inputRef.current.value = tz;
      }
    } catch {
      // Ignore
    }
  }, []);

  return <input ref={inputRef} type="hidden" name="timezone" defaultValue="UTC" />;
}
