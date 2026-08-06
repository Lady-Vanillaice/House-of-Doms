"use client";

import { useEffect } from "react";

export default function CalendarNavigation() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest("button");
      const label = button?.textContent?.trim();
      const routes: Record<string,string> = {
        Kalender: "/kalender", Calendar: "/kalender",
        Bewerbungen: "/bewerbungen", Applications: "/bewerbungen",
        Journal: "/journal",
        "House-Einstellungen": "/house-einstellungen", "House Settings": "/house-einstellungen"
      };
      if (label && routes[label]) {
        event.preventDefault();
        window.location.assign(routes[label]);
      }
    };
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);
  return null;
}
