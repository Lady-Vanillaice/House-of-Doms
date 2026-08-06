"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import "./tribute.css";

type Role = "dom" | "sub";
type TributeStatus = "requested" | "accepted" | "paid" | "declined" | "cancelled";
type Tribute = { id:number; amount:number; note:string; created:string; status:TributeStatus };

const initial: Tribute[] = [
  { id:1, amount:25, note:"Freiwilliger Abend-Tribut", created:"Heute · 20:15", status:"paid" },
  { id:2, amount:15, note:"Kleine Aufmerksamkeit", created:"Heute · 22:10", status:"requested" }
];

const labels:Record<TributeStatus,string>={requested:"Angefragt",accepted:"Angenommen",paid:"Bezahlt",declined:"Abgelehnt",cancelled:"Storniert"};

export default function TributePage(){
  const [role,setRole]=useState<Role>("dom");
  const [budget,setBudget]=useState(100);
  const [paused,setPaused]=useState(false);
  const [amount,setAmount]=useState(10);
  const [note,setNote]=useState("");
  const [tributes,setTributes]=useState(initial);
  const paid=useMemo(()=>tributes.filter(t=>t.status==="paid").reduce((sum,t)=>sum+t.amount,0),[tributes]);
  const remaining=Math.max(0,budget-paid);
  const request=(e:FormEvent)=>{e.preventDefault(); if(paused||amount<=0||amount>remaining)return; setTributes(v=>[{id:Date.now(),amount,note:note.trim()||"Freiwilliger Tribut",created:"Gerade eben",status:"requested"},...v]); setNote("");};
  const update=(id:number,status:TributeStatus)=>setTributes(v=>v.map(t=>t.id===id?{...t,status}:t));

  return <main className="tributePage">
    <header className="tributeHero"><div><Link href="/">← Zurück ins House</Link><span className="eyebrow">FREIWILLIGE FINANZIELLE DYNAMIK</span><h1>Tribute</h1><p>Ein eigener Bereich für einvernehmliche Finanzdominanz. Jede Zahlung bleibt freiwillig, innerhalb eines selbst gesetzten Budgets und kann vor der Zahlung abgelehnt werden.</p></div><div className="roleSwitch"><button className={role==="dom"?"active":""} onClick={()=>setRole("dom")}>Dom / Domina</button><button className={role==="sub"?"active":""} onClick={()=>setRole("sub")}>Zahlsklave / Sub</button></div></header>

    <section className="safetyStrip"><strong>Schutzregeln</strong><span>Kein Kredit · keine Schulden · kein Druck · keine Strafen bei Ablehnung · jederzeit pausierbar</span></section>

    <section className="tributeStats"><article><span>Monatslimit</span><strong>{budget.toFixed(2)} €</strong></article><article><span>Bereits bestätigt</span><strong>{paid.toFixed(2)} €</strong></article><article><span>Noch verfügbar</span><strong>{remaining.toFixed(2)} €</strong></article><article><span>Status</span><strong>{paused?"PAUSIERT":"AKTIV"}</strong></article></section>

    <section className="tributeGrid">
      <div className="tributePanel"><span className="eyebrow">VEREINBARUNG</span><h2>Budget & Grenzen</h2><label>Freiwilliges Monatslimit<input type="number" min="0" step="5" value={budget} onChange={e=>setBudget(Math.max(0,Number(e.target.value)))}/></label><p>Das Limit wird vom zahlenden Mitglied festgelegt. Eine Anfrage oberhalb des verbleibenden Budgets kann nicht erstellt werden.</p><button className={paused?"resume":"pause"} onClick={()=>setPaused(!paused)}>{paused?"Dynamik fortsetzen":"Zahlungen pausieren"}</button></div>

      {role==="dom"?<form className="tributePanel" onSubmit={request}><span className="eyebrow">TRIBUT-ANFRAGE</span><h2>Tribut anfragen</h2><label>Betrag<input type="number" min="1" step="1" max={remaining} value={amount} onChange={e=>setAmount(Number(e.target.value))}/></label><label>Nachricht<textarea rows={5} value={note} onChange={e=>setNote(e.target.value)} placeholder="Kurze, freiwillige Anfrage …"/></label><small>Die Anfrage ist keine Forderung. Der Sub bestätigt oder lehnt selbst ab.</small><button className="primary" disabled={paused||amount>remaining}>Anfrage senden</button></form>:<div className="tributePanel"><span className="eyebrow">MEINE ENTSCHEIDUNG</span><h2>Offene Anfragen</h2>{tributes.filter(t=>t.status==="requested").map(t=><article className="requestCard" key={t.id}><div><strong>{t.amount.toFixed(2)} €</strong><span>{t.note}</span></div><div className="requestActions"><button onClick={()=>update(t.id,"declined")}>Ablehnen</button><button className="primary" onClick={()=>update(t.id,"accepted")}>Freiwillig annehmen</button></div></article>)}{!tributes.some(t=>t.status==="requested")&&<p>Keine offenen Anfragen.</p>}</div>}
    </section>

    <section className="tributePanel history"><div className="historyHead"><div><span className="eyebrow">VERLAUF</span><h2>Tribute & Quittungen</h2></div><span>Zahlungsanbieter wird später angebunden</span></div>{tributes.map(t=><article className="historyRow" key={t.id}><div><strong>{t.amount.toFixed(2)} €</strong><span>{t.note}</span><small>{t.created}</small></div><div className="statusFlow"><span className={`status ${t.status}`}>{labels[t.status]}</span>{role==="sub"&&t.status==="accepted"&&<button className="primary" onClick={()=>update(t.id,"paid")}>Zur Zahlung</button>}{role==="dom"&&t.status==="requested"&&<button onClick={()=>update(t.id,"cancelled")}>Anfrage zurückziehen</button>}</div></article>)}</section>
  </main>;
}
