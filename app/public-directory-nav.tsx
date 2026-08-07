"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import "./public-directory-nav.css";

export default function PublicDirectoryNav() {
  const pathname = usePathname();
  return (
    <nav className="publicDirectoryNav" aria-label="Plattformbereiche">
      <Link className={`discoverSpotlight ${pathname.startsWith("/discover") ? "active" : ""}`} href="/discover"><b>✦</b><span>DISCOVER</span><small>Doms & Subs finden</small></Link>
      <div className="publicDirectoryLinks">
        <Link className={pathname.startsWith("/studios") ? "active" : ""} href="/studios">Studios</Link>
        <Link className={pathname.startsWith("/houses") ? "active" : ""} href="/houses">Houses</Link>
        <Link className={pathname.startsWith("/store") ? "active" : ""} href="/store">Store</Link>
        <Link className={pathname.startsWith("/tribute") ? "active" : ""} href="/tribute">Tribute</Link>
        <Link className={pathname.startsWith("/kammer") ? "active" : ""} href="/kammer">Kammer</Link>
        <Link className={pathname.startsWith("/profil") ? "active" : ""} href="/profil">Profil</Link>
      </div>
    </nav>
  );
}
