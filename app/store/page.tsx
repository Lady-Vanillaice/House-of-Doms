"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import CreatorMediaPublisher from "./creator-media-publisher";
import "./store.css";

type Role = "visitor" | "owner";
type ProductType = "digital" | "package" | "session";
type ProductStatus = "published" | "draft" | "archived";
type FeedMode = "for-you" | "all" | "favorites";
type Product = { id:number; title:string; description:string; price:number; type:ProductType; status:ProductStatus; featured:boolean; visibility:"public"|"house"|"members"; delivery:string; categories:string[] };

const categories=["Fußfetisch","Latex","Leder","Shibari","Rope","Bondage","Femdom","Maledom","Switch","Keuschhaltung","Worship","Sensory","Petplay","Roleplay","Content","Audio","Video","Foto","Tutorials","Workshops","Studio-Sessions"];

const seed: Product[] = [
  { id:1, title:"Latex After Dark", description:"Exklusives Foto- und Video-Set für Latex-Liebhaber.", price:29, type:"digital", status:"published", featured:true, visibility:"public", delivery:"Digital · sofort nach Kauf", categories:["Latex","Foto","Video"] },
  { id:2, title:"Persönliche Audio-Anweisung", description:"Individuell vorbereitete Audio-Anweisung im vorher vereinbarten Rahmen.", price:45, type:"digital", status:"published", featured:false, visibility:"members", delivery:"Digital · manuelle Freigabe", categories:["Audio","Femdom","Worship"] },
  { id:3, title:"Shibari Session", description:"Persönliche Rope-Session mit vorheriger Absprache zu Erfahrung, Grenzen und gewünschtem Schwerpunkt.", price:160, type:"session", status:"published", featured:false, visibility:"public", delivery:"Termin nach Bestätigung", categories:["Shibari","Rope","Bondage","Studio-Sessions"] },
  { id:4, title:"Foot Worship Set", description:"Digitales Set rund um Fußfetisch und Worship.", price:22, type:"digital", status:"published", featured:false, visibility:"public", delivery:"Digital · sofort nach Kauf", categories:["Fußfetisch","Worship","Foto"] },
  { id:5, title:"Bondage Basics Workshop", description:"Einsteigerfreundlicher Workshop zu Kommunikation, Sicherheit und grundlegenden Bondage-Techniken.", price:79, type:"package", status:"published", featured:false, visibility:"public", delivery:"Workshop / Termin", categories:["Bondage","Tutorials","Workshops"] }
];

const euro = (value:number) => new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(value);

export default function StorePage(){
  const [role,setRole]=useState<Role>("visitor");
  const [items,setItems]=useState(seed);
  const [filter,setFilter]=useState<"all"|ProductType>("all");
  const [categoryFilter,setCategoryFilter]=useState("all");
  const [query,setQuery]=useState("");
  const [cart,setCart]=useState<number[]>([]);
  const [feedMode,setFeedMode]=useState<FeedMode>("for-you");
  const [interests,setInterests]=useState<string[]>([]);
  const [favorites,setFavorites]=useState<number[]>([]);
  const [showInterests,setShowInterests]=useState(false);
  const [title,setTitle]=useState("");
  const [price,setPrice]=useState("25");
  const [type,setType]=useState<ProductType>("digital");
  const [visibility,setVisibility]=useState<Product["visibility"]>("public");
  const [draftCategories,setDraftCategories]=useState<string[]>([]);

  useEffect(()=>{try{setInterests(JSON.parse(localStorage.getItem("hod-content-interests")||"[]"));setFavorites(JSON.parse(localStorage.getItem("hod-content-favorites")||"[]"))}catch{}},[]);
  function toggleInterest(cat:string){setInterests(v=>{const next=v.includes(cat)?v.filter(x=>x!==cat):[...v,cat];localStorage.setItem("hod-content-interests",JSON.stringify(next));return next})}
  function toggleFavorite(id:number){setFavorites(v=>{const next=v.includes(id)?v.filter(x=>x!==id):[...v,id];localStorage.setItem("hod-content-favorites",JSON.stringify(next));return next})}
  function toggleDraftCategory(cat:string){setDraftCategories(v=>v.includes(cat)?v.filter(x=>x!==cat):[...v,cat])}

  const visible=useMemo(()=>items.filter(p=>{
    if(p.status!=="published")return false;
    if(filter!=="all"&&p.type!==filter)return false;
    if(categoryFilter!=="all"&&!p.categories.includes(categoryFilter))return false;
    if(query&&!`${p.title} ${p.description} ${p.categories.join(" ")}`.toLowerCase().includes(query.toLowerCase()))return false;
    if(feedMode==="favorites"&&!favorites.includes(p.id))return false;
    if(feedMode==="for-you"&&interests.length>0&&!p.categories.some(c=>interests.includes(c)))return false;
    return true;
  }).sort((a,b)=>Number(b.featured)-Number(a.featured)),[items,filter,categoryFilter,query,feedMode,favorites,interests]);

  const total=cart.reduce((sum,id)=>sum+(items.find(p=>p.id===id)?.price||0),0);
  const addDraft=()=>{if(!title.trim())return;setItems(v=>[{id:Date.now(),title:title.trim(),description:"Neuer Content – Beschreibung vor Veröffentlichung ergänzen.",price:Number(price)||0,type,status:"draft",featured:false,visibility,delivery:type==="session"?"Termin / Session":"Digital",categories:draftCategories.length?draftCategories:["Content"]},...v]);setTitle("");setDraftCategories([])};
  const cycle=(id:number)=>setItems(v=>v.map(p=>p.id===id?{...p,status:p.status==="draft"?"published":p.status==="published"?"archived":"draft"}:p));

  return <main className="storePage">
    <header className="storeHero"><div><Link href="/">← Zurück ins House</Link><span className="eyebrow">HOUSE OF DOMS · CONTENT</span><h1>Content & Kinks</h1><p>Creator ordnen Inhalte mehreren Kategorien zu. Members wählen ihre Interessen und sehen im persönlichen Feed bevorzugt genau den Content, der zu ihnen passt.</p></div><div className="storeRole"><button className={role==="visitor"?"active":""} onClick={()=>setRole("visitor")}>Content entdecken</button><button className={role==="owner"?"active":""} onClick={()=>setRole("owner")}>Content verwalten</button></div></header>

    {role==="visitor" ? <>
      <section className="feedTabs"><button className={feedMode==="for-you"?"active":""} onClick={()=>setFeedMode("for-you")}>Für dich</button><button className={feedMode==="all"?"active":""} onClick={()=>setFeedMode("all")}>Alles entdecken</button><button className={feedMode==="favorites"?"active":""} onClick={()=>setFeedMode("favorites")}>Favoriten</button><button className="interestButton" onClick={()=>setShowInterests(v=>!v)}>♡ Interessen {interests.length?`(${interests.length})`:"festlegen"}</button></section>
      {showInterests&&<section className="interestPanel"><div><span className="eyebrow">DEIN FEED</span><h2>Was interessiert dich?</h2><p>Wähle beliebig viele Kategorien. „Für dich“ zeigt anschließend nur passende Inhalte. Du kannst die Auswahl jederzeit ändern.</p></div><div className="categoryPicker">{categories.map(c=><button key={c} className={interests.includes(c)?"selected":""} onClick={()=>toggleInterest(c)}>{interests.includes(c)?"✓ ":"+ "}{c}</button>)}</div></section>}
      {feedMode==="for-you"&&interests.length===0&&<div className="feedHint">Wähle deine Interessen aus, damit dein persönlicher Feed gefiltert wird. Solange nichts ausgewählt ist, zeigen wir dir alles.</div>}
      <section className="storeToolbar"><input placeholder="Content, Kink oder Creator suchen …" value={query} onChange={e=>setQuery(e.target.value)}/><select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)}><option value="all">Alle Kategorien</option>{categories.map(c=><option key={c}>{c}</option>)}</select><div>{(["all","digital","package","session"] as const).map(v=><button key={v} className={filter===v?"active":""} onClick={()=>setFilter(v)}>{v==="all"?"Alle":v==="digital"?"Content":v==="package"?"Pakete / Workshops":"Sessions"}</button>)}</div></section>
      <section className="productGrid">{visible.map(p=><article className={p.featured?"productCard featured":"productCard"} key={p.id}><div className="productVisual"><button className={`favHeart${favorites.includes(p.id)?" saved":""}`} onClick={()=>toggleFavorite(p.id)} aria-label="Favorit speichern">{favorites.includes(p.id)?"♥":"♡"}</button><span>{p.featured?"FEATURED":"HOUSE EDITION"}</span><strong>{p.type==="digital"?"CONTENT":p.type==="package"?"SPECIAL":"SESSION"}</strong></div><div className="productBody"><small>{p.visibility==="public"?"Öffentlich":p.visibility==="members"?"Nur Mitglieder":"Nur House"}</small><h2>{p.title}</h2><div className="contentTags">{p.categories.map(c=><button key={c} onClick={()=>setCategoryFilter(c)}>{c}</button>)}</div><p>{p.description}</p><div className="delivery">{p.delivery}</div><footer><strong>{euro(p.price)}</strong><button onClick={()=>setCart(v=>v.includes(p.id)?v:[...v,p.id])}>{cart.includes(p.id)?"Im Warenkorb":"Hinzufügen"}</button></footer></div></article>)}</section>
      {visible.length===0&&<div className="emptyFeed">Hier ist gerade nichts Passendes. Ändere deine Interessen oder öffne „Alles entdecken“.</div>}
      <aside className="cartBar"><div><span>Warenkorb</span><strong>{cart.length} Artikel · {euro(total)}</strong></div><button disabled={!cart.length}>Checkout später mit Zahlungsanbieter</button></aside>
    </> : <section className="ownerGrid">
      <CreatorMediaPublisher/>
      <div className="adminPanel"><span className="eyebrow">ANGEBOTE & PAKETE</span><h2>Zusätzliche Angebote kategorisieren</h2><label>Titel<input value={title} onChange={e=>setTitle(e.target.value)}/></label><label>Preis in €<input type="number" min="0" step="1" value={price} onChange={e=>setPrice(e.target.value)}/></label><label>Typ<select value={type} onChange={e=>setType(e.target.value as ProductType)}><option value="digital">Digitaler Content</option><option value="package">Paket / Workshop</option><option value="session">Session-Angebot</option></select></label><label>Sichtbarkeit<select value={visibility} onChange={e=>setVisibility(e.target.value as Product["visibility"])}><option value="public">Öffentlich</option><option value="members">Nur Mitglieder</option><option value="house">Nur House-Verbindungen</option></select></label><div className="categoryField"><strong>Kategorien auswählen</strong><small>Mehrfachauswahl möglich – diese Kategorien steuern später den persönlichen Feed.</small><div className="categoryPicker compact">{categories.map(c=><button type="button" key={c} className={draftCategories.includes(c)?"selected":""} onClick={()=>toggleDraftCategory(c)}>{draftCategories.includes(c)?"✓ ":"+ "}{c}</button>)}</div></div><button className="primary" onClick={addDraft}>Als Entwurf anlegen</button><p className="hint">Ein Inhalt kann mehreren Kinks gleichzeitig zugeordnet werden, z. B. „Latex + Fußfetisch + Video“.</p></div>
      <div className="adminPanel inventory"><span className="eyebrow">INVENTAR</span><h2>Angebote verwalten</h2>{items.map(p=><article key={p.id}><div><strong>{p.title}</strong><span>{euro(p.price)} · {p.categories.join(" · ")}</span></div><em className={p.status}>{p.status==="published"?"Veröffentlicht":p.status==="draft"?"Entwurf":"Archiviert"}</em><button onClick={()=>cycle(p.id)}>{p.status==="draft"?"Veröffentlichen":p.status==="published"?"Archivieren":"Zurück zu Entwurf"}</button></article>)}</div>
    </section>}

    <section className="storeNotice"><strong>Flexible Freigabe pro Datei</strong><p>Creator können jede einzelne Medien-Datei kostenlos öffentlich posten, mit eigenem Pay-per-View-Preis versehen oder exklusiv für aktive Mitglieder ihrer eigenen Creator-Seite freischalten. Kategorien bleiben unabhängig von Dom/Sub-Rollen.</p></section>
  </main>;
}
