"use client";

import Link from "next/link";
import { useEffect,useMemo,useState } from "react";
import { createClient } from "../../lib/supabase/client";
import "./discover.css";

type Kind="creator"|"session"|"member"|"switch";
type Profile={id:string;name:string;kind:Kind;city:string;mode:"online"|"studio"|"both";online:boolean;verified:boolean;featured:boolean;rating:number;reviews:number;open:boolean;bio:string;offers:string[];seeks:string[];limits:string[];languages:string[];slug?:string};

const kindLabels:Record<Kind,string>={creator:"Creator",session:"Session-Anbieter",member:"Member",switch:"Creator & Member"};
const interests=["Shibari","Rope","Bondage","Latex","Leder","Fußfetisch","Femdom","Maledom","Switch","Keuschhaltung","Worship","Sensory","Petplay","Roleplay","Content","Workshops","Studio-Sessions","Memberships"];

function roleKind(role:string,offers:string[]):Kind{
 const r=role.toLowerCase();
 if(r==="switch")return"switch";
 if(r==="sub"||r==="sklave")return"member";
 if(offers.some(x=>/session|studio|workshop/i.test(x)))return"session";
 return"creator";
}
function contactMode(studio:string):"online"|"studio"|"both"{
 const s=studio.toLowerCase(), hasOnline=/online|remote|video/.test(s), hasStudio=/studio|vor ort|session/.test(s);
 return hasOnline&&hasStudio?"both":hasStudio?"studio":"online";
}

export default function DiscoverPage(){
 const[profiles,setProfiles]=useState<Profile[]>([]);const[loading,setLoading]=useState(true);const[loadError,setLoadError]=useState("");
 const[query,setQuery]=useState("");const[kind,setKind]=useState("all");const[mode,setMode]=useState("all");const[interest,setInterest]=useState("all");const[onlyOnline,setOnlyOnline]=useState(false);const[onlyOpen,setOnlyOpen]=useState(false);const[onlyFav,setOnlyFav]=useState(false);const[favorites,setFavorites]=useState<string[]>([]);
 useEffect(()=>{try{setFavorites(JSON.parse(localStorage.getItem("hod-favorites")||"[]"))}catch{} void loadProfiles()},[]);
 async function loadProfiles(){
  setLoading(true);setLoadError("");
  try{
   const s=createClient();
   const[{data:details,error:detailError},{data:sites,error:siteError}]=await Promise.all([
    s.from("profile_details").select("user_id,display_name,role,bio,location,languages,offers,seeks,boundaries,contact_status,studio_info,is_verified,visibility,updated_at").eq("visibility","public").order("updated_at",{ascending:false}),
    s.from("domina_sites").select("owner_id,slug,is_published")
   ]);
   if(detailError)throw detailError;if(siteError)throw siteError;
   const siteByOwner=new Map((sites||[]).map((x:any)=>[x.owner_id,x]));
   const live=(details||[]).filter((x:any)=>["dom","domina","switch"].includes(String(x.role||"").toLowerCase())||((x.offers||[]).length>0)).map((x:any)=>{
    const offers=Array.isArray(x.offers)?x.offers:[],seeks=Array.isArray(x.seeks)?x.seeks:[],studio=String(x.studio_info||"");
    const site:any=siteByOwner.get(x.user_id);
    return{id:String(x.user_id),name:x.display_name||"Creator",kind:roleKind(String(x.role||""),offers),city:x.location||"Online",mode:contactMode(studio),online:true,verified:Boolean(x.is_verified),featured:false,rating:0,reviews:0,open:x.contact_status!=="closed",bio:x.bio||"Creator im House of Doms.",offers,seeks,limits:Array.isArray(x.boundaries)?x.boundaries:[],languages:Array.isArray(x.languages)?x.languages:["DE"],slug:site?.is_published?site.slug:undefined} as Profile;
   });
   setProfiles(live);
  }catch(error){setLoadError(error instanceof Error?error.message:"Discover konnte nicht geladen werden.");}
  finally{setLoading(false)}
 }
 function fav(id:string){const next=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];setFavorites(next);localStorage.setItem("hod-favorites",JSON.stringify(next))}
 const visible=useMemo(()=>profiles.filter(p=>{const hay=[p.name,p.city,kindLabels[p.kind],p.bio,...p.offers,...p.seeks].join(" ").toLowerCase();return(!query||hay.includes(query.toLowerCase()))&&(kind==="all"||p.kind===kind)&&(mode==="all"||p.mode===mode||p.mode==="both")&&(interest==="all"||p.offers.some(x=>x.toLowerCase().includes(interest.toLowerCase()))||p.seeks.some(x=>x.toLowerCase().includes(interest.toLowerCase())))&&(!onlyOnline||p.online)&&(!onlyOpen||p.open)&&(!onlyFav||favorites.includes(p.id))}).sort((a,b)=>Number(b.featured)-Number(a.featured)||b.rating-a.rating),[profiles,query,kind,mode,interest,onlyOnline,onlyOpen,onlyFav,favorites]);
 return <main className="discoverPage">
  <header className="discoverTop"><Link href="/" className="discoverBrand"><img src="/door-emblem.svg" alt=""/><span>HOUSE OF DOMS</span></Link><nav><b>DISCOVER</b><Link href="/events">EVENTS</Link><Link href="/anmelden">LOGIN</Link></nav></header>
  <section className="discoverHero"><span className="eyebrow">DISCOVER YOUR HOUSE</span><h1>Finde, was dich<br/><em>anzieht.</em></h1><p>Echte Creator und Anbieter aus dem House – gefiltert nach Kinks, Angeboten und Standort statt nach starren Rollen.</p><div className="heroSearch"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Kink, Creator, Ort oder Session"/><button onClick={()=>document.getElementById("profiles")?.scrollIntoView({behavior:"smooth"})}>ENTDECKEN</button></div></section>
  <section className="kinkRail"><button className={interest==="all"?"active":""} onClick={()=>setInterest("all")}>ALLE</button>{interests.slice(0,10).map(i=><button className={interest===i?"active":""} onClick={()=>setInterest(i)} key={i}>{i.toUpperCase()}</button>)}</section>
  <section className="discoverRooms"><div className="roomHead"><span className="eyebrow">CURATED ROOMS</span><h2>Womit möchtest du anfangen?</h2></div><div className="roomGrid"><button onClick={()=>setInterest("Shibari")}><span>ROPE & BONDAGE</span><strong>Knoten, Kontrolle & Vertrauen</strong><p>Shibari, Bondage, Workshops und Sessions entdecken.</p></button><button onClick={()=>setInterest("Latex")}><span>FETISH</span><strong>Latex, Leder & Ästhetik</strong><p>Creator und Content rund um Material, Look und Fetisch.</p></button><button onClick={()=>setInterest("Femdom")}><span>DYNAMICS</span><strong>Dominanz & Hingabe</strong><p>Profile mit Femdom, Worship und einvernehmlichen D/s-Dynamiken.</p></button></div></section>
  <section className="discoverFilters" id="profiles">
    <label>Suche<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Name, Ort, Kink, Content oder Session"/></label>
    <label>Profiltyp<select value={kind} onChange={e=>setKind(e.target.value)}><option value="all">Alle Profiltypen</option><option value="creator">Creator</option><option value="session">Session-Anbieter</option><option value="switch">Creator & Member</option></select></label>
    <label>Kontakt<select value={mode} onChange={e=>setMode(e.target.value)}><option value="all">Online & vor Ort</option><option value="online">Nur online</option><option value="studio">Vor Ort / Studio</option></select></label>
    <label>Kink / Interesse<select value={interest} onChange={e=>setInterest(e.target.value)}><option value="all">Alle Kinks & Interessen</option>{interests.map(i=><option key={i}>{i}</option>)}</select></label>
    <label className="check"><input type="checkbox" checked={onlyOnline} onChange={e=>setOnlyOnline(e.target.checked)}/>Jetzt online</label>
    <label className="check"><input type="checkbox" checked={onlyOpen} onChange={e=>setOnlyOpen(e.target.checked)}/>Kontakt geöffnet</label>
    <label className="check"><input type="checkbox" checked={onlyFav} onChange={e=>setOnlyFav(e.target.checked)}/>Nur Favoriten</label>
  </section>
  <div className="discoverMeta"><strong>{loading?"Profile werden geladen …":visible.length+" Creator & Anbieter"}</strong><span>Live aus dem House · ✓ Verifizierung · Favoriten lokal gespeichert</span></div>
  {loadError&&<div className="emptyDiscover">Discover konnte nicht geladen werden: {loadError}</div>}
  {!loading&&!loadError&&<section className="profileGrid">{visible.map(p=><article className={`profileCard${p.featured?" featured":""}`} key={p.id}>{p.featured&&<div className="featuredFlag">FEATURED</div>}<button className={`favoriteButton${favorites.includes(p.id)?" saved":""}`} onClick={()=>fav(p.id)} aria-label="Favorit speichern">{favorites.includes(p.id)?"♥":"♡"}</button><div className="profileTop"><div className="avatar">{p.name.split(" ").map(x=>x[0]).join("").slice(0,2)}</div><div><div className="identity"><h2>{p.name}</h2>{p.verified&&<b title="Verifiziert">✓</b>}</div><span>{kindLabels[p.kind].toUpperCase()} · {p.city}</span>{p.reviews>0&&<div className="rating">★ {p.rating.toFixed(1)} <small>({p.reviews})</small></div>}</div><i className={p.online?"online":"offline"}>{p.online?"AKTIV":"OFFLINE"}</i></div><p>{p.bio}</p><div className="modeLine"><span>{p.mode==="online"?"Online":p.mode==="studio"?"Studio / vor Ort":"Online & vor Ort"}</span><strong>{p.open?"Kontakt geöffnet":"Kontakt geschlossen"}</strong></div>{p.offers.length>0&&<div className="tagBlock"><small>CONTENT / SESSIONS / ANGEBOTE</small><div>{p.offers.map(x=><span key={x}>{x}</span>)}</div></div>}{p.seeks.length>0&&<div className="tagBlock seeks"><small>INTERESSEN & KINKS</small><div>{p.seeks.map(x=><span key={x}>{x}</span>)}</div></div>}{p.limits.length>0&&<div className="tagBlock limits"><small>GRENZEN</small><div>{p.limits.map(x=><span key={x}>{x}</span>)}</div></div>}<footer><span>{p.languages.join(" · ")}</span>{p.open?(p.slug?<Link href={`/d/${p.slug}`}>Creator-Seite öffnen →</Link>:<Link href={`/profil?user=${encodeURIComponent(p.id)}`}>Profil öffnen →</Link>):<button disabled>Geschlossen</button>}</footer></article>)}</section>}
  {!loading&&!loadError&&visible.length===0&&<div className="emptyDiscover"><strong>Noch keine passenden Creator gefunden.</strong><br/>Sobald ein Creator sein öffentliches Profil anlegt, erscheint es automatisch hier.</div>}
  <div className="discoverMeta"><Link href="/creator/onboarding">Für Creator: Profil anlegen →</Link><Link href="/events">Events, Workshops & Wartelisten →</Link></div>
 </main>
}
