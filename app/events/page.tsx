"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import "../growth/growth.css";

type E={id:number;title:string;host:string;city:string;date:string;type:string;capacity:number;booked:number};
const events:E[]=[
{id:1,title:"House Ritual Night",host:"Lady Vanillaice",city:"Berlin",date:"14.09.2026 · 20:00",type:"Studio Event",capacity:12,booked:12},
{id:2,title:"Discipline Workshop",host:"House of Doms",city:"Berlin",date:"28.09.2026 · 18:30",type:"Workshop",capacity:16,booked:11},
{id:3,title:"Online Command Session",host:"Featured Domina",city:"Online",date:"04.10.2026 · 21:00",type:"Online",capacity:20,booked:8}
];
export default function EventsPage(){const[joined,setJoined]=useState<number[]>([]);useEffect(()=>{try{setJoined(JSON.parse(localStorage.getItem('hod-event-waitlist')||'[]'))}catch{}},[]);function toggle(id:number){const next=joined.includes(id)?joined.filter(x=>x!==id):[...joined,id];setJoined(next);localStorage.setItem('hod-event-waitlist',JSON.stringify(next))}return <main className="growthPage"><header className="growthHero"><Link href="/">← Startseite</Link><span>HOUSE OF DOMS · EVENTS</span><h1>Events, Workshops<br/><em>und Sessions.</em></h1><p>Öffentliche Veranstaltungen, Gruppenformate und buchbare House-Termine. Bei ausgebuchten Events kannst du dich direkt auf die Warteliste setzen.</p></header><section className="growthPanel"><div className="metricGrid">{events.map(e=>{const full=e.booked>=e.capacity;return <article key={e.id}><span>{e.type} · {e.city}</span><b style={{fontSize:"1.7rem"}}>{e.title}</b><p className="lead">{e.host}<br/>{e.date}<br/>{e.booked}/{e.capacity} Plätze</p><div className="actionRow">{full?<button className={joined.includes(e.id)?"":"gold"} onClick={()=>toggle(e.id)}>{joined.includes(e.id)?"Von Warteliste entfernen":"Auf Warteliste"}</button>:<Link className="buttonLink" href="/anmelden">Platz anfragen</Link>}</div></article>})}</div><div className="actionRow"><Link className="buttonLink" href="/growth">Event verwalten →</Link></div></section></main>}
