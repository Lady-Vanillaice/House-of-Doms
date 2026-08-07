"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../lib/supabase/client";
import DomLiveMetrics from "./dom-live-metrics";
import SubLiveStatus from "./sub-live-status";
import "./dashboard.css";

type TaskFeedItem = { id:string; assigned_to:string; release_at:string; is_released:boolean; status:string; title?:string };

const cards=[
  ["Kammer","Nachrichten, Bilder, Videos und Aufgaben", "/kammer","✦"],
  ["Kalender","Studio-Zeiten, Sessions und Termine", "/kalender","◷"],
  ["Aufgaben","Aufgaben erstellen, Vorlagen und Nachweise", "/aufgaben","✓"],
  ["Mitglieder","Sub-Akten, Verlauf und House-Mitglieder", "/mitglieder","◎"],
  ["Timeline","Alle House-Aktivitäten chronologisch", "/timeline","⌁"],
  ["Keuschhaltung","Status, Check-ins und Vereinbarungen", "/keuschhaltung","◇"],
  ["Kassenbuch","Einnahmen, Ausgaben und Monatsübersicht", "/kassenbuch","€"]
] as const;
const activity=["Neue Nachrichten prüfen","Heutige Studio-Zeiten ansehen","Offene Aufgaben kontrollieren","House Timeline ansehen"];

function splitCountdown(ms:number){
  const safe=Math.max(0,ms);
  const total=Math.floor(safe/1000);
  const days=Math.floor(total/86400);
  const hours=Math.floor((total%86400)/3600);
  const minutes=Math.floor((total%3600)/60);
  const seconds=total%60;
  return {days,hours,minutes,seconds};
}

export default function DashboardPage(){
  const [role,setRole]=useState("");
  const [userId,setUserId]=useState("");
  const [tasks,setTasks]=useState<TaskFeedItem[]>([]);
  const [now,setNow]=useState(Date.now());
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    let alive=true;
    (async()=>{
      try{
        const supabase=createClient();
        const {data:auth}=await supabase.auth.getUser();
        if(!auth.user){ if(alive) setLoading(false); return; }
        if(alive) setUserId(auth.user.id);
        const {data:context}=await supabase.rpc("get_task_context");
        const ctx=Array.isArray(context)?context[0]:context;
        const nextRole=String(ctx?.role||auth.user.user_metadata?.role||"sub").toLowerCase();
        if(alive) setRole(nextRole);
        if(nextRole==="sub"||nextRole==="sklave"){
          const {data:feed}=await supabase.rpc("get_my_task_feed");
          if(alive) setTasks((feed||[]) as TaskFeedItem[]);
        }
      } finally { if(alive) setLoading(false); }
    })();
    return()=>{alive=false};
  },[]);

  useEffect(()=>{
    const timer=window.setInterval(()=>setNow(Date.now()),1000);
    return()=>window.clearInterval(timer);
  },[]);

  const isSub=role==="sub"||role==="sklave";
  const nextTask=useMemo(()=>tasks
    .filter(t=>t.assigned_to===userId&&!t.is_released&&new Date(t.release_at).getTime()>now)
    .sort((a,b)=>new Date(a.release_at).getTime()-new Date(b.release_at).getTime())[0]||null,[tasks,userId,now]);
  const countdown=splitCountdown(nextTask?new Date(nextTask.release_at).getTime()-now:0);
  const releaseLabel=nextTask?new Intl.DateTimeFormat("de-DE",{dateStyle:"full",timeStyle:"short"}).format(new Date(nextTask.release_at)):"";

  if(isSub&&!loading){
    return <main className="commandDashboard subDashboard">
      <section className="subCountdownHero">
        <span className="commandEyebrow">DEIN NÄCHSTER BEFEHL</span>
        <h1>{nextTask?"Bis zur nächsten Aufgabe":"Keine Aufgabe geplant"}</h1>
        {nextTask?<>
          <div className="countdownClock" aria-label={`Noch ${countdown.days} Tage ${countdown.hours} Stunden ${countdown.minutes} Minuten ${countdown.seconds} Sekunden`}>
            <div><strong>{String(countdown.days).padStart(2,"0")}</strong><span>TAGE</span></div><b>:</b>
            <div><strong>{String(countdown.hours).padStart(2,"0")}</strong><span>STD</span></div><b>:</b>
            <div><strong>{String(countdown.minutes).padStart(2,"0")}</strong><span>MIN</span></div><b>:</b>
            <div><strong>{String(countdown.seconds).padStart(2,"0")}</strong><span>SEK</span></div>
          </div>
          <p className="countdownRelease">Freigabe: {releaseLabel}</p>
          <p className="countdownSecret">Titel und Inhalt bleiben bis zur Freigabe verborgen.</p>
        </>:<p className="countdownSecret">Sobald eine neue Aufgabe geplant wurde, erscheint hier der Countdown.</p>}
        <Link className="countdownAction" href="/aufgaben">Zu meinen Aufgaben →</Link>
      </section>
      <SubLiveStatus/>
      <section className="subQuickGrid">
        <Link href="/kammer"><span>✦</span><strong>Kammer</strong><small>Nachrichten öffnen</small></Link>
        <Link href="/kalender"><span>◷</span><strong>Kalender</strong><small>Termine ansehen</small></Link>
        <Link href="/keuschhaltung"><span>◇</span><strong>Keuschhaltung</strong><small>Status & Check-ins</small></Link>
        <Link href="/profil"><span>◉</span><strong>Profil</strong><small>Mein Bereich</small></Link>
      </section>
    </main>;
  }

  return <main className="commandDashboard">
    <header className="commandHero"><div><span className="commandEyebrow">HOUSE OF DOMS · COMMAND CENTER</span><h1>Dein House.<br/><em>Alles unter Kontrolle.</em></h1><p>Live-Zahlen, Mitglieder, Aufgaben, Sessions, Timeline und Finanzen an einem Ort.</p></div><div className="commandSeal"><span>H</span><small>PRIVATE HOUSE OS</small></div></header>
    {!loading && <DomLiveMetrics/>}
    <section className="commandStrip"><Link href="/kammer"><span>Nachrichten</span><strong>Öffnen</strong></Link><Link href="/kalender"><span>Heute</span><strong>Kalender</strong></Link><Link href="/timeline"><span>Live</span><strong>Timeline</strong></Link><Link href="/mitglieder"><span>House</span><strong>Sub-Akten</strong></Link></section>
    <section className="commandGrid">{cards.map(([title,text,href,icon])=><Link className="commandCard" href={href} key={href}><i>{icon}</i><div><span>DIREKTZUGRIFF</span><h2>{title}</h2><p>{text}</p></div><b>→</b></Link>)}</section>
    <section className="commandLower"><article><span className="commandEyebrow">HEUTE</span><h2>Was als Nächstes ansteht</h2>{activity.map((x,i)=><Link key={x} href={["/kammer","/kalender","/aufgaben","/timeline"][i]}><em>0{i+1}</em><span>{x}</span><b>→</b></Link>)}</article><article className="housePortal"><span className="commandEyebrow">DEIN HOUSE</span><h2>Alle Werkzeuge.<br/>Eine Zentrale.</h2><p>Mitglieder, Timeline, Journal, Tribute, Studio, Homepage, Store, Keuschhaltung, Kassenbuch und Einstellungen liegen gesammelt im House-Bereich.</p><Link href="/house">House öffnen →</Link></article></section>
  </main>;
}
