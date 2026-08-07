"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "../../../lib/supabase/client";
import "./dossier.css";

type Dossier={user_id:string;display_name:string;role:string;joined_at:string;task_total:number;task_approved:number;task_submitted:number;booking_total:number;active_chastity_id:string|null;chastity_started_at:string|null;last_checkin_at:string|null;notes_count:number};
type Note={id:string;category:string;body:string;pinned:boolean;created_at:string};
type Task={id:string;title:string;status:string;release_at:string;due_at:string|null;priority:string;points:number};
type Booking={id:string;status:string;starts_at:string|null;ends_at:string|null;requested_at:string};

export default function DossierPage(){
 const params=useParams<{id:string}>(),memberId=params.id;
 const [d,setD]=useState<Dossier|null>(null),[notes,setNotes]=useState<Note[]>([]),[tasks,setTasks]=useState<Task[]>([]),[bookings,setBookings]=useState<Booking[]>([]),[loading,setLoading]=useState(true),[err,setErr]=useState("");
 const [body,setBody]=useState(""),[category,setCategory]=useState("general"),[pinned,setPinned]=useState(false),[saving,setSaving]=useState(false);
 const load=useCallback(async()=>{const s=createClient();const [{data:dr,error:de},{data:nr},{data:tr},{data:br}]=await Promise.all([
   s.rpc("get_member_dossier",{p_member_id:memberId}),
   s.rpc("get_member_notes",{p_member_id:memberId}),
   s.from("tasks").select("id,title,status,release_at,due_at,priority,points").eq("assigned_to",memberId).order("created_at",{ascending:false}).limit(20),
   s.from("slot_bookings").select("id,status,starts_at,ends_at,requested_at").eq("requester_id",memberId).order("requested_at",{ascending:false}).limit(20)
 ]);if(de){setErr(de.message);setLoading(false);return}setD((Array.isArray(dr)?dr[0]:dr) as Dossier);setNotes((nr||[]) as Note[]);setTasks((tr||[]) as Task[]);setBookings((br||[]) as Booking[]);setLoading(false)},[memberId]);
 useEffect(()=>{void load()},[load]);
 async function addNote(e:FormEvent){e.preventDefault();if(!body.trim())return;setSaving(true);const s=createClient();const {error}=await s.rpc("add_member_note",{p_member_id:memberId,p_body:body,p_category:category,p_pinned:pinned});setSaving(false);if(error){setErr(error.message);return}setBody("");setPinned(false);await load()}
 if(loading)return <main className="dossierPage"><p>Lade Sub-Akte …</p></main>;
 if(!d)return <main className="dossierPage"><Link href="/mitglieder">← Mitglieder</Link><p>{err||"Akte nicht gefunden."}</p></main>;
 const since=d.chastity_started_at?Math.max(0,Math.floor((Date.now()-new Date(d.chastity_started_at).getTime())/86400000)):0;
 return <main className="dossierPage">
   <header className="dossierHero"><div><Link href="/mitglieder">← Alle Sub-Akten</Link><span>PRIVATE DOMINA-AKTE</span><h1>{d.display_name}</h1><p>{d.role.toUpperCase()} · im House seit {new Date(d.joined_at).toLocaleDateString("de-DE")}</p></div><div className="dossierActions"><Link href={`/kammer?contact=${d.user_id}`}>✦ Nachricht</Link><Link href="/aufgaben">+ Aufgabe</Link><Link href="/kalender">◷ Session</Link></div></header>
   {err&&<p className="dossierError">{err}</p>}
   <section className="dossierStats"><article><span>Aufgaben gesamt</span><strong>{d.task_total}</strong></article><article><span>Erledigt</span><strong>{d.task_approved}</strong></article><article><span>Zu prüfen</span><strong>{d.task_submitted}</strong></article><article><span>Sessions</span><strong>{d.booking_total}</strong></article><article className={d.active_chastity_id?"hot":""}><span>Keuschhaltung</span><strong>{d.active_chastity_id?`${since} T` : "–"}</strong></article><article><span>Private Notizen</span><strong>{d.notes_count}</strong></article></section>
   <section className="dossierLayout">
    <div className="dossierColumn">
      <section className="dossierPanel"><div className="panelTitle"><span>AUFGABENVERLAUF</span><Link href="/aufgaben">Alle →</Link></div>{tasks.length===0?<p className="empty">Noch keine Aufgaben.</p>:tasks.map(t=><article className="timelineRow" key={t.id}><div><strong>{t.title}</strong><span>{t.priority?.toUpperCase()} · {t.points||0} Punkte</span></div><div><b>{t.status}</b><small>{new Date(t.release_at).toLocaleDateString("de-DE")}{t.due_at?` → ${new Date(t.due_at).toLocaleDateString("de-DE")}`:""}</small></div></article>)}</section>
      <section className="dossierPanel"><div className="panelTitle"><span>SESSION-VERLAUF</span><Link href="/kalender">Kalender →</Link></div>{bookings.length===0?<p className="empty">Noch keine Sessions.</p>:bookings.map(b=><article className="timelineRow" key={b.id}><div><strong>{b.starts_at?b.starts_at.slice(0,5):"Session"}{b.ends_at?`–${b.ends_at.slice(0,5)}`:""}</strong><span>{new Date(b.requested_at).toLocaleDateString("de-DE")}</span></div><b>{b.status}</b></article>)}</section>
    </div>
    <aside className="dossierColumn">
      <section className={`dossierPanel chastityPanel ${d.active_chastity_id?"active":""}`}><div className="panelTitle"><span>KEUSCHHALTUNG</span><Link href="/keuschhaltung">Öffnen →</Link></div>{d.active_chastity_id?<><h2>Aktiv seit {since} Tagen</h2><p>Letzter Check-in: {d.last_checkin_at?new Date(d.last_checkin_at).toLocaleString("de-DE"):"noch keiner"}</p></>:<p className="empty">Kein aktiver Zeitraum.</p>}</section>
      <section className="dossierPanel"><div className="panelTitle"><span>PRIVATE DOMINA-NOTIZEN</span><small>Nur du siehst diese Akte.</small></div><form className="noteForm" onSubmit={addNote}><select value={category} onChange={e=>setCategory(e.target.value)}><option value="general">Allgemein</option><option value="session">Session</option><option value="task">Aufgabe</option><option value="development">Entwicklung</option><option value="boundary">Grenze/Rahmen</option><option value="admin">Admin</option></select><textarea rows={4} value={body} onChange={e=>setBody(e.target.value)} placeholder="Private Notiz …"/><label><input type="checkbox" checked={pinned} onChange={e=>setPinned(e.target.checked)}/> Oben anheften</label><button disabled={saving}>{saving?"Speichert …":"Notiz speichern"}</button></form><div className="notesList">{notes.map(n=><article key={n.id} className={n.pinned?"pinned":""}><span>{n.pinned?"◆ ":""}{n.category} · {new Date(n.created_at).toLocaleDateString("de-DE")}</span><p>{n.body}</p></article>)}</div></section>
    </aside>
   </section>
 </main>
}
