"use client";

import { useMemo, useState } from "react";
import "./kammer.css";

type Thread = {id:number;name:string;role:string;unread:number;last:string;tribute?:string;messages:{from:"me"|"them";text:string;time:string}[]};
const threads:Thread[]=[
{id:1,name:"Sub Raven",role:"Sub",unread:2,last:"Nachweis ist hochgeladen.",messages:[{from:"them",text:"Guten Morgen. Der Nachweis ist hochgeladen.",time:"09:12"},{from:"me",text:"Ich sehe ihn mir später an. Danke.",time:"09:16"}]},
{id:2,name:"M. Obsidian",role:"Sklave",unread:0,last:"Session Samstag bestätigt.",tribute:"Tribute: 50 € bestätigt",messages:[{from:"me",text:"Die Session am Samstag ist bestätigt.",time:"Gestern"},{from:"them",text:"Verstanden. Danke.",time:"Gestern"}]},
{id:3,name:"Velvet",role:"Domina",unread:1,last:"Studio-Slot noch frei?",messages:[{from:"them",text:"Ist der Studio-Slot am Freitag noch frei?",time:"08:40"}]}
];

export default function ChamberPage(){
 const [active,setActive]=useState(1); const [query,setQuery]=useState(""); const [draft,setDraft]=useState("");
 const filtered=useMemo(()=>threads.filter(t=>t.name.toLowerCase().includes(query.toLowerCase())),[query]);
 const thread=threads.find(t=>t.id===active)??threads[0];
 return <main className="chamberPage"><section className="chamberShell">
  <aside className="threadRail"><div className="railHead"><span className="eyebrow">PRIVATE KAMMER</span><h1>Nachrichten</h1><input placeholder="Kontakte durchsuchen …" value={query} onChange={e=>setQuery(e.target.value)}/></div>
  <div className="threadList">{filtered.map(t=><button key={t.id} className={active===t.id?"threadButton active":"threadButton"} onClick={()=>setActive(t.id)}><span className="threadAvatar">{t.name.slice(0,2).toUpperCase()}</span><span className="threadCopy"><strong>{t.name}</strong><small>{t.last}</small></span>{t.unread>0&&<em>{t.unread}</em>}</button>)}</div></aside>
  <section className="conversationPane"><header className="conversationHead"><div><strong>{thread.name}</strong><span>{thread.role} · House-Verbindung aktiv</span></div><div className="headActions"><button>Profil</button><button>⋯</button></div></header>
  {thread.tribute&&<div className="tributeStrip"><span>◆</span><strong>{thread.tribute}</strong><a href="/tribute">Verlauf öffnen</a></div>}
  <div className="messageStream">{thread.messages.map((m,i)=><div key={i} className={m.from==="me"?"msgBubble mine":"msgBubble theirs"}><p>{m.text}</p><small>{m.time}</small></div>)}</div>
  <div className="attachmentPrep"><button title="Bild anhängen">＋ Bild</button><button title="Video anhängen">＋ Video</button><button title="Aufgabe verknüpfen">＋ Aufgabe</button><span>Medien-Upload wird morgen mit Supabase Storage verbunden.</span></div>
  <form className="composerBar" onSubmit={e=>{e.preventDefault();setDraft("")}}><input value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Nachricht schreiben …"/><button>Senden</button></form>
  </section>
 </section></main>
}
