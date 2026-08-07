"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";

type Metrics = {
  member_count:number; unread_messages:number; open_tasks:number; submitted_tasks:number;
  upcoming_bookings:number; active_chastity:number; month_income_cents:number;
  pending_applications:number; unread_inquiries:number;
};

export default function DomLiveMetrics(){
  const [data,setData]=useState<Metrics|null>(null);
  useEffect(()=>{let alive=true;(async()=>{const s=createClient();const {data,error}=await s.rpc("get_dom_dashboard_metrics");if(!error&&alive){const row=Array.isArray(data)?data[0]:data;setData(row as Metrics)}})();return()=>{alive=false}},[]);
  if(!data)return null;
  const cards=[
    ["Mitglieder",data.member_count,"/mitglieder"],
    ["Ungelesen",data.unread_messages,"/kammer"],
    ["Offene Aufgaben",data.open_tasks,"/aufgaben"],
    ["Zu prüfen",data.submitted_tasks,"/aufgaben"],
    ["Sessions",data.upcoming_bookings,"/kalender"],
    ["Keusch aktiv",data.active_chastity,"/keuschhaltung"],
    ["Bewerbungen",data.pending_applications,"/bewerbungen"],
    ["Homepage-Anfragen",data.unread_inquiries,"/homepage-builder"]
  ] as const;
  return <section style={{maxWidth:1440,margin:"0 auto 24px",padding:"0 18px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"end",gap:16,marginBottom:12}}>
      <div><span className="commandEyebrow">LIVE AUS DEINEM HOUSE</span><h2 style={{margin:"6px 0 0",fontSize:"clamp(24px,3vw,38px)"}}>Command Center</h2></div>
      <Link href="/kassenbuch" style={{color:"#d6b56a",textDecoration:"none",fontWeight:700}}>Monat: {(data.month_income_cents/100).toLocaleString("de-DE",{style:"currency",currency:"EUR"})} →</Link>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10}}>
      {cards.map(([label,value,href])=><Link key={label} href={href} style={{textDecoration:"none",color:"inherit",border:"1px solid rgba(214,181,106,.22)",background:"linear-gradient(145deg,rgba(31,23,35,.94),rgba(12,10,15,.98))",borderRadius:14,padding:"16px 15px",boxShadow:"0 16px 40px rgba(0,0,0,.18)"}}><span style={{display:"block",opacity:.6,fontSize:11,letterSpacing:".12em",textTransform:"uppercase"}}>{label}</span><strong style={{display:"block",fontSize:30,marginTop:7,color:"#e4c77e"}}>{value}</strong></Link>)}
    </div>
  </section>;
}
