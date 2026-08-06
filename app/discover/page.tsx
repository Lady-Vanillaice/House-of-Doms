"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import "./discover.css";

type Role = "dom" | "domina" | "sub" | "sklave" | "switch";
type Profile = { id:number; name:string; role:Role; city:string; mode:"online"|"studio"|"both"; online:boolean; verified:boolean; open:boolean; bio:string; offers:string[]; seeks:string[]; limits:string[]; languages:string[] };

const profiles: Profile[] = [
  { id:1,name:"Lady Vanillaice",role:"domina",city:"Berlin",mode:"both",online:true,verified:true,open:true,bio:"Klare, strukturierte Führung mit Aufgaben, Ritualen und persönlichen Studio-Sessions.",offers:["Online-Befehle","Keuschhaltung","Fußfetisch","Aufgaben"],seeks:["Langzeitdynamik","Dienst","Verlässlichkeit"],limits:["Keine Schulden","Keine Veröffentlichung"],languages:["DE","EN"] },
  { id:2,name:"Master Noir",role:"dom",city:"Hamburg",mode:"online",online:false,verified:true,open:true,bio:"Online-Dynamiken, Rituale und kontrollierte Routinen mit klaren Grenzen.",offers:["Online-Befehle","Keuschhaltung","Rituale"],seeks:["Sub","Sklave","Langzeitdynamik"],limits:["Nur einvernehmlich"],languages:["DE"] },
  { id:3,name:"Mira",role:"sub",city:"Köln",mode:"both",online:true,verified:false,open:true,bio:"Suche respektvolle Führung, klare Aufgaben und ehrliche Kommunikation.",offers:["Dienst","Journaling"],seeks:["Domina","Aufgaben","Studio-Sessions"],limits:["Keine öffentlichen Medien"],languages:["DE","EN"] },
  { id:4,name:"Leon",role:"sklave",city:"München",mode:"online",online:true,verified:false,open:false,bio:"Interesse an langfristiger Online-Führung und strukturierten Aufgaben.",offers:["Dienst","Zahlsklave"],seeks:["Finanzdominanz","Online-Befehle"],limits:["Feste finanzielle Limits","Keine Kredite"],languages:["DE"] },
  { id:5,name:"Raven",role:"switch",city:"Leipzig",mode:"both",online:false,verified:true,open:true,bio:"Switch mit Fokus auf Kommunikation, Ritualen und langfristigen Dynamiken.",offers:["Online-Befehle","Fußfetisch","Journaling"],seeks:["Switch","Dom","Sub"],limits:["Nur nach Absprache"],languages:["DE","EN"] }
];

const interests=["Online-Befehle","Keuschhaltung","Zahlsklave","Finanzdominanz","Fußfetisch","Aufgaben","Rituale","Journaling","Studio-Sessions","Langzeitdynamik"];

export default function DiscoverPage(){
 const [query,setQuery]=useState(""); const [role,setRole]=useState("all"); const [mode,setMode]=useState("all"); const [interest,setInterest]=useState("all"); const [onlyOnline,setOnlyOnline]=useState(false); const [onlyOpen,setOnlyOpen]=useState(false);
 const visible=useMemo(()=>profiles.filter(p=>{
  const hay=[p.name,p.city,p.role,p.bio,...p.offers,...p.seeks].join(" ").toLowerCase();
  return (!query||hay.includes(query.toLowerCase()))&&(role==="all"||p.role===role)&&(mode==="all"||p.mode===mode||p.mode==="both")&&(interest==="all"||p.offers.includes(interest)||p.seeks.includes(interest))&&(!onlyOnline||p.online)&&(!onlyOpen||p.open);
 }),[query,role,mode,interest,onlyOnline,onlyOpen]);
 return <main className="discoverPage">
  <header className="discoverHero"><Link href="/" className="backLink">← Zurück ins House</Link><span className="eyebrow">DISCOVER</span><h1>Finde Menschen,<br/>nicht nur Profile.</h1><p>Suche nach Doms, Dominas, Subs, Sklaven und Switches. Interessen werden getrennt nach „biete ich“, „suche ich“ und Grenzen angezeigt.</p></header>
  <section className="discoverFilters">
   <label>Suche<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Name, Ort, Rolle oder Interesse"/></label>
   <label>Rolle<select value={role} onChange={e=>setRole(e.target.value)}><option value="all">Alle Rollen</option><option value="dom">Dom</option><option value="domina">Domina</option><option value="sub">Sub</option><option value="sklave">Sklave</option><option value="switch">Switch</option></select></label>
   <label>Kontakt<select value={mode} onChange={e=>setMode(e.target.value)}><option value="all">Online & vor Ort</option><option value="online">Nur online</option><option value="studio">Vor Ort / Studio</option></select></label>
   <label>Interesse<select value={interest} onChange={e=>setInterest(e.target.value)}><option value="all">Alle Interessen</option>{interests.map(i=><option key={i}>{i}</option>)}</select></label>
   <label className="check"><input type="checkbox" checked={onlyOnline} onChange={e=>setOnlyOnline(e.target.checked)}/>Jetzt online</label>
   <label className="check"><input type="checkbox" checked={onlyOpen} onChange={e=>setOnlyOpen(e.target.checked)}/>Kontakt geöffnet</label>
  </section>
  <div className="discoverMeta"><strong>{visible.length} Profile</strong><span>Öffentliche Alpha-Daten · echte Profile folgen mit Supabase</span></div>
  <section className="profileGrid">{visible.map(p=><article className="profileCard" key={p.id}>
   <div className="profileTop"><div className="avatar">{p.name.split(" ").map(x=>x[0]).join("").slice(0,2)}</div><div><div className="identity"><h2>{p.name}</h2>{p.verified&&<b>✓</b>}</div><span>{p.role.toUpperCase()} · {p.city}</span></div><i className={p.online?"online":"offline"}>{p.online?"ONLINE":"OFFLINE"}</i></div>
   <p>{p.bio}</p><div className="modeLine"><span>{p.mode==="online"?"Nur online":p.mode==="studio"?"Studio / vor Ort":"Online & vor Ort"}</span><strong>{p.open?"Kontakt geöffnet":"Kontakt geschlossen"}</strong></div>
   <div className="tagBlock"><small>BIETE ICH</small><div>{p.offers.map(x=><span key={x}>{x}</span>)}</div></div>
   <div className="tagBlock seeks"><small>SUCHE ICH</small><div>{p.seeks.map(x=><span key={x}>{x}</span>)}</div></div>
   <div className="tagBlock limits"><small>GRENZEN</small><div>{p.limits.map(x=><span key={x}>{x}</span>)}</div></div>
   <footer><span>{p.languages.join(" · ")}</span>{p.open?<Link href={`/bewerbungen?profil=${encodeURIComponent(p.name)}`}>Profil öffnen →</Link>:<button disabled>Geschlossen</button>}</footer>
  </article>)}</section>
  {visible.length===0&&<div className="emptyDiscover">Keine passenden Profile gefunden.</div>}
 </main>;
}
