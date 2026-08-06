"use client";

import { useEffect } from "react";

export default function CalendarNavigation() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest("button");
      const label = button?.textContent?.trim();

      if (label === "Kalender" || label === "Calendar") {
        event.preventDefault();
        window.location.assign("/kalender");
      }

      if (label === "Bewerbungen" || label === "Applications") {
        event.preventDefault();
        window.location.assign("/bewerbungen");
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  return null;
}
