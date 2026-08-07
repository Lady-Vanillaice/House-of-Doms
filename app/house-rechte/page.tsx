"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";
import "./rights.css";

type Person={user_id:string;display_name:string;role:string};
type Rights={house_id:string;user_id:string;can_manage_tasks:boolean;can_manage_calendar:boolean;can_manage_members:boolean;can_manage_finances:boolean;can_read_private_notes:boolean};
const keys=[
 ["can_manage_tasks","Aufgaben","Aufgaben erstellen und prüfen"],
 ["can_manage_calendar","Kalender","Studiozeiten und Sessions verwalten"],
 ["can_manage_members","Mitglieder","House-Verbindungen verwalten"],
 ["can_manage_finances","Finanzen","Kassenbuch und finanzielle Bereiche"],
 ["can_read_private_notes","Private Akten","Domina-Notizen in Sub-Akten lesen"]
] as const;

export default function HouseRights(){
 const [people,setPeople]=useState<Person[]>([]),[rights,setRights]=useState<Record<string,Rights>>({}),[houseId,setHouseId]=useState(""),[msg,setMsg]=useState("");
 useEffect(()=>{(async()=>{const s=createClient();const [{data:c,error:ce},{data:p}]=await Promise.all([s.rpc("get_task_context"),s.rpc("get_house_task_candidates")]);if(ce){setMsg(ce.message);return}const ctx=Array.isArray(c)?c[0]:c;if(!ctx?.house_id){setMsg("Nur Dom/Domina mit eigenem House kann Rechte vergeben.");return}setHouseId(ctx.house_id);setPeople((p||[]) as Person[]);const {data:r}=await s.from("house_delegate_permissions").select("*").eq("house_id",ctx.house_id);const map:Record<string,Rights>={};for(const x of r||[])map[x.user_id]=x as Rights;setRights(map)})()},[]);
 function current(id:string):Rights{return rights[id]||{house_id:houseId,user_id:id,can_manage_tasks:false,can_manage_calendar:false,can_manage_members:false,can_manage_finances:false,can_read_private_notes:false}}
 async function toggle(id:string,key:typeof keys[number][0]){if(!houseId)return;const next={...current(id),[key]:!current(id)[key]};setRights({...rights,[id]:next});const s=createClient();const {error}=await s.from("house_delegate_permissions").upsert({...next,updated_at:new Date().toISOString()});setMsg(error?error.message:"Rechte gespeichert.")}
 return <main className="rightsPage"><header><Link href="/house">← House-Zentrale</Link><span>DOM / DOMINA · BERECHTIGUNGEN</span><h1>Rechte & Rollen</h1><p>Du bleibst Eigentümerin des Houses. Hier kannst du einzelnen House-Mitgliedern gezielt Verwaltungsrechte geben, statt pauschal alles freizuschalten.</p></header>{msg&&<p className="rightsMsg">{msg}</p>}<section className="rightsGrid">{people.length===0?<article className="rightsEmpty">Noch keine aktiven Mitglieder, denen Rechte gegeben werden können.</article>:people.map(person=><article className="rightsCard" key={person.user_id}><div className="rightsHead"><div className="avatar">{person.display_name.slice(0,2).toUpperCase()}</div><div><span>{person.role}</span><h2>{person.display_name}</h2></div></div><div className="rightToggles">{keys.map(([key,label,desc])=><button type="button" key={key} className={current(person.user_id)[key]?"on":""} onClick={()=>void toggle(person.user_id,key)}><div><strong>{label}</strong><span>{desc}</span></div><b>{current(person.user_id)[key]?"AN":"AUS"}</b></button>)}</div></article>)}</section><section className="rightsWarning"><strong>Private Akten sind besonders sensibel.</strong><p>„Private Akten“ sollte nur Personen bekommen, denen du ausdrücklich Zugriff auf deine internen Mitgliedsnotizen geben willst.</p></section></main>
}
