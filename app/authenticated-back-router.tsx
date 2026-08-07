"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client";

const protectedPrefixes = [
  "/dashboard","/house","/kammer","/kalender","/aufgaben","/journal","/keuschhaltung",
  "/studios","/store","/tribute","/homepage-builder","/bewerbungen","/house-einstellungen",
  "/kassenbuch","/profil","/benachrichtigungen"
];

export default function AuthenticatedBackRouter() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const onClick = async (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a") as HTMLAnchorElement | null;
      if (!anchor) return;

      const rawHref = anchor.getAttribute("href");
      if (rawHref !== "/") return;
      if (!protectedPrefixes.some(prefix => pathname.startsWith(prefix))) return;

      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;

      event.preventDefault();
      router.push("/dashboard");
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname, router]);

  return null;
}
