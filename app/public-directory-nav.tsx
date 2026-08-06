"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import "./public-directory-nav.css";

export default function PublicDirectoryNav() {
  const pathname = usePathname();
  return (
    <nav className="publicDirectoryNav" aria-label="Öffentliche Bereiche">
      <span>ENTDECKEN</span>
      <Link className={pathname.startsWith("/discover") ? "active" : ""} href="/discover">Discover</Link>
      <Link className={pathname.startsWith("/studios") ? "active" : ""} href="/studios">Studios</Link>
      <Link className={pathname.startsWith("/houses") ? "active" : ""} href="/houses">Houses</Link>
    </nav>
  );
}
