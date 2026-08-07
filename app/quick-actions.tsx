"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import "./quick-actions.css";

const actions = [
  ["Neue Aufgabe", "/aufgaben"],
  ["Neue Nachricht", "/kammer"],
  ["Studio-Zeit", "/kalender"],
  ["Keuschhaltung", "/keuschhaltung"],
  ["Tribute", "/tribute"],
  ["Homepage", "/homepage-builder"],
  ["Growth & Business", "/growth"],
  ["Events", "/events"],
  ["Safety Guide", "/safety"]
] as const;

export default function QuickActions(){
  const pathname=usePathname();
  const [open,setOpen]=useState(false);
  if(pathname==="/") return null;
  return <div className={`quickActions ${open?"open":""}`}>
    {open&&<div className="quickActionMenu" role="menu"><span>SCHNELLAKTIONEN</span>{actions.map(([label,href])=><Link key={href} href={href} onClick={()=>setOpen(false)}>{label}<b>→</b></Link>)}</div>}
    <button className="quickActionTrigger" onClick={()=>setOpen(v=>!v)} aria-label="Schnellaktionen öffnen" aria-expanded={open}>{open?"×":"+"}</button>
  </div>;
}
