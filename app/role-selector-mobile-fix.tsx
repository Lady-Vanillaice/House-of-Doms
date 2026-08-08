"use client";

import { useEffect } from "react";

export default function RoleSelectorMobileFix() {
  useEffect(() => {
    const selector = ".roleSelectorCard";

    function handleTap(event: Event) {
      const target = event.target as HTMLElement | null;
      const card = target?.closest(selector) as HTMLElement | null;
      if (!card) return;

      window.setTimeout(() => {
        const reveal = document.querySelector(".roleReveal") as HTMLElement | null;
        if (!reveal) return;
        reveal.setAttribute("tabindex", "-1");
        reveal.scrollIntoView({ behavior: "smooth", block: "start" });
        window.setTimeout(() => reveal.focus({ preventScroll: true }), 450);
      }, 120);
    }

    document.addEventListener("click", handleTap, true);
    return () => document.removeEventListener("click", handleTap, true);
  }, []);

  return null;
}
