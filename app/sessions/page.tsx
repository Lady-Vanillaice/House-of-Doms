"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import "../management.css";

type Role = "dom" | "sub";
type Status = "requested" | "confirmed" | "completed" | "cancelled" | "declined";
type Session = { id:number; sub:string; dom:string; date:string; from:string; to:string; studio:string; status:Status; note:string; internalNote:string };

const initial: Session[] = [
  { id:1, sub:"Johnny", dom:"Lady Vanillaice", date:"2026-08-10", from:"12:00", to:"13:00", studio:"Studio Obsidian", status:"requested", note:"Fokus auf klare Struktur und Nachbesprechung.", internalNote:"" },
  { id:2, sub:"Alex", dom:"Lady Vanillaice", date:"2026-08-12", from:"18:00", to:"19:30", studio:"Private Suite", status:"confirmed", note:"Erste gemeinsame Session.", internalNote:"Check-in 15 Minuten vorher." }
];

const labels: Record<Status,string> = { requested:"Angefragt", confirmed:"Bestätigt", completed:"Abgeschlossen", cancelled:"Storniert", declined:"Abgelehnt" };

export default function SessionsPage(){
  const [role,setRole]=useState<Role>("dom");
  const [sessions,setSessions]=useState(initial);
  const [selected,setSelected]=useState(1);
  const current=sessions.find(s=>s.id===selected) ?? sessions[0];
  const visible=useMemo(()=>role==="dom"?sessions:sessions.filter(s=>s.sub==="Johnny"),[role,sessions]);
  const update=(patch:Partial<Session>)=>setSessions(list=>list.map(s=>s.id===current.id?{...s,...patch}:s));
  return <main className="managementPage">
    <header className="managementHero"><div><Link href="/" className="backLink">← Zurück ins House</Link><span className="eyebrow">HOUSE OF DOMS</span><h1>Session-Verwaltung</h1><p>Doms verwalten Buchungsanfragen und Sessions. Subs sehen ausschließlich ihre eigenen Termine und Statusänderungen.</p></div><div className="roleSwitch"><button className={role==="dom"?"active":""} onClick={()=>setRole("dom")}>Dom / Domina</button><button className={role==="sub"?"active":""} onClick={()=>setRole("sub")}>Sub / Sklave</button></div></header>
    <section className="statsRow"><article><span>Anfragen</span><strong>{visible.filter(s=>s.status==="requested").length}</strong></article><article><span>Bestätigt</span><strong>{visible.filter(s=>s.status==="confirmed").length}</strong></article><article><span>Abgeschlossen</span><strong>{visible.filter(s=>s.status==="completed").length}</strong></article></section>
    <section className="managementGrid"><aside className="listPanel"><h2>{role==="dom"?"Alle Sessions":"Meine Sessions"}</h2>{visible.map(s=><button key={s.id} className={selected===s.id?"selected":""} onClick={()=>setSelected(s.id)}><div><strong>{s.date} · {s.from}</strong><span>{role==="dom"?s.sub:s.dom}</span></div><em className={`status ${s.status}`}>{labels[s.status]}</em></button>)}</aside>
    <article className="detailPanel"><div className="detailHeader"><div><span className="eyebrow">{current.date}</span><h2>{current.from}–{current.to}</h2><p>{current.studio}</p></div><em className={`status ${current.status}`}>{labels[current.status]}</em></div><dl><div><dt>Sub / Sklave</dt><dd>{current.sub}</dd></div><div><dt>Dom / Domina</dt><dd>{current.dom}</dd></div><div><dt>Buchungsnotiz</dt><dd>{current.note}</dd></div></dl>
    {role==="dom"?<><label className="field">Interne Notiz<textarea rows={4} value={current.internalNote} onChange={e=>update({internalNote:e.target.value})}/></label><div className="actionBar"><button onClick={()=>update({status:"confirmed"})}>Bestätigen</button><button onClick={()=>update({status:"declined"})}>Ablehnen</button><button onClick={()=>update({status:"completed"})}>Abschließen</button><button onClick={()=>update({status:"cancelled"})}>Stornieren</button></div><div className="reschedule"><label>Datum<input type="date" value={current.date} onChange={e=>update({date:e.target.value})}/></label><label>Von<input type="time" value={current.from} onChange={e=>update({from:e.target.value})}/></label><label>Bis<input type="time" value={current.to} onChange={e=>update({to:e.target.value})}/></label></div></>:<p className="notice">Statusänderungen und Verschiebungen werden dir im Benachrichtigungszentrum angezeigt.</p>}
    </article></section>
  </main>;
}
