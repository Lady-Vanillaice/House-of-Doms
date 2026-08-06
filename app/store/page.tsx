"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import "./store.css";

type Role = "visitor" | "owner";
type ProductType = "digital" | "package" | "session";
type ProductStatus = "published" | "draft" | "archived";
type Product = { id:number; title:string; description:string; price:number; type:ProductType; status:ProductStatus; featured:boolean; visibility:"public"|"house"|"members"; delivery:string };

const seed: Product[] = [
  { id:1, title:"7-Tage Aufgabenpaket", description:"Sieben vorbereitete, einvernehmliche Aufgaben mit Reflexion und frei wählbaren Nachweisen.", price:29, type:"package", status:"published", featured:true, visibility:"public", delivery:"Digital · sofort nach Kauf" },
  { id:2, title:"Persönliche Audio-Anweisung", description:"Individuell vorbereitete Audio-Anweisung im vereinbarten Rahmen. Inhalt wird vorab abgestimmt.", price:45, type:"digital", status:"published", featured:false, visibility:"members", delivery:"Digital · manuelle Freigabe" },
  { id:3, title:"Studio Session Add-on", description:"Ergänzung zu einer bestätigten Session. Nur nach vorheriger Terminbestätigung verfügbar.", price:60, type:"session", status:"draft", featured:false, visibility:"house", delivery:"An bestätigte Session gebunden" }
];

const euro = (value:number) => new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(value);

export default function StorePage(){
  const [role,setRole]=useState<Role>("visitor");
  const [items,setItems]=useState(seed);
  const [filter,setFilter]=useState<"all"|ProductType>("all");
  const [query,setQuery]=useState("");
  const [cart,setCart]=useState<number[]>([]);
  const [title,setTitle]=useState("");
  const [price,setPrice]=useState("25");
  const [type,setType]=useState<ProductType>("digital");
  const [visibility,setVisibility]=useState<Product["visibility"]>("public");

  const visible=useMemo(()=>items.filter(p=>p.status==="published" && (filter==="all"||p.type===filter) && `${p.title} ${p.description}`.toLowerCase().includes(query.toLowerCase())),[items,filter,query]);
  const total=cart.reduce((sum,id)=>sum+(items.find(p=>p.id===id)?.price||0),0);
  const addDraft=()=>{ if(!title.trim()) return; setItems(v=>[{id:Date.now(),title:title.trim(),description:"Neues Produkt – Beschreibung vor Veröffentlichung ergänzen.",price:Number(price)||0,type,status:"draft",featured:false,visibility,delivery:type==="session"?"An Session gebunden":"Digital"},...v]); setTitle(""); };
  const cycle=(id:number)=>setItems(v=>v.map(p=>p.id===id?{...p,status:p.status==="draft"?"published":p.status==="published"?"archived":"draft"}:p));

  return <main className="storePage">
    <header className="storeHero">
      <div><Link href="/">← Zurück ins House</Link><span className="eyebrow">HOUSE OF DOMS · STORE</span><h1>House Store</h1><p>Digitale Inhalte, Aufgabenpakete und sessionbezogene Angebote an einem Ort. Preise, Sichtbarkeit und Veröffentlichung bleiben vollständig unter Kontrolle des House-Owners.</p></div>
      <div className="storeRole"><button className={role==="visitor"?"active":""} onClick={()=>setRole("visitor")}>Store ansehen</button><button className={role==="owner"?"active":""} onClick={()=>setRole("owner")}>Dom / Domina verwaltet</button></div>
    </header>

    {role==="visitor" ? <>
      <section className="storeToolbar"><input placeholder="Produkte durchsuchen …" value={query} onChange={e=>setQuery(e.target.value)}/><div>{(["all","digital","package","session"] as const).map(v=><button key={v} className={filter===v?"active":""} onClick={()=>setFilter(v)}>{v==="all"?"Alle":v==="digital"?"Digital":v==="package"?"Pakete":"Session"}</button>)}</div></section>
      <section className="productGrid">{visible.map(p=><article className={p.featured?"productCard featured":"productCard"} key={p.id}><div className="productVisual"><span>{p.featured?"FEATURED":"HOUSE EDITION"}</span><strong>{p.type==="digital"?"DIGITAL":p.type==="package"?"PACKAGE":"SESSION"}</strong></div><div className="productBody"><small>{p.visibility==="public"?"Öffentlich":p.visibility==="members"?"Nur Mitglieder":"Nur House"}</small><h2>{p.title}</h2><p>{p.description}</p><div className="delivery">{p.delivery}</div><footer><strong>{euro(p.price)}</strong><button onClick={()=>setCart(v=>v.includes(p.id)?v:[...v,p.id])}>{cart.includes(p.id)?"Im Warenkorb":"Hinzufügen"}</button></footer></div></article>)}</section>
      <aside className="cartBar"><div><span>Warenkorb</span><strong>{cart.length} Artikel · {euro(total)}</strong></div><button disabled={!cart.length}>Checkout später mit Zahlungsanbieter</button></aside>
    </> : <section className="ownerGrid">
      <div className="adminPanel"><span className="eyebrow">NEUES PRODUKT</span><h2>Store-Angebot vorbereiten</h2><label>Titel<input value={title} onChange={e=>setTitle(e.target.value)}/></label><label>Preis in €<input type="number" min="0" step="1" value={price} onChange={e=>setPrice(e.target.value)}/></label><label>Typ<select value={type} onChange={e=>setType(e.target.value as ProductType)}><option value="digital">Digitaler Inhalt</option><option value="package">Aufgabenpaket</option><option value="session">Session-Angebot</option></select></label><label>Sichtbarkeit<select value={visibility} onChange={e=>setVisibility(e.target.value as Product["visibility"])}><option value="public">Öffentlich</option><option value="members">Nur Mitglieder</option><option value="house">Nur House-Verbindungen</option></select></label><button className="primary" onClick={addDraft}>Als Entwurf anlegen</button><p className="hint">Produkte werden nie automatisch veröffentlicht. Inhalte und Preise können vor Freigabe geprüft werden.</p></div>
      <div className="adminPanel inventory"><span className="eyebrow">INVENTAR</span><h2>Produkte verwalten</h2>{items.map(p=><article key={p.id}><div><strong>{p.title}</strong><span>{euro(p.price)} · {p.type}</span></div><em className={p.status}>{p.status==="published"?"Veröffentlicht":p.status==="draft"?"Entwurf":"Archiviert"}</em><button onClick={()=>cycle(p.id)}>{p.status==="draft"?"Veröffentlichen":p.status==="published"?"Archivieren":"Zurück zu Entwurf"}</button></article>)}</div>
    </section>}

    <section className="storeNotice"><strong>Sicherer Store</strong><p>Nur volljährige Nutzer. Digitale Inhalte und sessionbezogene Angebote setzen Einvernehmlichkeit voraus. Keine Veröffentlichung privater Inhalte ohne ausdrückliche Freigabe. Zahlungen und Auszahlungen werden erst mit einem passenden Zahlungsanbieter aktiviert.</p></section>
  </main>;
}
