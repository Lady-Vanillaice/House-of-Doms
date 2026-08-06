"use client";

import { useState } from "react";
import "./task-ai-assistant.css";

type Proof = "text" | "image" | "video";
type Draft = { title:string; description:string; proof:Proof[]; releaseAt:string; dueAt:string };

function toLocalInput(date: Date) {
  const pad = (n:number) => String(n).padStart(2,"0");
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function TaskAiAssistant({ onApply }:{ onApply:(draft:Draft)=>void }) {
  const [prompt,setPrompt]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/ai/tasks", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ prompt }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "KI konnte keinen Entwurf erstellen.");
      const now = new Date();
      const release = new Date(now.getTime() + Number(data.releaseDelayHours || 0) * 3600000);
      const due = new Date(now.getTime() + Number(data.dueDelayHours || 24) * 3600000);
      onApply({ title:data.title, description:data.description, proof:data.proof, releaseAt:toLocalInput(release), dueAt:toLocalInput(due) });
    } catch (e) {
      setError(e instanceof Error ? e.message : "KI konnte keinen Entwurf erstellen.");
    } finally { setLoading(false); }
  };

  return <section className="taskAiBox">
    <div className="taskAiHead"><div><span>✦ KI-ASSISTENT</span><strong>Aufgabe vorschlagen lassen</strong></div><em>Entwurf · immer prüfbar</em></div>
    <p>Beschreibe kurz Ziel, Stil und Zeitraum. Die KI füllt Titel, Beschreibung, Nachweis und Zeitplanung vor. Du kannst danach alles ändern.</p>
    <textarea rows={4} value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Zum Beispiel: Eine ruhige Abendaufgabe zur Reflexion, morgen 20 Uhr sichtbar, Textnachweis." />
    <div className="taskAiActions"><button type="button" onClick={generate} disabled={loading||!prompt.trim()}>{loading?"KI erstellt Entwurf …":"✦ Entwurf erstellen"}</button><small>Nur freiwillige, einvernehmliche Aufgaben. Keine automatische Veröffentlichung.</small></div>
    {error&&<div className="taskAiError">{error}</div>}
  </section>;
}
