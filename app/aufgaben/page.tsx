"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import TaskAiAssistant from "./task-ai-assistant";
import "./tasks.css";

type Role="dom"|"sub";
type Proof="text"|"image"|"video";
type Task={id:number;title:string;description:string;releaseAt:string;dueAt:string;proof:Proof[];status:"planned"|"open"|"submitted"|"done"};

const now="2026-08-06T23:15";
const initial:Task[]=[
 {id:1,title:"Abendreflexion",description:"Beschreibe kurz, wie du die Aufgabe erlebt hast.",releaseAt:"2026-08-06T20:00",dueAt:"2026-08-07T22:00",proof:["text"],status:"open"},
 {id:2,title:"Verborgene Wochenaufgabe",description:"Dieser Inhalt wird erst zum Freigabezeitpunkt sichtbar.",releaseAt:"2026-08-09T09:00",dueAt:"2026-08-10T20:00",proof:["image","text"],status:"planned"}
];

export default function TasksPage(){
 const [role,setRole]=useState<Role>("dom"); const [items,setItems]=useState(initial);
 const [title,setTitle]=useState(""); const [description,setDescription]=useState(""); const [releaseAt,setReleaseAt]=useState("2026-08-09T09:00"); const [dueAt,setDueAt]=useState("2026-08-10T20:00"); const [proof,setProof]=useState<Proof[]>(["text"]);
 const visible=useMemo(()=>items.filter(t=>role==="dom"||t.releaseAt<=now),[items,role]);
 const plannedCount=items.filter(t=>t.releaseAt>now).length;
 const toggleProof=(p:Proof)=>setProof(v=>v.includes(p)?v.filter(x=>x!==p):[...v,p]);
 const add=(e:FormEvent)=>{e.preventDefault();if(!title.trim()||!releaseAt)return;setItems(v=>[{id:Date.now(),title:title.trim(),description:description.trim(),releaseAt,dueAt,proof,status:releaseAt>now?"planned":"open"},...v]);setTitle("");setDescription("")};
 const applyAiDraft=(draft:{title:string;description:string;proof:Proof[];releaseAt:string;dueAt:string})=>{setTitle(draft.title);setDescription(draft.description);setProof(draft.proof);setReleaseAt(draft.releaseAt);setDueAt(draft.dueAt)};
 return <main className="tasksPage"><header><div><Link href="/">← Zurück ins House</Link><span>HOUSE OF DOMS</span><h1>Aufgaben</h1><p>Doms können Aufgaben vorbereiten und zeitgesteuert freigeben. Subs sehen vorher nur, dass eine Aufgabe geplant ist.</p></div><div className="roleSwitch"><button className={role==="dom"?"active":""} onClick={()=>setRole("dom")}>Dom / Domina</button><button className={role==="sub"?"active":""} onClick={()=>setRole("sub")}>Sub / Sklave</button></div></header>
 {role==="sub"&&plannedCount>0&&<section className="teaser"><strong>{plannedCount} Aufgabe{plannedCount>1?"n":""} geplant</strong><span>Der Inhalt wird erst zum von der Domina festgelegten Zeitpunkt sichtbar.</span></section>}
 {role==="dom"?<section className="taskGrid"><form className="panel" onSubmit={add}><span className="eyebrow">DOM / DOMINA</span><h2>Aufgabe vorbereiten</h2><TaskAiAssistant onApply={applyAiDraft}/><label>Titel<input value={title} onChange={e=>setTitle(e.target.value)}/></label><label>Beschreibung<textarea rows={5} value={description} onChange={e=>setDescription(e.target.value)}/></label><label>Sichtbar ab<input type="datetime-local" value={releaseAt} onChange={e=>setReleaseAt(e.target.value)}/></label><label>Fällig bis<input type="datetime-local" value={dueAt} onChange={e=>setDueAt(e.target.value)}/></label><div className="proofs"><strong>Nachweis</strong>{(["text","image","video"] as Proof[]).map(p=><button type="button" className={proof.includes(p)?"selected":""} onClick={()=>toggleProof(p)} key={p}>{p==="text"?"Text":p==="image"?"Bild":"Video"}</button>)}</div><button className="primary">Aufgabe speichern</button></form><TaskList items={items} dom/></section>:<TaskList items={visible}/>} </main>
}
function TaskList({items,dom=false}:{items:Task[];dom?:boolean}){return <section className="panel list"><span className="eyebrow">{dom?"GEPLANTE UND AKTIVE AUFGABEN":"MEINE AUFGABEN"}</span><h2>Übersicht</h2>{items.map(t=><article className="task" key={t.id}><div><strong>{t.title}</strong><span>{t.status==="planned"?"Geplant":t.status==="open"?"Offen":t.status}</span></div><p>{t.description}</p><small>Sichtbar ab: {t.releaseAt.replace("T"," · ")}</small><small>Fällig: {t.dueAt.replace("T"," · ")}</small><em>Nachweis: {t.proof.map(p=>p==="text"?"Text":p==="image"?"Bild":"Video").join(" + ")}</em>{!dom&&t.status==="open"&&<Link href="/journal">Nachweis einreichen</Link>}</article>)}</section>}
