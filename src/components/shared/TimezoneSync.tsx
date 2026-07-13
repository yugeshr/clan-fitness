"use client";

import { useEffect } from "react";
import { syncTimezone } from "@/features/profile/actions";

export function TimezoneSync() {
  useEffect(() => {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (timezone) syncTimezone(timezone).catch(() => {});
    } catch {
      // Intl unsupported, or no zone reported — leave the existing/default value in place.
    }
  }, []);

  return null;
}
