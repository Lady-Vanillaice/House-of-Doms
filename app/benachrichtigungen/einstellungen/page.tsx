"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "../../../lib/supabase/client";
import "./notifications.css";

type Pref={user_id:string;in_app_enabled:boolean;email_enabled:boolean;push_enabled:boolean;messages_enabled:boolean;tasks_enabled:boolean;bookings_enabled:boolean;chastity_enabled:boolean;tribute_enabled:boolean;quiet_hours_start:string|null;quiet_hours_end:string|null};

export default function NotificationSettings(){
 const [p,setP]=useState<Pref|null>(null),[msg,setMsg]=useState(""),[saving,setSaving]=useState(false);
 useEffect(()=>{(async()=>{const s=createClient();const {data,error}=await s.rpc("get_my_notification_preferences");if(error)setMsg(error.message);else setP(data as Pref)})()},[]);
 function flip(key:keyof Pref){if(!p||typeof p[key]!=="boolean")return;setP({...p,[key]:!p[key]} as Pref)}
 async function save(){if(!p)return;setSaving(true);const s=createClient();const {error}=await s.from("notification_preferences").upsert({...p,updated_at:new Date().toISOString()});setSaving(false);setMsg(error?error.message:"Einstellungen gespeichert.")}
 const Toggle=({k,label,desc}:{k:keyof Pref;label:string;desc:string})=><button type="button" className={`notifyToggle ${p?.[k]?"on":""}`} onClick={()=>flip(k)}><div><strong>{label}</strong><span>{desc}</span></div><i>{p?.[k]?"AN":"AUS"}</i></button>;
 return <main className="notifyPage"><header><Link href="/house">← House-Zentrale</Link><span>HOUSE OS · NOTIFICATIONS</span><h1>Benachrichtigungen</h1><p>Lege fest, was dich erreichen darf. Push ist technisch vorbereitet und wird aktiv, sobald ein Push-Anbieter verbunden ist.</p></header>{msg&&<p className="notifyMsg">{msg}</p>}{p&&<section className="notifyLayout"><div className="notifyPanel"><h2>Kanäle</h2><Toggle k="in_app_enabled" label="In-App" desc="Hinweise direkt in House of Doms"/><Toggle k="email_enabled" label="E-Mail" desc="Bereit für dein späteres @houseofdoms.de Postfach"/><Toggle k="push_enabled" label="Push" desc="Vorbereitet für iPhone/Android Push"/></div><div className="notifyPanel"><h2>Ereignisse</h2><Toggle k="messages_enabled" label="Nachrichten" desc="Neue Nachricht in der Kammer"/><Toggle k="tasks_enabled" label="Aufgaben" desc="Freigaben, Einreichungen und Entscheidungen"/><Toggle k="bookings_enabled" label="Sessions" desc="Anfragen, Bestätigungen und Änderungen"/><Toggle k="chastity_enabled" label="Keuschhaltung" desc="Check-ins und Review-Zeitpunkte"/><Toggle k="tribute_enabled" label="Tribute" desc="Neue Zahlungen und Statusänderungen"/></div><div className="notifyPanel"><h2>Ruhezeiten</h2><label>Von<input type="time" value={p.quiet_hours_start?.slice(0,5)||""} onChange={e=>setP({...p,quiet_hours_start:e.target.value||null})}/></label><label>Bis<input type="time" value={p.quiet_hours_end?.slice(0,5)||""} onChange={e=>setP({...p,quiet_hours_end:e.target.value||null})}/></label><p>Diese Zeiten werden später von E-Mail- und Push-Zustellern berücksichtigt.</p><button className="saveNotify" onClick={()=>void save()} disabled={saving}>{saving?"Speichert …":"Speichern"}</button></div></section>}</main>
}
