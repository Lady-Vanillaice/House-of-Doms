"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import "./houses.css";

type House = { slug:string; name:string; dom:string; city:string; style:string; bio:string; applicationsOpen:boolean; studio:boolean; tags:string[] };

const houses: House[] = [
  { slug:"lady-vanillaice", name:"House of Vanillaice", dom:"Lady Vanillaice", city:"Berlin", style:"Exklusive Dynamik", bio:"Klare Führung, strukturierte Aufgaben, persönliche Entwicklung und verlässliche Kommunikation in einem privaten House.", applicationsOpen:true, studio:true, tags:["Struktur","Aufgaben","Studio-Tage"] },
  { slug:"house-obsidian", name:"House Obsidian", dom:"Madame Noire", city:"Hamburg", style:"Privater Kreis", bio:"Ein diskretes House mit Fokus auf Rituale, Reflexion und langfristige, einvernehmliche Dynamiken.", applicationsOpen:true, studio:false, tags:["Rituale","Journal","Privat"] },
  { slug:"house-velvet", name:"House Velvet", dom:"Dom Alexander", city:"Köln", style:"Community", bio:"Persönliche Führung, regelmäßige Sessions und klare Vereinbarungen für volljährige Mitglieder.", applicationsOpen:false, studio:true, tags:["Sessions","Mentoring","Studio"] }
];

export default function HousesPage(){
  const [query,setQuery]=useState("");
  const [city,setCity]=useState("Alle");
  const [openOnly,setOpenOnly]=useState(false);
  const filtered=useMemo(()=>houses.filter(h=>{
    const text=`${h.name} ${h.dom} ${h.city} ${h.style} ${h.tags.join(" ")}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (city==="Alle"||h.city===city) && (!openOnly||h.applicationsOpen);
  }),[query,city,openOnly]);
  return <main className="directoryPage">
    <header className="directoryHero"><Link href="/" className="backLink">← Zurück ins House</Link><span className="eyebrow">HOUSE OF DOMS · 18+</span><h1>Finde dein House.</h1><p>Entdecke öffentliche Dom-/Domina-Profile, lies Regeln und Erwartungen und sende anschließend eine persönliche Bewerbung.</p></header>
    <section className="directoryFilters"><label>Suche<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="House, Dom, Ort oder Schwerpunkt" /></label><label>Ort<select value={city} onChange={e=>setCity(e.target.value)}><option>Alle</option><option>Berlin</option><option>Hamburg</option><option>Köln</option></select></label><label className="checkLabel"><input type="checkbox" checked={openOnly} onChange={e=>setOpenOnly(e.target.checked)} /> Nur offene Bewerbungen</label></section>
    <section className="directoryMeta"><strong>{filtered.length} Houses</strong><span>Öffentliche Alpha-Profile · echte Daten folgen mit Supabase</span></section>
    <section className="houseGrid">{filtered.map(h=><article className="houseCard" key={h.slug}><div className="houseCover"><span>{h.dom.split(" ").map(v=>v[0]).join("").slice(0,2)}</span><em>{h.applicationsOpen?"BEWERBUNGEN OFFEN":"AKTUELL GESCHLOSSEN"}</em></div><div className="houseBody"><span className="eyebrow">{h.city} · {h.style}</span><h2>{h.name}</h2><h3>{h.dom}</h3><p>{h.bio}</p><div className="tags">{h.tags.map(tag=><span key={tag}>{tag}</span>)}</div><div className="houseFacts"><span>{h.studio?"◆ Studio-Tage verfügbar":"◇ Online / privat"}</span><span>{h.applicationsOpen?"● Aufnahme möglich":"○ Warteliste"}</span></div><Link href={`/houses/${h.slug}`}>Profil ansehen →</Link></div></article>)}</section>
    {filtered.length===0&&<div className="emptyDirectory">Keine passenden Houses gefunden.</div>}
  </main>;
}
