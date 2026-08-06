"use client";

import { useMemo, useState } from "react";

type Role = "dom" | "sub";
type TaskStatus = "Offen" | "Zur Prüfung" | "Erledigt";
type Task = { id: number; title: string; due: string; points: number; status: TaskStatus };

const initialTasks: Task[] = [
  { id: 1, title: "Morgenroutine abschließen", due: "Heute · 09:00", points: 25, status: "Erledigt" },
  { id: 2, title: "Reflexion im Journal", due: "Heute · 20:00", points: 40, status: "Offen" },
  { id: 3, title: "Wochenziel bestätigen", due: "Morgen", points: 60, status: "Zur Prüfung" },
];

export default function Home() {
  const [entered, setEntered] = useState(false);
  const [role, setRole] = useState<Role>("dom");
  const [active, setActive] = useState("Command Center");
  const [tasks, setTasks] = useState(initialTasks);
  const completed = useMemo(() => tasks.filter((task) => task.status === "Erledigt").length, [tasks]);
  const xp = useMemo(() => tasks.filter((task) => task.status === "Erledigt").reduce((sum, task) => sum + task.points, 0), [tasks]);

  const toggleTask = (id: number) => setTasks((current) => current.map((task) => task.id === id ? { ...task, status: task.status === "Erledigt" ? "Offen" : "Erledigt" } : task));

  if (!entered) {
    return <main className="landing">
      <div className="ambient ambientOne" /><div className="ambient ambientTwo" />
      <header className="topbar"><div className="brand"><span className="crest">H</span><span>HOUSE OF DOMS</span></div><span className="adult">18+ · CONSENT FIRST</span></header>
      <section className="hero">
        <div className="eyebrow">A PRIVATE DIGITAL HOUSE</div>
        <h1>My House.<br />My Rules.<br /><em>My Command.</em></h1>
        <p>Eine persönliche Plattform für einvernehmliche D/s-Dynamiken: private Nachrichten, Aufgaben, Journals, Fortschritt und digitale Inhalte an einem sicheren Ort.</p>
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

  const nav = ["Command Center", "Private Chamber", "Tasks", "Journal", "House Store", "Calendar", "Applications", "House Settings"];
  return <main className="appShell">
    <aside className="sidebar">
      <div className="brand"><span className="crest">H</span><span>HOUSE OF DOMS</span></div>
      <div className="houseIdentity"><span>HOUSE OF</span><strong>Lady Vanillaice</strong><small>Exclusive Dynamic · Applications Open</small></div>
      <nav>{nav.map((item) => <button key={item} className={active === item ? "active" : ""} onClick={() => setActive(item)}>{item}</button>)}</nav>
      <button className="leave" onClick={() => setEntered(false)}>← Zur Eingangstür</button>
    </aside>
    <section className="workspace">
      <header className="workspaceHeader"><div><span className="eyebrow">WELCOME HOME</span><h2>{active}</h2></div><div className="profileChip"><span>LV</span><div><strong>Lady Vanillaice</strong><small>{role === "dom" ? "Domina" : "Sub / Sklave"}</small></div></div></header>
      {active === "Command Center" && <>
        <section className="welcomeCard"><div><span className="eyebrow">HOUSE STATUS · PRIVATE</span><h3>Dein House ist bereit.</h3><p>Nachrichten, Aufgaben und persönliche Momente bleiben in deinem geschützten Bereich.</p></div><div className="keyCard"><span>HOUSE KEY</span><strong>HV-0001</strong><small>Obsidian · Verified</small></div></section>
        <section className="stats"><article><span>Offene Aufgaben</span><strong>{tasks.filter((task) => task.status !== "Erledigt").length}</strong><small>{completed} abgeschlossen</small></article><article><span>Nachrichten</span><strong>4</strong><small>2 ungelesen</small></article><article><span>House XP</span><strong>{xp}</strong><small>Level 3</small></article><article><span>Konsequenzen</span><strong>1</strong><small>einvernehmlich vereinbart</small></article></section>
        <section className="gridTwo"><div className="panel"><div className="panelHead"><div><span className="eyebrow">TODAY</span><h3>Aufgaben</h3></div><button onClick={() => setActive("Tasks")}>Alle ansehen</button></div>{tasks.map((task) => <TaskRow key={task.id} task={task} onToggle={toggleTask} />)}</div><div className="panel"><div className="panelHead"><div><span className="eyebrow">PRIVATE CHAMBER</span><h3>Letzte Nachrichten</h3></div><button onClick={() => setActive("Private Chamber")}>Öffnen</button></div><Message initial="LV" name="Lady Vanillaice" text="Deine nächste Aufgabe wartet im House." time="vor 12 Minuten" /><Message initial="J" name="Johnny" text="Der Journaleintrag ist bereit." time="vor 38 Minuten" /></div></section>
      </>}
      {active === "Tasks" && <section className="panel full"><div className="panelHead"><div><span className="eyebrow">STRUCTURE & PROGRESS</span><h3>Aufgaben</h3></div><button>+ Aufgabe erstellen</button></div>{tasks.map((task) => <TaskRow key={task.id} task={task} onToggle={toggleTask} />)}<div className="notice">Konsequenzen dürfen nur auf vorheriger, freiwilliger Vereinbarung beruhen. Keine Drohungen, Erpressung oder Veröffentlichung privater Inhalte.</div></section>}
      {active === "Private Chamber" && <section className="chatLayout"><div className="threads"><button className="thread activeThread"><span>J</span><div><strong>Johnny</strong><small>Online</small></div></button></div><div className="conversation"><div className="chatHead"><div><strong>Private Chamber · Johnny</strong><small>Persönlicher Bereich</small></div><button>⋯</button></div><div className="messages"><div className="bubble incoming">Guten Abend. Ich habe die Aufgabe erhalten.</div><div className="bubble outgoing">Gut. Trage anschließend deine Reflexion im Journal ein.</div><div className="bubble incoming">Ja, verstanden.</div></div><div className="composer"><input placeholder="Persönliche Nachricht schreiben …" /><button>Senden</button></div></div></section>}
      {!["Command Center", "Tasks", "Private Chamber"].includes(active) && <section className="panel full placeholder"><span className="eyebrow">ALPHA MODULE</span><h3>{active}</h3><p>Dieses Modul folgt im nächsten Entwicklungsschritt. Navigation und Design stehen bereits.</p></section>}
    </section>
  </main>;
}

function TaskRow({ task, onToggle }: { task: Task; onToggle: (id: number) => void }) {
  return <div className="taskRow"><button className={task.status === "Erledigt" ? "check done" : "check"} onClick={() => onToggle(task.id)}>{task.status === "Erledigt" ? "✓" : ""}</button><div className="taskText"><strong>{task.title}</strong><small>{task.due}</small></div><span className="status">{task.status}</span><strong className="points">+{task.points} XP</strong></div>;
}

function Message({ initial, name, text, time }: { initial: string; name: string; text: string; time: string }) {
  return <div className="message"><span>{initial}</span><div><strong>{name}</strong><p>{text}</p><small>{time}</small></div></div>;
}
