"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "../../../lib/supabase/client";
import "./public-site.css";

type Site={id:string;slug:string;display_name:string;headline:string;about_text:string;services_text:string;rules_text:string;pricing_text:string;faq_text:string;location_text:string;contact_note:string;theme:string;email_alias:string|null;instagram_url:string|null;website_url:string|null};
export default function PublicDominaSite(){
 const params=useParams<{slug:string}>(); const slug=String(params?.slug||""); const [site,setSite]=useState<Site|null>(null); const [loading,setLoading]=useState(true); const [message,setMessage]=useState(""); const [name,setName]=useState(""); const [email,setEmail]=useState(""); const [text,setText]=useState("");
 useEffect(()=>{void load()},[slug]);
 async function load(){if(!slug)return;const supabase=createClient();const {data,error}=await supabase.rpc("get_public_domina_site",{p_slug:slug});if(error){setMessage(error.message);setLoading(false);return;}setSite((data||[])[0]||null);setLoading(false)}
 async function contact(e:FormEvent){e.preventDefault();setMessage("");const supabase=createClient();const {error}=await supabase.rpc("submit_domina_site_inquiry",{p_slug:slug,p_sender_name:name,p_sender_email:email,p_message:text});if(error){setMessage(error.message);return;}setName("");setEmail("");setText("");setMessage("Deine Anfrage wurde über House of Doms übermittelt.");}
 if(loading)return <main className="publicDomina loading">Homepage wird geladen …</main>;
 if(!site)return <main className="publicDomina missing"><h1>Seite nicht gefunden</h1><p>Diese Domina-Homepage ist nicht veröffentlicht.</p><a href="/discover">Zurück zu Discover</a></main>;
 return <main className={`publicDomina ${site.theme}`}><nav><a href="/">HOUSE OF DOMS</a><div><a href="#about">Über mich</a><a href="#sessions">Sessions</a><a href="#kontakt">Kontakt</a></div></nav><header><span>PRIVATE PUBLIC PAGE · HOUSE OF DOMS</span><h1>{site.display_name}</h1><h2>{site.headline}</h2>{site.location_text&&<p>{site.location_text}</p>}<a className="cta" href="#kontakt">Kontakt aufnehmen</a></header>
 <section id="about" className="publicSection"><span>ÜBER MICH</span><h3>Persönlich. Klar. Eigenständig.</h3><p>{site.about_text}</p></section>
 <section id="sessions" className="split"><article><span>SESSIONS & ANGEBOT</span><h3>Was ich anbiete</h3><p>{site.services_text}</p></article><article><span>REGELN & RAHMEN</span><h3>Was wichtig ist</h3><p>{site.rules_text}</p></article></section>
 {(site.pricing_text||site.faq_text)&&<section className="split"><article><span>PREISE / TRIBUTE</span><h3>Rahmen</h3><p>{site.pricing_text}</p></article><article><span>FAQ</span><h3>Vorab wissen</h3><p>{site.faq_text}</p></article></section>}
 <section id="kontakt" className="contactSection"><div><span>KONTAKT</span><h3>Kontakt über House of Doms</h3><p>{site.contact_note||"Sende eine diskrete Anfrage über das Kontaktformular."}</p>{site.email_alias&&<div className="mailAlias"><strong>{site.email_alias}</strong><small>House-of-Doms-Adresse</small></div>}{site.instagram_url&&<a href={site.instagram_url} target="_blank">Instagram ↗</a>}{site.website_url&&<a href={site.website_url} target="_blank">Weitere Website ↗</a>}</div><form onSubmit={contact}><label>Name<input value={name} onChange={e=>setName(e.target.value)} required/></label><label>E-Mail<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>Nachricht<textarea rows={6} value={text} onChange={e=>setText(e.target.value)} required/></label><button>Diskret anfragen</button>{message&&<p className="formMessage">{message}</p>}</form></section><footer>Powered by House of Doms · Nur für Erwachsene · Einvernehmlichkeit und klare Grenzen</footer></main>;
}