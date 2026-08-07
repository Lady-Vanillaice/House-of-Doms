"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "../../lib/supabase/client";
import "./keuschhaltung.css";

type Member={user_id:string;display_name:string;role:string};
type RecordRow={id:string;house_id:string;dom_id:string;sub_id:string;counterpart_name:string;device_label:string;started_at:string;planned_review_at:string|null;ended_at:string|null;status:string;notes:string|null;end_reason:string|null;emergency_release_available:boolean};
type Checkin={id:string;submitted_by:string;submitter_name:string;comfort_status:string;note:string|null;created_at:string};

const fmt=(v?:string|null)=>v?new Intl.DateTimeFormat("de-DE",{dateStyle:"medium",timeStyle:"short"}).format(new Date(v)):"—";

export default function ChastityPage(){
 const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(false); const [message,setMessage]=useState("");
 const [role,setRole]=useState(""); const [members,setMembers]=useState<Member[]>([]); const [records,setRecords]=useState<RecordRow[]>([]);
 const [checkins,setCheckins]=useState<Record<string,Checkin[]>>({}); const [selectedSub,setSelectedSub]=useState("");
 const [device,setDevice]=useState("Keuschheitskäfig"); const [reviewAt,setReviewAt]=useState(""); const [notes,setNotes]=useState("");
 const [checkinNote,setCheckinNote]=useState<Record<string,string>>({});
 const isDom=role==="dom"||role==="domina";

 const load=useCallback(async()=>{
  setLoading(true); setMessage("");
  try{
   const supabase=createClient(); const {data:auth}=await supabase.auth.getUser();
   if(!auth.user){window.location.href="/anmelden";return;}
   const nextRole=String(auth.user.user_metadata?.role||"sub").toLowerCase(); setRole(nextRole);
   const {data,error}=await supabase.rpc("get_my_chastity_records"); if(error) throw error;
   const rows=(data||[]) as RecordRow[]; setRecords(rows);
   if(nextRole==="dom"||nextRole==="domina"){
    const {data:candidates,error:e}=await supabase.rpc("get_house_task_candidates"); if(e) throw e;
    const list=(candidates||[]) as Member[]; setMembers(list); setSelectedSub(v=>v||list[0]?.user_id||"");
   }
   const map:Record<string,Checkin[]>={};
   for(const r of rows){ const {data:c,error:ce}=await supabase.rpc("get_chastity_checkins",{p_record_id:r.id}); if(ce) throw ce; map[r.id]=(c||[]) as Checkin[]; }
   setCheckins(map);
  }catch(e:any){setMessage(`Supabase: ${e?.message||"Unbekannter Fehler"}`);}finally{setLoading(false);}
 },[]);
 useEffect(()=>{void load();},[load]);

 const activeCount=useMemo(()=>records.filter(r=>r.status==="active").length,[records]);
 async function start(e:FormEvent){e.preventDefault(); if(!selectedSub){setMessage("Bitte ein House-Mitglied wählen.");return;} setSaving(true); setMessage(""); const supabase=createClient();
  const {error}=await supabase.rpc("start_chastity_record",{p_sub_id:selectedSub,p_device_label:device.trim(),p_planned_review_at:reviewAt?new Date(reviewAt).toISOString():null,p_notes:notes.trim()||null});
  setSaving(false); if(error){setMessage(`Supabase: ${error.message}`);return;} setNotes("");setReviewAt("");setMessage("Keuschhaltungs-Zeitraum gestartet.");await load();}
 async function checkin(id:string,status:"okay"|"discomfort"|"emergency"){setSaving(true);setMessage("");const supabase=createClient();const {error}=await supabase.rpc("submit_chastity_checkin",{p_record_id:id,p_comfort_status:status,p_note:checkinNote[id]?.trim()||null});setSaving(false);if(error){setMessage(`Supabase: ${error.message}`);return;}setCheckinNote(v=>({...v,[id]:""}));setMessage(status==="emergency"?"Der Zeitraum wurde sofort beendet.":"Check-in gespeichert.");await load();}
 async function end(id:string){setSaving(true);setMessage("");const supabase=createClient();const {error}=await supabase.rpc("end_chastity_record",{p_record_id:id,p_reason:"Einvernehmlich beendet"});setSaving(false);if(error){setMessage(`Supabase: ${error.message}`);return;}setMessage("Keuschhaltungs-Zeitraum beendet.");await load();}

 return <main className="chastityPage"><header><div><Link href="/">← Zurück ins House</Link><span className="eyebrow">PRIVATE DYNAMIK</span><h1>Keuschhaltung</h1><p>Einvernehmliche Dokumentation von Käfig-Status, Check-ins und vereinbarten Kontrollzeitpunkten.</p></div><div className="chastityBadge">{isDom?"Dom / Domina":"Sub / Sklave"}</div></header>
 {message&&<div className="chastityMessage">{message}</div>}
 <section className="stats"><article><span>Aktiv</span><strong>{activeCount}</strong></article><article><span>Gesamt</span><strong>{records.length}</strong></article><article><span>Sicherheitsregel</span><strong className="smallStat">Sofortiges Beenden möglich</strong></article></section>
 {loading?<section className="chastityPanel">Wird geladen …</section>:<div className="chastityGrid">
  {isDom&&<form className="chastityPanel" onSubmit={start}><span className="eyebrow">NEUER ZEITRAUM</span><h2>Keuschhaltung starten</h2><label>Sub / Sklave<select value={selectedSub} onChange={e=>setSelectedSub(e.target.value)}><option value="">House-Mitglied wählen</option>{members.map(m=><option key={m.user_id} value={m.user_id}>{m.display_name} · {m.role}</option>)}</select></label><label>Gerät / Bezeichnung<input value={device} onChange={e=>setDevice(e.target.value)}/></label><label>Nächster vereinbarter Review<input type="datetime-local" value={reviewAt} onChange={e=>setReviewAt(e.target.value)}/></label><label>Notiz<textarea rows={5} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Vereinbarungen, freiwillige Regeln, Check-in-Rhythmus …"/></label><div className="safetyNote">Keine Lock-Codes werden gespeichert. Beide Beteiligten können den Zeitraum jederzeit beenden; ein Notfall-Check-in beendet ihn sofort.</div><button className="chastityPrimary" disabled={saving||!members.length}>{saving?"Speichert …":"Zeitraum starten"}</button></form>}
  <section className="chastityPanel recordsPanel"><span className="eyebrow">ÜBERSICHT</span><h2>{isDom?"Meine Vereinbarungen":"Mein Status"}</h2>{records.length===0&&<p>Noch kein Keuschhaltungs-Zeitraum vorhanden.</p>}{records.map(r=><article className={`chastityRecord ${r.status}`} key={r.id}><div className="recordHead"><div><strong>{r.counterpart_name}</strong><span>{r.device_label}</span></div><em>{r.status==="active"?"AKTIV":r.status==="paused"?"PAUSIERT":"BEENDET"}</em></div><div className="recordMeta"><span>Start: {fmt(r.started_at)}</span><span>Review: {fmt(r.planned_review_at)}</span>{r.ended_at&&<span>Ende: {fmt(r.ended_at)}</span>}</div>{r.notes&&<p>{r.notes}</p>}{r.end_reason&&<p className="endReason">{r.end_reason}</p>}
   {r.status==="active"&&<div className="checkinBox"><textarea rows={3} placeholder="Check-in / Notiz …" value={checkinNote[r.id]||""} onChange={e=>setCheckinNote(v=>({...v,[r.id]:e.target.value}))}/><div className="checkinActions"><button disabled={saving} onClick={()=>checkin(r.id,"okay")}>✓ Alles okay</button><button disabled={saving} onClick={()=>checkin(r.id,"discomfort")}>! Unbehagen melden</button><button className="emergency" disabled={saving} onClick={()=>checkin(r.id,"emergency")}>Notfall · sofort beenden</button>{isDom&&<button disabled={saving} onClick={()=>end(r.id)}>Beenden</button>}</div></div>}
   {(checkins[r.id]||[]).length>0&&<div className="history"><h3>Check-ins</h3>{checkins[r.id].map(c=><div key={c.id}><strong>{c.submitter_name}</strong><span>{c.comfort_status==="okay"?"Alles okay":c.comfort_status==="discomfort"?"Unbehagen":"Notfall"} · {fmt(c.created_at)}</span>{c.note&&<p>{c.note}</p>}</div>)}</div>}
  </article>)}</section>
 </div>}
 </main>;
}
