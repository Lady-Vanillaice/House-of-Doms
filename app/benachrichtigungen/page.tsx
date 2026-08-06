"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import "../management.css";

type Kind="application"|"task"|"session"|"evidence"|"system";
type Item={id:number;kind:Kind;title:string;body:string;time:string;read:boolean;href:string};
const initial:Item[]=[
{id:1,kind:"application",title:"Neue Bewerbung",body:"Johnny hat eine Bewerbung an dein House gesendet.",time:"Vor 8 Min.",read:false,href:"/bewerbungen"},
{id:2,kind:"task",title:"Aufgabe wird bald freigegeben",body:"Eine geplante Aufgabe wird morgen um 18:00 sichtbar.",time:"Vor 32 Min.",read:false,href:"/aufgaben"},
{id:3,kind:"session",title:"Neue Session-Anfrage",body:"Ein Slot am 10.08. um 12:00 wurde angefragt.",time:"Vor 1 Std.",read:false,href:"/sessions"},
{id:4,kind:"evidence",title:"Nachweis eingereicht",body:"Zu „Journal-Reflexion“ wurde ein Textnachweis eingereicht.",time:"Gestern",read:true,href:"/journal"},
{id:5,kind:"system",title:"House-Einstellungen gespeichert",body:"Deine öffentlichen Profilangaben wurden aktualisiert.",time:"Gestern",read:true,href:"/house-einstellungen"}
];
const names:Record<Kind,string>={application:"Bewerbungen",task:"Aufgaben",session:"Sessions",evidence:"Nachweise",system:"System"};
export default function NotificationsPage(){
 const [items,setItems]=useState(initial); const [filter,setFilter]=useState<"all"|Kind|"unread">("all");
 const visible=useMemo(()=>items.filter(i=>filter==="all"||filter==="unread"?!i.read:i.kind===filter),[items,filter]);
 const mark=(id:number)=>setItems(list=>list.map(i=>i.id===id?{...i,read:true}:i));
 const unread=items.filter(i=>!i.read).length;
 return <main className="managementPage"><header className="managementHero"><div><Link href="/" className="backLink">← Zurück ins House</Link><span className="eyebrow">HOUSE OF DOMS</span><h1>Benachrichtigungen</h1><p>Alle wichtigen Ereignisse aus Bewerbungen, Aufgaben, Sessions und Nachweisen an einem Ort.</p></div><button className="primaryAction" onClick={()=>setItems(list=>list.map(i=>({...i,read:true})))}>Alle als gelesen markieren</button></header>
 <section className="statsRow"><article><span>Ungelesen</span><strong>{unread}</strong></article><article><span>Heute</span><strong>{items.filter(i=>i.time.includes("Min")||i.time.includes("Std")).length}</strong></article><article><span>Gesamt</span><strong>{items.length}</strong></article></section>
 <section className="notificationLayout"><aside className="filterPanel"><h2>Filter</h2>{(["all","unread","application","task","session","evidence","system"] as const).map(value=><button key={value} className={filter===value?"selected":""} onClick={()=>setFilter(value)}>{value==="all"?"Alle":value==="unread"?"Ungelesen":names[value]}</button>)}</aside><div className="notificationFeed">{visible.length===0&&<p className="emptyState">Keine Benachrichtigungen in diesem Filter.</p>}{visible.map(item=><article key={item.id} className={item.read?"read":"unread"}><button className="notificationMain" onClick={()=>mark(item.id)}><span className={`kindIcon ${item.kind}`}>{item.kind.slice(0,1).toUpperCase()}</span><div><small>{names[item.kind]} · {item.time}</small><h2>{item.title}</h2><p>{item.body}</p></div>{!item.read&&<i/>}</button><Link href={item.href} onClick={()=>mark(item.id)}>Öffnen →</Link></article>)}</div></section></main>;
}
