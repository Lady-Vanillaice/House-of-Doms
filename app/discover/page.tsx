"use client";

import Link from "next/link";
import { useEffect,useMemo,useState } from "react";
import "./discover.css";

type Kind="creator"|"session"|"member"|"switch";
type Profile={id:number;name:string;kind:Kind;city:string;mode:"online"|"studio"|"both";online:boolean;verified:boolean;featured:boolean;rating:number;reviews:number;open:boolean;bio:string;offers:string[];seeks:string[];limits:string[];languages:string[]};

const kindLabels:Record<Kind,string>={creator:"Creator",session:"Session-Anbieter",member:"Member",switch:"Creator & Member"};

const profiles:Profile[]=[
{id:1,name:"Lady Vanillaice",kind:"creator",city:"Berlin",mode:"both",online:true,verified:true,featured:true,rating:4.9,reviews:47,open:true,bio:"Creatorin und Session-Anbieterin mit Femdom, Fußfetisch, Keuschhaltung, Content und persönlichen Studio-Sessions.",offers:["Femdom","Fußfetisch","Keuschhaltung","Content","Studio-Sessions"],seeks:["Kink-Community","Langzeitdynamik","Content-Abos"],limits:["Consent first","Keine Schulden","Keine Veröffentlichung ohne Freigabe"],languages:["DE","EN"]},
{id:2,name:"Rope Atelier",kind:"session",city:"Hamburg",mode:"studio",online:false,verified:true,featured:false,rating:4.8,reviews:31,open:true,bio:"Shibari- und Rope-Sessions für Einsteiger und Erfahrene, dazu Workshops mit Fokus auf Technik, Kommunikation und Sicherheit.",offers:["Shibari","Rope","Bondage","Workshops"],seeks:["Rope-Liebhaber","Models","Workshop-Gäste"],limits:["Vorherige Absprache","Safe words","Keine Zwangsdynamik"],languages:["DE","EN"]},
{id:3,name:"Noir Latex",kind:"creator",city:"Köln",mode:"online",online:true,verified:true,featured:false,rating:4.7,reviews:22,open:true,bio:"Latex-, Leder- und Fetisch-Content mit exklusiven Sets, Videos und Memberships.",offers:["Latex","Leder","Foto-Content","Video-Content","Memberships"],seeks:["Latexliebhaber","Fetisch-Content","Collabs"],limits:["Keine privaten Treffen"],languages:["DE","EN"]},
{id:4,name:"Mika",kind:"member",city:"München",mode:"both",online:true,verified:false,featured:false,rating:0,reviews:0,open:true,bio:"Neugieriger Member mit Interesse an Fußfetisch, Rope, Sensory und Latex. Keine feste D/s-Rolle.",offers:["Community","Austausch"],seeks:["Fußfetisch","Shibari","Sensory","Latex"],limits:["Nur einvernehmlich","Keine öffentlichen Medien"],languages:["DE"]},
{id:5,name:"Raven",kind:"switch",city:"Leipzig",mode:"both",online:false,verified:true,featured:false,rating:4.8,reviews:12,open:true,bio:"Switch, Creator und Session-Anbieter mit Bondage, Ritualen, Leder und intensiven, klar abgesprochenen Dynamiken.",offers:["Bondage","Leder","Rituale","Sessions","Content"],seeks:["Switch","Bondage","Worship","Langzeitdynamik"],limits:["Nur nach Absprache","Grenzen vor jeder Session"],languages:["DE","EN"]}
];

const interests=["Shibari","Rope","Bondage","Latex","Leder","Fußfetisch","Femdom","Maledom","Switch","Keuschhaltung","Worship","Sensory","Petplay","Roleplay","Content","Workshops","Studio-Sessions","Memberships"];

export default function DiscoverPage(){
 const[query,setQuery]=useState("");const[kind,setKind]=useState("all");const[mode,setMode]=useState("all");const[interest,setInterest]=useState("all");const[onlyOnline,setOnlyOnline]=useState(false);const[onlyOpen,setOnlyOpen]=useState(false);const[onlyFav,setOnlyFav]=useState(false);const[favorites,setFavorites]=useState<number[]>([]);
 useEffect(()=>{try{setFavorites(JSON.parse(localStorage.getItem("hod-favorites")||"[]"))}catch{}},[]);
 function fav(id:number){const next=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];setFavorites(next);localStorage.setItem("hod-favorites",JSON.stringify(next))}
 const visible=useMemo(()=>profiles.filter(p=>{const hay=[p.name,p.city,kindLabels[p.kind],p.bio,...p.offers,...p.seeks].join(" ").toLowerCase();return(!query||hay.includes(query.toLowerCase()))&&(kind==="all"||p.kind===kind)&&(mode==="all"||p.mode===mode||p.mode==="both")&&(interest==="all"||p.offers.includes(interest)||p.seeks.includes(interest))&&(!onlyOnline||p.online)&&(!onlyOpen||p.open)&&(!onlyFav||favorites.includes(p.id))}).sort((a,b)=>Number(b.featured)-Number(a.featured)||b.rating-a.rating),[query,kind,mode,interest,onlyOnline,onlyOpen,onlyFav,favorites]);
 return <main className="discoverPage">
  <header className="discoverHero"><Link href="/" className="backLink">← Zurück ins House</Link><span className="eyebrow">DISCOVER</span><h1>Finde Menschen, Kinks,<br/>Content & Sessions.</h1><p>Von Shibari, Latex und Fußfetisch bis D/s, Bondage, Workshops und Creator-Content: Entdecke Profile nach dem, was dich wirklich interessiert – nicht nur nach einer festen Rolle.</p></header>
  <section className="discoverFilters">
    <label>Suche<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Name, Ort, Kink, Content oder Session"/></label>
    <label>Profiltyp<select value={kind} onChange={e=>setKind(e.target.value)}><option value="all">Alle Profiltypen</option><option value="creator">Creator</option><option value="session">Session-Anbieter</option><option value="member">Member</option><option value="switch">Creator & Member</option></select></label>
    <label>Kontakt<select value={mode} onChange={e=>setMode(e.target.value)}><option value="all">Online & vor Ort</option><option value="online">Nur online</option><option value="studio">Vor Ort / Studio</option></select></label>
    <label>Kink / Interesse<select value={interest} onChange={e=>setInterest(e.target.value)}><option value="all">Alle Kinks & Interessen</option>{interests.map(i=><option key={i}>{i}</option>)}</select></label>
    <label className="check"><input type="checkbox" checked={onlyOnline} onChange={e=>setOnlyOnline(e.target.checked)}/>Jetzt online</label>
    <label className="check"><input type="checkbox" checked={onlyOpen} onChange={e=>setOnlyOpen(e.target.checked)}/>Kontakt geöffnet</label>
    <label className="check"><input type="checkbox" checked={onlyFav} onChange={e=>setOnlyFav(e.target.checked)}/>Nur Favoriten</label>
  </section>
  <div className="discoverMeta"><strong>{visible.length} Profile</strong><span>★ Bewertungen nach Sessions · ✓ Verifizierung · FEATURED Premium-Platzierung</span></div>
  <section className="profileGrid">{visible.map(p=><article className={`profileCard${p.featured?" featured":""}`} key={p.id}>{p.featured&&<div className="featuredFlag">FEATURED</div>}<button className={`favoriteButton${favorites.includes(p.id)?" saved":""}`} onClick={()=>fav(p.id)} aria-label="Favorit speichern">{favorites.includes(p.id)?"♥":"♡"}</button><div className="profileTop"><div className="avatar">{p.name.split(" ").map(x=>x[0]).join("").slice(0,2)}</div><div><div className="identity"><h2>{p.name}</h2>{p.verified&&<b title="Verifiziert">✓</b>}</div><span>{kindLabels[p.kind].toUpperCase()} · {p.city}</span>{p.reviews>0&&<div className="rating">★ {p.rating.toFixed(1)} <small>({p.reviews})</small></div>}</div><i className={p.online?"online":"offline"}>{p.online?"ONLINE":"OFFLINE"}</i></div><p>{p.bio}</p><div className="modeLine"><span>{p.mode==="online"?"Nur online":p.mode==="studio"?"Studio / vor Ort":"Online & vor Ort"}</span><strong>{p.open?"Kontakt geöffnet":"Kontakt geschlossen"}</strong></div><div className="tagBlock"><small>CONTENT / SESSIONS / ANGEBOTE</small><div>{p.offers.map(x=><span key={x}>{x}</span>)}</div></div><div className="tagBlock seeks"><small>INTERESSEN & KINKS</small><div>{p.seeks.map(x=><span key={x}>{x}</span>)}</div></div><div className="tagBlock limits"><small>GRENZEN</small><div>{p.limits.map(x=><span key={x}>{x}</span>)}</div></div><footer><span>{p.languages.join(" · ")}</span>{p.open?<Link href={`/bewerbungen?profil=${encodeURIComponent(p.name)}`}>Profil öffnen →</Link>:<button disabled>Geschlossen</button>}</footer></article>)}</section>
  {visible.length===0&&<div className="emptyDiscover">Keine passenden Profile oder Kinks gefunden.</div>}
  <div className="discoverMeta"><Link href="/growth">Für Creator: Verifizierung, Premium & Statistiken →</Link><Link href="/events">Events, Workshops & Wartelisten →</Link></div>
 </main>
}
