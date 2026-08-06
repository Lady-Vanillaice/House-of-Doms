"use client";

import Link from "next/link";
import { useState } from "react";
import "./settings.css";

type Role="dom"|"sub";
export default function HouseSettingsPage(){
 const [role,setRole]=useState<Role>("dom");
 const [name,setName]=useState("House of Lady Vanillaice");
 const [welcome,setWelcome]=useState("Willkommen in meinem House.");
 const [rules,setRules]=useState("Respekt, Einvernehmlichkeit, Diskretion und klare Kommunikation.");
 const [applications,setApplications]=useState(true);
 const [visibility,setVisibility]=useState("private");
 const [door,setDoor]=useState("obsidian");
 const [saved,setSaved]=useState(false);
 return <main className="settingsPage"><header><div><Link href="/">← Zurück ins House</Link><span>HOUSE OF DOMS</span><h1>House-Einstellungen</h1><p>Doms gestalten und verwalten das House. Subs/Sklaven sehen nur freigegebene Informationen und verwalten ihre persönlichen Präferenzen.</p></div><div className="roleSwitch"><button className={role==="dom"?"active":""} onClick={()=>setRole("dom")}>Dom / Domina</button><button className={role==="sub"?"active":""} onClick={()=>setRole("sub")}>Sub / Sklave</button></div></header>
 {role==="dom"?<section className="settingsGrid"><form className="panel" onSubmit={e=>{e.preventDefault();setSaved(true)}}><span className="eyebrow">HOUSE-VERWALTUNG</span><h2>Identität & Zugang</h2><label>House-Name<input value={name} onChange={e=>setName(e.target.value)}/></label><label>Begrüßung<textarea rows={4} value={welcome} onChange={e=>setWelcome(e.target.value)}/></label><label>House-Regeln<textarea rows={6} value={rules} onChange={e=>setRules(e.target.value)}/></label><label>Sichtbarkeit<select value={visibility} onChange={e=>setVisibility(e.target.value)}><option value="private">Privat</option><option value="application">Über Bewerbung sichtbar</option><option value="public">Öffentliches Profil</option></select></label><label>Tür-Design<select value={door} onChange={e=>setDoor(e.target.value)}><option value="obsidian">Obsidian</option><option value="velvet">Velvet</option><option value="gold">Gold</option></select></label><label className="toggle"><input type="checkbox" checked={applications} onChange={e=>setApplications(e.target.checked)}/>Bewerbungen geöffnet</label><button className="primary">Einstellungen speichern</button>{saved&&<strong className="saved">Gespeichert</strong>}</form><aside className="panel preview"><span className="eyebrow">VORSCHAU</span><h2>{name}</h2><div className={`door ${door}`}>H</div><p>{welcome}</p><h3>Regeln</h3><p>{rules}</p><small>{applications?"Bewerbungen geöffnet":"Bewerbungen geschlossen"} · {visibility}</small></aside></section>:<section className="panel subSettings"><span className="eyebrow">PERSÖNLICHE EINSTELLUNGEN</span><h2>Meine House-Präferenzen</h2><p>Subs/Sklaven können das House nicht verändern. Sie verwalten nur Benachrichtigungen, Privatsphäre und freiwillige Journal-Freigaben.</p><label className="toggle"><input type="checkbox" defaultChecked/>Benachrichtigungen für neue Aufgaben</label><label className="toggle"><input type="checkbox" defaultChecked/>Benachrichtigungen für Session-Slots</label><label className="toggle"><input type="checkbox"/>Private Journal-Einträge standardmäßig teilen</label><div className="notice">Aufgabennachweise werden nur für die jeweilige Aufgabe freigegeben. Private Journal-Einträge bleiben freiwillig.</div></section>}
 </main>
}