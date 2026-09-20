"use client";
import Link from "next/link";
import { useEffect,useState } from "react";
import { createClient } from "../../../lib/supabase/client";
import "../house.css";

export default function CreatorAiAssist(){
 const [allowed,setAllowed]=useState<boolean|null>(null);
 useEffect(()=>{(async()=>{const s=createClient();const {data:a}=await s.auth.getUser();if(!a.user){location.href="/anmelden";return}const {data:p}=await s.from("profiles").select("role").eq("id",a.user.id).maybeSingle();const role=String(p?.role||a.user.user_metadata?.role||"").toLowerCase();setAllowed(["dom","domina","creator"].includes(role));})()},[]);
 if(allowed===null)return <main className="houseHub"><header><span className="hubEyebrow">KI ASSIST</span><h1>Wird geladen …</h1></header></main>;
 if(!allowed)return <main className="houseHub"><header><span className="hubEyebrow">CREATOR BEREICH</span><h1>KI Assist ist für Creator.</h1><p>Dieser Bereich gehört zur Creator-Verwaltung im House.</p><Link href="/house">← Zurück zum House</Link></header></main>;
 return <main className="houseHub"><header><span className="hubEyebrow">✦ CREATOR · KI ASSIST</span><h1>Hilfe, genau dort<br/><em>wo du arbeitest.</em></h1><p>KI Assist unterstützt dich beim Antworten auf Nachrichten und beim Planen von Aufgaben. Vorschläge bleiben Entwürfe – du entscheidest und sendest oder speicherst selbst.</p></header><section className="hubGrid"><Link href="/kammer" className="hubCard"><span>01</span><div><h2>Nachrichten beantworten</h2><p>Chat öffnen und aus dem Gespräch einen passenden KI-Antwortentwurf erstellen.</p></div><b>→</b></Link><Link href="/aufgaben" className="hubCard"><span>02</span><div><h2>Aufgaben erstellen</h2><p>Ziel in eigenen Worten beschreiben und daraus eine konkrete Aufgabe vorbereiten lassen.</p></div><b>→</b></Link></section></main>;
}
