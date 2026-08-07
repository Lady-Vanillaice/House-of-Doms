"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "../../lib/supabase/client";
import "./keuschhaltung.css";

type Member={user_id:string;display_name:string;role:string};
type RecordRow={id:string;house_id:string;dom_id:string;sub_id:string;counterpart_name:string;device_label:string;cage_type:string|null;material:string|null;started_at:string;planned_review_at:string|null;planned_end_at:string|null;ended_at:string|null;status:string;notes:string|null;end_reason:string|null;emergency_release_available:boolean;checkin_interval_hours:number|null;hygiene_break_notes:string|null;agreed_rules:string|null};
type Checkin={id:string;submitted_by:string;submitter_name:string;comfort_status:string;note:string|null;created_at:string};

const fmt=(v?:string|null)=>v?new Intl.DateTimeFormat("de-DE",{dateStyle:"medium",timeStyle:"short"}).format(new Date(v)):"—";
const elapsed=(start:string,end?:string|null)=>{const ms=(end?new Date(end):new Date()).getTime()-new Date(start).getTime();const d=Math.max(0,Math.floor(ms/86400000));const h=Math.max(0,Math.floor((ms%86400000)/3600000));return d>0?`${d} Tage ${h} Std.`:`${h} Std.`};

export default function ChastityPage(){
 const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(false); const [message,setMessage]=useState("");
 const [role,setRole]=useState(""); const [members,setMembers]=useState<Member[]>([]); const [records,setRecords]=useState<RecordRow[]>([]);
 const [checkins,setCheckins]=useState<Record<string,Checkin[]>>({}); const [selectedSub,setSelectedSub]=useState("");
 const [device,setDevice]=useState("Keuschheitskäfig"); const [cageType,setCageType]=useState("Standardkäfig"); const [material,setMaterial]=useState("");
 const [reviewAt,setReviewAt]=useState(""); const [plannedEndAt,setPlannedEndAt]=useState(""); const [checkinHours,setCheckinHours]=useState("24");
 const [hygieneNotes,setHygieneNotes]=useState(""); const [rules,setRules]=useState(""); const [notes,setNotes]=useState(""); const [checkinNote,setCheckinNote]=useState<Record<string,string>>({});
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
   for(const r of rows){const {data:c,error:ce}=await supabase.rpc("get_chastity_checkins",{p_record_id:r.id});if(ce)throw ce;map[r.id]=(c||[]) as Checkin[];}
   setCheckins(map);
  }catch(e:any){setMessage(`Supabase: ${e?.message||"Unbekannter Fehler"}`);}finally{setLoading(false);}
 },[]);
 useEffect(()=>{void load();},[load]);

 const activeCount=useMemo(()=>records.filter(r=>r.status==="active").length,[records]);
 async function start(e:FormEvent){
  e.preventDefault(); if(!selectedSub){setMessage("Bitte ein House-Mitglied wählen.");return;} setSaving(true); setMessage(""); const supabase=createClient();
  const {error}=await supabase.rpc("start_chastity_record",{
   p_sub_id:selectedSub,p_device_label:device.trim(),p_planned_review_at:reviewAt?new Date(reviewAt).toISOString():null,p_notes:notes.trim()||null,
   p_cage_type:cageType.trim()||null,p_material:material.trim()||null,p_planned_end_at:plannedEndAt?new Date(plannedEndAt).toISOString():null,
   p_checkin_interval_hours:checkinHours?Number(checkinHours):null,p_hygiene_break_notes:hygieneNotes.trim()||null,p_agreed_rules:rules.trim()||null
  });
  setSaving(false); if(error){setMessage(`Supabase: ${error.message}`);return;} setNotes("");setRules("");setHygieneNotes("");setReviewAt("");setPlannedEndAt("");setMessage("Keuschhaltungs-Zeitraum gestartet.");await load();
 }
 async function checkin(id:string,status:"okay"|"discomfort"|"emergency"){setSaving(true);setMessage("");const supabase=createClient();const {error}=await supabase.rpc("submit_chastity_checkin",{p_record_id:id,p_comfort_status:status,p_note:checkinNote[id]?.trim()||null});setSaving(false);if(error){setMessage(`Supabase: ${error.message}`);return;}setCheckinNote(v=>({...v,[id]:""}));setMessage(status==="emergency"?"Der Zeitraum wurde sofort beendet.":"Check-in gespeichert.");await load();}
 async function end(id:string){setSaving(true);setMessage("");const supabase=createClient();const {error}=await supabase.rpc("end_chastity_record",{p_record_id:id,p_reason:"Einvernehmlich beendet"});setSaving(false);if(error){setMessage(`Supabase: ${error.message}`);return;}setMessage("Keuschhaltungs-Zeitraum beendet.");await load();}

 return <main className="chastityPage">
  <header><div><Link href="/">← Zurück ins House</Link><span className="eyebrow">PRIVATE DYNAMIK</span><h1>Keuschhaltung</h1><p>Ausführliche, einvernehmliche Dokumentation von Käfig, Zeitraum, Regeln, Check-ins, Hygiene-/Pausenvereinbarungen und Status.</p></div><div className="chastityBadge">{isDom?"Dom / Domina":"Sub / Sklave"}</div></header>
  {message&&<div className="chastityMessage">{message}</div>}
  <section className="stats"><article><span>Aktiv</span><strong>{activeCount}</strong></article><article><span>Gesamt</span><strong>{records.length}</strong></article><article><span>Sicherheitsregel</span><strong className="smallStat">Jederzeit beendbar</strong></article></section>
  {loading?<section className="chastityPanel">Wird geladen …</section>:<div className="chastityGrid">
   {isDom&&<form className="chastityPanel setupPanel" onSubmit={start}><span className="eyebrow">NEUER ZEITRAUM</span><h2>Vereinbarung anlegen</h2>
    <label>Sub / Sklave<select value={selectedSub} onChange={e=>setSelectedSub(e.target.value)}><option value="">House-Mitglied wählen</option>{members.map(m=><option key={m.user_id} value={m.user_id}>{m.display_name} · {m.role}</option>)}</select></label>
    <div className="fieldGrid"><label>Gerätename<input value={device} onChange={e=>setDevice(e.target.value)}/></label><label>Käfig-Typ<select value={cageType} onChange={e=>setCageType(e.target.value)}><option>Standardkäfig</option><option>Kurzkäfig</option><option>Flat / flach</option><option>Gürtel</option><option>Sonstiges</option></select></label></div>
    <label>Material / Modell<input value={material} onChange={e=>setMaterial(e.target.value)} placeholder="z. B. Edelstahl, Kunststoff, Modellname"/></label>
    <div className="fieldGrid"><label>Nächster Review<input type="datetime-local" value={reviewAt} onChange={e=>setReviewAt(e.target.value)}/></label><label>Geplantes Ende<input type="datetime-local" value={plannedEndAt} onChange={e=>setPlannedEndAt(e.target.value)}/></label></div>
    <label>Check-in-Rhythmus<select value={checkinHours} onChange={e=>setCheckinHours(e.target.value)}><option value="6">alle 6 Stunden</option><option value="12">alle 12 Stunden</option><option value="24">täglich</option><option value="48">alle 2 Tage</option><option value="72">alle 3 Tage</option><option value="168">wöchentlich</option></select></label>
    <label>Hygiene / vereinbarte Pausen<textarea rows={4} value={hygieneNotes} onChange={e=>setHygieneNotes(e.target.value)} placeholder="z. B. vereinbarte Reinigungs- oder Pausenzeiten"/></label>
    <label>Regeln & Vereinbarungen<textarea rows={5} value={rules} onChange={e=>setRules(e.target.value)} placeholder="Was wurde freiwillig vereinbart? Welche Ausnahmen gelten?"/></label>
    <label>Private Notiz<textarea rows={4} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Zusätzliche Notizen …"/></label>
    <div className="safetyNote">Keine Schlüssel-, Schloss- oder Entriegelungscodes werden gespeichert. Beschwerden oder ein Notfall können jederzeit gemeldet werden; der Zeitraum kann jederzeit beendet werden.</div>
    <button className="chastityPrimary" disabled={saving||!members.length}>{saving?"Speichert …":"Zeitraum starten"}</button>
   </form>}
   <section className="chastityPanel recordsPanel"><span className="eyebrow">ÜBERSICHT</span><h2>{isDom?"Meine Vereinbarungen":"Mein Status"}</h2>{records.length===0&&<p>Noch kein Keuschhaltungs-Zeitraum vorhanden.</p>}{records.map(r=><article className={`chastityRecord ${r.status}`} key={r.id}>
    <div className="recordHead"><div><strong>{r.counterpart_name}</strong><span>{r.device_label}{r.cage_type?` · ${r.cage_type}`:""}</span></div><em>{r.status==="active"?"AKTIV":r.status==="paused"?"PAUSIERT":"BEENDET"}</em></div>
    <div className="durationCard"><span>Laufzeit</span><strong>{elapsed(r.started_at,r.ended_at)}</strong></div>
    <div className="detailGrid"><div><span>Material / Modell</span><strong>{r.material||"—"}</strong></div><div><span>Start</span><strong>{fmt(r.started_at)}</strong></div><div><span>Nächster Review</span><strong>{fmt(r.planned_review_at)}</strong></div><div><span>Geplantes Ende</span><strong>{fmt(r.planned_end_at)}</strong></div><div><span>Check-in</span><strong>{r.checkin_interval_hours?`alle ${r.checkin_interval_hours} Std.`:"—"}</strong></div><div><span>Notfallfreigabe</span><strong>{r.emergency_release_available?"Ja":"—"}</strong></div></div>
    {r.agreed_rules&&<div className="infoBlock"><span>Regeln & Vereinbarungen</span><p>{r.agreed_rules}</p></div>}
    {r.hygiene_break_notes&&<div className="infoBlock"><span>Hygiene / Pausen</span><p>{r.hygiene_break_notes}</p></div>}
    {r.notes&&<div className="infoBlock"><span>Notiz</span><p>{r.notes}</p></div>}{r.end_reason&&<p className="endReason">{r.end_reason}</p>}
    {r.status==="active"&&<div className="checkinBox"><h3>Check-in</h3><textarea rows={3} placeholder="Wie ist der aktuelle Zustand? Optional Notiz ergänzen …" value={checkinNote[r.id]||""} onChange={e=>setCheckinNote(v=>({...v,[r.id]:e.target.value}))}/><div className="checkinActions"><button type="button" disabled={saving} onClick={()=>checkin(r.id,"okay")}>✓ Alles okay</button><button type="button" disabled={saving} onClick={()=>checkin(r.id,"discomfort")}>! Unbehagen melden</button><button type="button" className="emergency" disabled={saving} onClick={()=>checkin(r.id,"emergency")}>Notfall · sofort beenden</button><button type="button" disabled={saving} onClick={()=>end(r.id)}>Zeitraum beenden</button></div></div>}
    {(checkins[r.id]||[]).length>0&&<div className="history"><h3>Verlauf & Check-ins</h3>{checkins[r.id].map(c=><div key={c.id}><strong>{c.submitter_name}</strong><span>{c.comfort_status==="okay"?"Alles okay":c.comfort_status==="discomfort"?"Unbehagen":"Notfall"} · {fmt(c.created_at)}</span>{c.note&&<p>{c.note}</p>}</div>)}</div>}
   </article>)}</section>
  </div>}
 </main>;
}
