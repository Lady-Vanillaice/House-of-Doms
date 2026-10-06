"use client";
import Link from "next/link";
import {FormEvent,Suspense,useEffect,useState} from "react";
import {useSearchParams} from "next/navigation";
import {createClient} from "../../lib/supabase/client";
import "../management.css";

function ReportForm(){
 const q=useSearchParams();const[type,setType]=useState(q.get("type")||"profile"),[target,setTarget]=useState(q.get("id")||""),[reason,setReason]=useState(""),[details,setDetails]=useState(""),[msg,setMsg]=useState(""),[saving,setSaving]=useState(false);
 useEffect(()=>{void (async()=>{const s=createClient();const{data}=await s.auth.getUser();if(!data.user)location.href="/anmelden?next="+encodeURIComponent(location.pathname+location.search)})()},[]);
 async function submit(e:FormEvent){e.preventDefault();setSaving(true);setMsg("");const s=createClient();const{error}=await s.rpc("submit_platform_report",{p_target_type:type,p_target_id:target,p_reason:reason,p_details:details});setSaving(false);if(error){setMsg(error.message);return}setMsg("Danke. Deine Meldung wurde an die Plattform-Moderation übergeben.");setReason("");setDetails("")}
 return <main className="managementPage"><header className="managementHero"><div><Link href="/hub" className="backLink">← Mein Bereich</Link><span className="eyebrow">HOUSE OF DOMS · SAFETY</span><h1>Inhalt oder Profil melden</h1><p>Melde Inhalte, Profile, Nachrichten oder Sessions, die gegen Regeln, Consent oder Sicherheit verstoßen könnten.</p></div></header><section className="detailPanel" style={{maxWidth:760,margin:"0 auto"}}><form onSubmit={submit} style={{display:"grid",gap:16}}><label className="field">Typ<select value={type} onChange={e=>setType(e.target.value)}><option value="profile">Profil</option><option value="content">Content</option><option value="message">Nachricht</option><option value="session">Session</option></select></label><label className="field">Referenz<input value={target} onChange={e=>setTarget(e.target.value)} required placeholder="ID oder Referenz"/></label><label className="field">Grund<input value={reason} onChange={e=>setReason(e.target.value)} required placeholder="z. B. unerlaubter Inhalt, Belästigung, Fake-Profil"/></label><label className="field">Details<textarea rows={7} value={details} onChange={e=>setDetails(e.target.value)} placeholder="Beschreibe kurz, was geprüft werden soll."/></label><button className="primaryAction" disabled={saving}>{saving?"Wird gesendet …":"MELDUNG SENDEN"}</button>{msg&&<p className="notice">{msg}</p>}</form></section></main>
}
export default function ReportPage(){return <Suspense fallback={<main className="managementPage"><p className="notice">Wird geladen …</p></main>}><ReportForm/></Suspense>}
