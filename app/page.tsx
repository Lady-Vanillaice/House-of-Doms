"use client";

import { FormEvent, useMemo, useState } from "react";

type Role = "dom" | "sub";
type TaskStatus = "Offen" | "Zur Prüfung" | "Erledigt";
type Task = { id: number; title: string; due: string; points: number; status: TaskStatus };
type ChatMessage = { id: number; direction: "incoming" | "outgoing"; text: string };

const initialTasks: Task[] = [
  { id: 1, title: "Morgenroutine abschließen", due: "Heute · 09:00", points: 25, status: "Erledigt" },
  { id: 2, title: "Reflexion im Journal", due: "Heute · 20:00", points: 40, status: "Offen" },
  { id: 3, title: "Wochenziel bestätigen", due: "Morgen", points: 60, status: "Zur Prüfung" },
];

const initialMessages: ChatMessage[] = [
  { id: 1, direction: "incoming", text: "Guten Abend. Ich habe die Aufgabe erhalten." },
  { id: 2, direction: "outgoing", text: "Gut. Trage anschließend deine Reflexion im Journal ein." },
  { id: 3, direction: "incoming", text: "Ja, verstanden." },
];

export default function Home() {
  const [entered, setEntered] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [role, setRole] = useState<Role>("dom");
  const [displayName, setDisplayName] = useState("Lady Vanillaice");
  const [relationshipStyle, setRelationshipStyle] = useState("Exclusive Dynamic");
  const [active, setActive] = useState("Command Center");
  const [tasks, setTasks] = useState(initialTasks);
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");

  const completed = useMemo(() => tasks.filter((task) => task.status === "Erledigt").length, [tasks]);
  const xp = useMemo(() => tasks.filter((task) => task.status === "Erledigt").reduce((sum, task) => sum + task.points, 0), [tasks]);
  const initials = displayName.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  const toggleTask = (id: number) => setTasks((current) => current.map((task) => task.id === id ? { ...task, status: task.status === "Erledigt" ? "Offen" : "Erledigt" } : task));
  const addTask = () => setTasks((current) => [...current, { id: Date.now(), title: "Neue persönliche Aufgabe", due: "Ohne Frist", points: 20, status: "Offen" }]);
  const sendMessage = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;
    setMessages((current) => [...current, { id: Date.now(), direction: "outgoing", text: draft.trim() }]);
    setDraft("");
  };

  if (!entered) {
    return <main className="landing">
      <div className="ambient ambientOne" /><div className="ambient ambientTwo" />
      <header className="topbar"><div className="brand"><span className="crest">H</span><span>HOUSE OF DOMS</span></div><span className="adult">18+ · CONSENT FIRST</span></header>
      <section className="hero">
        <div className="eyebrow">A PRIVATE DIGITAL HOUSE</div>
        <h1>My House.<br />My Rules.<br /><em>My Command.</em></h1>
        <p>Eine persönliche Plattform für einvernehmliche D/s-Dynamiken: private Nachrichten, Aufgaben, Journals, Fortschritt und digitale Inhalte an einem geschützten Ort.</p>
        <div className="roleChoice">
          <button className={role === "dom" ? "selected" : ""} onClick={() => setRole("dom")}><strong>DOM / DOMINA</strong><span>Mein persönliches House führen</span></button>
          <button className={role === "sub" ? "selected" : ""} onClick={() => setRole("sub")}><strong>SUB / SKLAVE</strong><span>Eine persönliche Verbindung betreten</span></button>
        </div>
        <button className="enterButton" onClick={() => setEntered(true)}>ENTER THE HOUSE <span>→</span></button>
        <small>Nur für volljährige Personen. Freiwilligkeit und Einvernehmlichkeit sind Voraussetzung.</small>
      </section>
      <section className="doorStage"><div className="doorFrame"><div className="door"><div className="doorMark">H</div><div className="handle" /></div></div><div className="doorCaption"><span>THE OBSIDIAN DOOR</span><strong>Dein Eingang. Deine Atmosphäre.</strong></div></section>
    </main>;
  }

  if (!configured) {
    return <main className="onboarding"><section className="setupCard"><div className="crest large">H</div><span className="eyebrow">WELCOME INSIDE</span><h1>Richte dein persönliches House ein.</h1><p>Diese Alpha speichert die Angaben vorerst nur während deines Besuchs. Benutzerkonten und Datenbank folgen als nächster Schritt.</p><label>Anzeigename<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></label><label>Beziehungsstil<select value={relationshipStyle} onChange={(event) => setRelationshipStyle(event.target.value)}><option>Exclusive Dynamic</option><option>Private Circle</option><option>Community</option></select></label><button className="enterButton" onClick={() => setConfigured(true)}>CREATE MY HOUSE <span>→</span></button></section></main>;
  }

  const nav = ["Command Center", "Private Chamber", "Tasks", "Journal", "House Store", "Calendar", "Applications", "House Settings"];
  return <main className="appShell">
    <aside className="sidebar">
      <div className="brand"><span className="crest">H</span><span>HOUSE OF DOMS</span></div>
      <div className="houseIdentity"><span>HOUSE OF</span><strong>{displayName}</strong><small>{relationshipStyle} · Applications Open</small></div>
      <nav>{nav.map((item) => <button key={item} className={active === item ? "active" : ""} onClick={() => setActive(item)}>{item}</button>)}</nav>
      <button className="leave" onClick={() => { setEntered(false); setConfigured(false); }}>← Zur Eingangstür</button>
    </aside>
    <section className="workspace">
      <header className="workspaceHeader"><div><span className="eyebrow">WELCOME HOME</span><h2>{active}</h2></div><div className="profileChip"><span>{initials}</span><div><strong>{displayName}</strong><small>{role === "dom" ? "Dom / Domina" : "Sub / Sklave"}</small></div></div></header>
      {active === "Command Center" && <>
        <section className="welcomeCard"><div><span className="eyebrow">HOUSE STATUS · PRIVATE</span><h3>Dein House ist bereit.</h3><p>Aufgaben, Nachrichten und persönliche Momente an einem Ort.</p></div><div className="keyCard"><span>HOUSE KEY</span><strong>HOD-0001</strong><small>Obsidian · Alpha</small></div></section>
        <section className="stats"><article><span>Offene Aufgaben</span><strong>{tasks.filter((task) => task.status !== "Erledigt").length}</strong><small>{completed} abgeschlossen</small></article><article><span>Nachrichten</span><strong>{messages.length}</strong><small>Private Chamber</small></article><article><span>House XP</span><strong>{xp}</strong><small>Level 3</small></article><article><span>Beziehungsstil</span><strong className="smallStat">{relationshipStyle}</strong><small>individuell gewählt</small></article></section>
        <section className="gridTwo"><div className="panel"><div className="panelHead"><div><span className="eyebrow">TODAY</span><h3>Aufgaben</h3></div><button onClick={() => setActive("Tasks")}>Alle ansehen</button></div>{tasks.slice(0, 3).map((task) => <TaskRow key={task.id} task={task} onToggle={toggleTask} />)}</div><div className="panel"><div className="panelHead"><div><span className="eyebrow">PRIVATE CHAMBER</span><h3>Persönliche Nachrichten</h3></div><button onClick={() => setActive("Private Chamber")}>Öffnen</button></div><Message initial="J" name="Johnny" text={messages[messages.length - 1]?.text ?? "Noch keine Nachricht"} time="gerade eben" /></div></section>
      </>}
      {active === "Tasks" && <section className="panel full"><div className="panelHead"><div><span className="eyebrow">STRUCTURE & PROGRESS</span><h3>Aufgaben</h3></div><button onClick={addTask}>+ Aufgabe erstellen</button></div>{tasks.map((task) => <TaskRow key={task.id} task={task} onToggle={toggleTask} />)}<div className="notice">Konsequenzen dürfen nur auf vorheriger, freiwilliger Vereinbarung beruhen. Keine Drohungen, Erpressung oder Veröffentlichung privater Inhalte.</div></section>}
      {active === "Private Chamber" && <section className="chatLayout"><div className="threads"><button className="thread activeThread"><span>J</span><div><strong>Johnny</strong><small>Online</small></div></button></div><div className="conversation"><div className="chatHead"><div><strong>Private Chamber · Johnny</strong><small>Persönlicher Bereich</small></div><button>⋯</button></div><div className="messages">{messages.map((message) => <div key={message.id} className={`bubble ${message.direction}`}>{message.text}</div>)}</div><form className="composer" onSubmit={sendMessage}><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Persönliche Nachricht schreiben …" /><button type="submit">Senden</button></form></div></section>}
      {active === "House Store" && <section className="storeGrid"><article className="productCard"><span className="productVisual">PRIVATE</span><h3>Persönliches Aufgabenpaket</h3><p>Demo-Produkt für den späteren digitalen House Store.</p><strong>19,00 €</strong><button>Noch nicht verfügbar</button></article><article className="productCard"><span className="productVisual">MEMBERS</span><h3>Exklusiver House-Beitrag</h3><p>Vorschau für geschützte Bilder, Videos und Beiträge.</p><strong>9,00 €</strong><button>Noch nicht verfügbar</button></article></section>}
      {!["Command Center", "Tasks", "Private Chamber", "House Store"].includes(active) && <section className="panel full placeholder"><span className="eyebrow">ALPHA MODULE</span><h3>{active}</h3><p>Dieses Modul ist als nächster Entwicklungsschritt vorbereitet.</p></section>}
    </section>
  </main>;
}

function TaskRow({ task, onToggle }: { task: Task; onToggle: (id: number) => void }) {
  return <div className="taskRow"><button className={task.status === "Erledigt" ? "check done" : "check"} onClick={() => onToggle(task.id)}>{task.status === "Erledigt" ? "✓" : ""}</button><div className="taskText"><strong>{task.title}</strong><small>{task.due}</small></div><span className="status">{task.status}</span><strong className="points">+{task.points} XP</strong></div>;
}

function Message({ initial, name, text, time }: { initial: string; name: string; text: string; time: string }) {
  return <div className="message"><span>{initial}</span><div><strong>{name}</strong><p>{text}</p><small>{time}</small></div></div>;
}
