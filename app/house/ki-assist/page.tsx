"use client";
import Link from "next/link";
import { useEffect,useState } from "react";
import { createClient } from "../../../lib/supabase/client";
import "../house.css";

type Mode="messages"|"tasks";

export default function CreatorAiAssist(){
 const [allowed,setAllowed]=useState<boolean|null>(null);
 const [mode,setMode]=useState<Mode>("messages");
 const [messageInput,setMessageInput]=useState("Hey, ich bin neu hier. Wie läuft eine Session bei dir normalerweise ab und was sollte ich vorher wissen?");
 const [taskInput,setTaskInput]=useState("Ich bin neu als Creator und möchte mein Business Schritt für Schritt aufbauen.");
 const [output,setOutput]=useState("");
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");

 useEffect(()=>{(async()=>{const s=createClient();const {data:a}=await s.auth.getUser();if(!a.user){location.href="/anmelden";return}const {data:p}=await s.from("profiles").select("role").eq("id",a.user.id).maybeSingle();const role=String(p?.role||a.user.user_metadata?.role||"").toLowerCase();setAllowed(["dom","domina","creator"].includes(role));})()},[]);

 async function runDemo(){
   setLoading(true);setError("");setOutput("");
   try{
     const response=mode==="messages"
       ?await fetch("/api/ai/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{direction:"incoming",text:messageInput}],tone:"freundlich, klar, professionell"})})
       :await fetch("/api/ai/tasks",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:taskInput})});
     const data=await response.json();
     if(!response.ok)throw new Error([data.error,data.detail].filter(Boolean).join(" — ")||"KI Assist konnte keinen Entwurf erstellen.");
     if(mode==="messages")setOutput(data.draft||"");
     else setOutput([data.title,data.description,`Nachweis: ${(data.proof||[]).join(", ")}`,`Freigabe in: ${data.releaseDelayHours||0} Std. · Fällig in: ${data.dueDelayHours||24} Std.`].filter(Boolean).join("\n\n"));
   }catch(e){setError(e instanceof Error?e.message:"KI Assist konnte keinen Entwurf erstellen.");}
   finally{setLoading(false);}
 }

 if(allowed===null)return <main className="houseHub"><header><span className="hubEyebrow">KI ASSIST</span><h1>Wird geladen …</h1></header></main>;
 if(!allowed)return <main className="houseHub"><header><span className="hubEyebrow">CREATOR BEREICH</span><h1>KI Assist ist für Creator.</h1><p>Dieser Bereich gehört zur Creator-Verwaltung im House.</p><Link href="/house">← Zurück zum House</Link></header></main>;

 return <main className="houseHub">
   <header><span className="hubEyebrow">✦ CREATOR · KI ASSIST</span><h1>Hilfe, genau dort<br/><em>wo du arbeitest.</em></h1><p>Hier kannst du KI Assist direkt ausprobieren – ohne echten Chatpartner und ohne eine Aufgabe zu speichern.</p></header>

   <section className="aiPlayground">
     <div className="aiPlayTabs">
       <button className={mode==="messages"?"active":""} onClick={()=>{setMode("messages");setOutput("");setError("");}}>Nachrichten testen</button>
       <button className={mode==="tasks"?"active":""} onClick={()=>{setMode("tasks");setOutput("");setError("");}}>Aufgaben testen</button>
     </div>

     <div className="aiPlayGrid">
       <div className="aiPlayPanel">
         <span className="hubEyebrow">{mode==="messages"?"TEST-NACHRICHT":"TEST-AUFGABE"}</span>
         <h2>{mode==="messages"?"So würde dir jemand schreiben":"Beschreibe einfach dein Ziel"}</h2>
         <p>{mode==="messages"?"Du kannst den Beispieltext verändern. KI Assist formuliert daraus nur einen Antwortentwurf.":"Schreib in normalen Worten, wobei du Hilfe brauchst. KI Assist macht daraus eine strukturierte Aufgabe."}</p>
         <textarea rows={8} value={mode==="messages"?messageInput:taskInput} onChange={e=>mode==="messages"?setMessageInput(e.target.value):setTaskInput(e.target.value)} />
         <button className="aiPlayRun" onClick={()=>void runDemo()} disabled={loading||!(mode==="messages"?messageInput.trim():taskInput.trim())}>{loading?"KI Assist arbeitet …":mode==="messages"?"✦ Antwort vorschlagen":"✦ Aufgabe vorschlagen"}</button>
         {error&&<div className="aiPlayError">{error}</div>}
       </div>

       <div className="aiPlayPanel result">
         <span className="hubEyebrow">KI-ENTWURF</span>
         <h2>{output?"So könnte es aussehen":"Noch kein Entwurf"}</h2>
         {output?<pre>{output}</pre>:<p>Klicke links auf den KI-Button. Der Entwurf erscheint hier. Er wird weder gesendet noch gespeichert.</p>}
       </div>
     </div>

     <div className="aiPlayExplain">
       <strong>So funktioniert es später im Alltag:</strong>
       <span>1. Nachricht oder Ziel kommt rein.</span>
       <span>2. KI Assist erstellt einen Entwurf.</span>
       <span>3. Du prüfst und änderst ihn.</span>
       <span>4. Erst du entscheidest über Senden oder Speichern.</span>
     </div>
   </section>

   <section className="hubGrid"><Link href="/kammer" className="hubCard"><span>01</span><div><h2>Nachrichten beantworten</h2><p>Im echten Chat aus dem Gespräch einen KI-Antwortentwurf erstellen.</p></div><b>→</b></Link><Link href="/aufgaben" className="hubCard"><span>02</span><div><h2>Aufgaben erstellen</h2><p>Im Aufgabenbereich KI-Vorschläge direkt in die Eingabefelder übernehmen.</p></div><b>→</b></Link></section>
 </main>;
}
