"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../lib/supabase/client";
import "./members.css";

type Member={
 user_id:string;display_name:string;role:string;joined_at:string;
 open_tasks:number;approved_tasks:number;submitted_tasks:number;
 confirmed_bookings:number;active_chastity:boolean;last_message_at:string|null;
};

export default function MembersPage(){
 const [rows,setRows]=useState<Member[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(""),[q,setQ]=useState("");
 useEffect(()=>{let alive=true;(async()=>{const s=createClient();const {data:auth}=await s.auth.getUser();if(!auth.user){location.href="/anmelden";return}const {data,error}=await s.rpc("get_house_member_dossiers");if(!alive)return;if(error)setError(error.message);else setRows((data||[]) as Member[]);setLoading(false)})();return()=>{alive=false}},[]);
 const filtered=useMemo(()=>rows.filter(x=>x.display_name?.toLowerCase().includes(q.toLowerCase())),[rows,q]);
 return <main className="membersPage">
   <header className="membersHero"><div><Link href="/house">← House-Zentrale</Link><span>DOM / DOMINA · PRIVATE AKTEN</span><h1>Sub-Akten</h1><p>Alle aktiven House-Mitglieder mit Aufgaben, Sessions, Check-ins und privatem Verlauf an einem Ort.</p></div><div className="membersSeal">◎</div></header>
   <section className="memberToolbar"><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Mitglied suchen …"/><Link href="/bewerbungen">+ Neue Verbindung</Link></section>
   {error&&<p className="membersError">Supabase: {error}</p>}
   {loading?<section className="membersEmpty">Sub-Akten werden geladen …</section>:filtered.length===0?<section className="membersEmpty">Noch keine aktiven House-Mitglieder.</section>:<section className="memberGrid">{filtered.map(m=><Link href={`/sub-akte/${m.user_id}`} className="memberCard" key={m.user_id}>
      <div className="memberTop"><div className="memberAvatar">{(m.display_name||"?").slice(0,2).toUpperCase()}</div><div><span>{m.role}</span><h2>{m.display_name||"House-Mitglied"}</h2><small>Seit {new Date(m.joined_at).toLocaleDateString("de-DE")}</small></div><b>→</b></div>
      <div className="memberStats"><div><strong>{m.open_tasks}</strong><span>offen</span></div><div><strong>{m.submitted_tasks}</strong><span>zu prüfen</span></div><div><strong>{m.approved_tasks}</strong><span>erledigt</span></div><div><strong>{m.confirmed_bookings}</strong><span>Sessions</span></div></div>
      <div className="memberFlags"><span className={m.active_chastity?"active":""}>◇ {m.active_chastity?"Keusch aktiv":"Kein aktiver Zeitraum"}</span><span>✦ {m.last_message_at?`Letzter Chat ${new Date(m.last_message_at).toLocaleDateString("de-DE")}`:"Noch kein Chat"}</span></div>
    </Link>)}</section>}
 </main>
}
