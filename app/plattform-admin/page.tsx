"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {createClient} from "../../lib/supabase/client";
import "./admin.css";
type M={users:number;houses:number;messages:number;tasks:number;bookings:number;storage_objects:number};
export default function PlatformAdmin(){const[m,setM]=useState<M|null>(null),[msg,setMsg]=useState("");useEffect(()=>{(async()=>{const s=createClient();const{data,error}=await s.rpc('get_platform_admin_metrics');if(error)setMsg('Kein Plattform-Admin-Zugriff.');else setM((data||[])[0]||null)})()},[]);return <main className="platformAdmin"><header><Link href="/dashboard">← Dashboard</Link><span>PLATTFORM ADMIN</span><h1>House of Doms · Systemstatus</h1><p>Nur für explizit freigeschaltete Plattform-Admins.</p></header>{msg&&<section className="adminGate">{msg}</section>}{m&&<section className="adminGrid"><article><span>Nutzer</span><strong>{m.users}</strong></article><article><span>Houses</span><strong>{m.houses}</strong></article><article><span>Nachrichten</span><strong>{m.messages}</strong></article><article><span>Aufgaben</span><strong>{m.tasks}</strong></article><article><span>Buchungen</span><strong>{m.bookings}</strong></article><article><span>Storage-Dateien</span><strong>{m.storage_objects}</strong></article></section>}</main>}
