"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import "./journal.css";

type Role = "dom" | "sub";
type ProofType = "text" | "image" | "video";
type ReviewStatus = "draft" | "submitted" | "approved" | "changes";
type Entry = { id:number; task:string; author:string; text:string; files:string[]; proof:ProofType[]; status:ReviewStatus; feedback?:string };

const tasks = [
  { id:1, title:"Abendreflexion", required:["text"] as ProofType[] },
  { id:2, title:"Outfit-Aufgabe", required:["image"] as ProofType[] },
  { id:3, title:"Trainingsroutine", required:["video","text"] as ProofType[] }
];

export default function JournalPage(){
  const [role,setRole]=useState<Role>("dom");
  const [entries,setEntries]=useState<Entry[]>([
    {id:1,task:"Abendreflexion",author:"Johnny",text:"Ich habe die Aufgabe durchgeführt und danach meine Gedanken notiert.",files:[],proof:["text"],status:"submitted"}
  ]);
  const [taskId,setTaskId]=useState(1);
  const [text,setText]=useState("");
  const [files,setFiles]=useState<string[]>([]);
  const selected=tasks.find(t=>t.id===taskId)!;
  const submitted=useMemo(()=>entries.filter(e=>e.status==="submitted"),[entries]);

  const submit=(e:FormEvent)=>{e.preventDefault(); const hasText=!selected.required.includes("text")||text.trim(); const hasFile=selected.required.every(r=>r==="text"||files.some(f=>f.startsWith(r+":"))); if(!hasText||!hasFile)return; setEntries(v=>[{id:Date.now(),task:selected.title,author:"Johnny",text:text.trim(),files,proof:selected.required,status:"submitted"},...v]); setText(""); setFiles([])};
  const upload=(type:"image"|"video",list:FileList|null)=>{if(!list?.length)return; setFiles(v=>[...v,...Array.from(list).map(f=>`${type}:${f.name}`)])};
  const review=(id:number,status:"approved"|"changes")=>setEntries(v=>v.map(e=>e.id===id?{...e,status,feedback:status==="approved"?"Nachweis bestätigt.":"Bitte ergänzen und erneut einreichen."}:e));

  return <main className="journalPage">
    <header><div><Link href="/">← Zurück ins House</Link><span>HOUSE OF DOMS</span><h1>Journal & Aufgabennachweise</h1><p>Einträge werden immer einer Aufgabe zugeordnet. Der Dom legt fest, ob Text, Bild, Video oder eine Kombination erforderlich ist.</p></div><div className="roleSwitch"><button className={role==="dom"?"active":""} onClick={()=>setRole("dom")}>Dom / Domina</button><button className={role==="sub"?"active":""} onClick={()=>setRole("sub")}>Sub / Sklave</button></div></header>

    <section className="notice"><strong>Klare Rollen</strong><span>Nur Doms erstellen Aufgaben und Nachweisanforderungen. Subs/Sklaven reichen den verlangten Nachweis ein. Private Journal-Einträge bleiben freiwillig.</span></section>

    {role==="sub" ? <section className="journalGrid">
      <form className="panel" onSubmit={submit}>
        <span className="eyebrow">SUB / SKLAVE</span><h2>Nachweis einreichen</h2>
        <label>Aufgabe<select value={taskId} onChange={e=>setTaskId(Number(e.target.value))}>{tasks.map(t=><option key={t.id} value={t.id}>{t.title}</option>)}</select></label>
        <div className="requirements"><strong>Erforderlich:</strong>{selected.required.map(r=><span key={r}>{r==="text"?"Text":r==="image"?"Bild":"Video"}</span>)}</div>
        {selected.required.includes("text")&&<label>Text / Reflexion<textarea rows={6} value={text} onChange={e=>setText(e.target.value)} placeholder="Schreibe nur, was für diese Aufgabe verlangt wird." /></label>}
        {selected.required.includes("image")&&<label className="upload">Bild hochladen<input type="file" accept="image/*" onChange={e=>upload("image",e.target.files)} /></label>}
        {selected.required.includes("video")&&<label className="upload">Video hochladen<input type="file" accept="video/*" onChange={e=>upload("video",e.target.files)} /></label>}
        {!!files.length&&<ul>{files.map(f=><li key={f}>{f.split(":")[1]}</li>)}</ul>}
        <button className="primary">Zur Prüfung einreichen</button>
      </form>
      <div className="panel"><span className="eyebrow">MEINE EINREICHUNGEN</span><h2>Status</h2>{entries.map(e=><article className="entry" key={e.id}><div><strong>{e.task}</strong><span>{e.status==="submitted"?"Zur Prüfung":e.status==="approved"?"Bestätigt":e.status==="changes"?"Ergänzung nötig":"Entwurf"}</span></div><p>{e.text||"Kein Text verlangt"}</p>{e.files.map(f=><small key={f}>{f.split(":")[1]}</small>)}{e.feedback&&<em>{e.feedback}</em>}</article>)}</div>
    </section> : <section className="panel reviewPanel">
      <span className="eyebrow">DOM / DOMINA</span><h2>Eingereichte Nachweise prüfen</h2>
      {submitted.length===0?<p>Keine offenen Nachweise.</p>:submitted.map(e=><article className="review" key={e.id}><div><strong>{e.author} · {e.task}</strong><span>{e.proof.map(p=>p==="text"?"Text":p==="image"?"Bild":"Video").join(" + ")}</span></div><p>{e.text||"Kein Text verlangt"}</p>{e.files.map(f=><button key={f}>{f.split(":")[1]} ansehen</button>)}<div className="actions"><button onClick={()=>review(e.id,"changes")}>Ergänzung anfordern</button><button className="primary" onClick={()=>review(e.id,"approved")}>Bestätigen</button></div></article>)}
    </section>}
  </main>
}
