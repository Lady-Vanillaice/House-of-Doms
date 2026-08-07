"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import "./public-directory-nav.css";

const links=[
  ["Dashboard","/dashboard"],
  ["House","/house"],
  ["Kammer","/kammer"],
  ["Kalender","/kalender"],
  ["Discover","/discover"],
  ["Profil","/profil"]
] as const;

export default function PublicDirectoryNav(){
 const pathname=usePathname();
 if(pathname==="/") return null;
 return <nav className="publicDirectoryNav" aria-label="Hauptnavigation">
   <Link className="navBrand" href="/dashboard"><span>H</span><div><b>HOUSE OF DOMS</b><small>PRIVATE HOUSE OS</small></div></Link>
   <div className="publicDirectoryLinks">{links.map(([label,href])=><Link key={href} className={pathname.startsWith(href)?"active":""} href={href}>{label}</Link>)}</div>
 </nav>;
}
