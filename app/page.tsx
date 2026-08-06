"use client";

import { FormEvent, useMemo, useState } from "react";

type Lang = "de" | "en";
type Role = "dom" | "sub";
type TaskStatus = "open" | "review" | "done";
type Task = { id: number; titleDe: string; titleEn: string; dueDe: string; dueEn: string; points: number; status: TaskStatus };
type ChatMessage = { id: number; direction: "incoming" | "outgoing"; de: string; en: string };

const copy = {
  de: {
    adult: "18+ · EINVERNEHMLICHKEIT ZUERST", eyebrow: "EIN PRIVATES DIGITALES HOUSE", slogan1: "Mein House.", slogan2: "Meine Regeln.", slogan3: "Mein Kommando.",
    intro: "Eine persönliche Plattform für einvernehmliche D/s-Dynamiken: private Nachrichten, Aufgaben, Journals, Fortschritt und digitale Inhalte an einem geschützten Ort.",
    dom: "DOM / DOMINA", domSub: "Mein persönliches House führen", sub: "SUB / SKLAVE", subSub: "Eine persönliche Verbindung betreten", enter: "HOUSE BETRETEN",
    legal: "Nur für volljährige Personen. Freiwilligkeit und Einvernehmlichkeit sind Voraussetzung.", door: "DIE OBSIDIAN-TÜR", doorSub: "Dein Eingang. Deine Atmosphäre.",
    welcomeInside: "WILLKOMMEN IM HOUSE", setupTitle: "Richte dein persönliches House ein.", setupText: "Diese Alpha speichert die Angaben vorerst nur während deines Besuchs. Benutzerkonten und Datenbank folgen als nächster Schritt.",
    displayName: "Anzeigename", relationship: "Beziehungsstil", createHouse: "MEIN HOUSE ERSTELLEN", exclusive: "Exklusive Dynamik", circle: "Privater Kreis", community: "Community",
    nav: ["Kommandozentrale", "Private Kammer", "Aufgaben", "Journal", "House Store", "Kalender", "Bewerbungen", "House-Einstellungen"],
    houseOf: "HOUSE VON", applicationsOpen: "Bewerbungen offen", leave: "← Zur Eingangstür", welcomeHome: "WILLKOMMEN ZU HAUSE",
    houseStatus: "HOUSE-STATUS · PRIVAT", ready: "Dein House ist bereit.", readyText: "Aufgaben, Nachrichten und persönliche Momente an einem Ort.", houseKey: "HOUSE-SCHLÜSSEL",
    openTasks: "Offene Aufgaben", completed: "abgeschlossen", messages: "Nachrichten", chamber: "Private Kammer", houseXp: "House XP", relationshipStyle: "Beziehungsstil", chosen: "individuell gewählt",
    today: "HEUTE", tasks: "Aufgaben", viewAll: "Alle ansehen", personalMessages: "Persönliche Nachrichten", open: "Öffnen", justNow: "gerade eben", noMessage: "Noch keine Nachricht",
    structure: "STRUKTUR & FORTSCHRITT", createTask: "+ Aufgabe erstellen", consentNotice: "Konsequenzen dürfen nur auf vorheriger, freiwilliger Vereinbarung beruhen. Keine Drohungen, Erpressung oder Veröffentlichung privater Inhalte.",
    personalArea: "Persönlicher Bereich", messagePlaceholder: "Persönliche Nachricht schreiben …", send: "Senden", product1: "Persönliches Aufgabenpaket", product1Text: "Demo-Produkt für den späteren digitalen House Store.", product2: "Exklusiver House-Beitrag", product2Text: "Vorschau für geschützte Bilder, Videos und Beiträge.", unavailable: "Noch nicht verfügbar",
    alpha: "ALPHA-MODUL", nextStep: "Dieses Modul ist als nächster Entwicklungsschritt vorbereitet.", statusOpen: "Offen", statusReview: "Zur Prüfung", statusDone: "Erledigt", newTask: "Neue persönliche Aufgabe", noDue: "Ohne Frist"
  },
  en: {
    adult: "18+ · CONSENT FIRST", eyebrow: "A PRIVATE DIGITAL HOUSE", slogan1: "My House.", slogan2: "My Rules.", slogan3: "My Command.",
    intro: "A personal platform for consensual D/s dynamics: private messages, tasks, journals, progress and digital content in one protected place.",
    dom: "DOM / DOMME", domSub: "Lead my personal House", sub: "SUB / SLAVE", subSub: "Enter a personal connection", enter: "ENTER THE HOUSE",
    legal: "Adults only. Participation must always be voluntary and consensual.", door: "THE OBSIDIAN DOOR", doorSub: "Your entrance. Your atmosphere.",
    welcomeInside: "WELCOME INSIDE", setupTitle: "Set up your personal House.", setupText: "This alpha stores your details only during the current visit. Accounts and a database are the next development step.",
    displayName: "Display name", relationship: "Relationship style", createHouse: "CREATE MY HOUSE", exclusive: "Exclusive Dynamic", circle: "Private Circle", community: "Community",
    nav: ["Command Center", "Private Chamber", "Tasks", "Journal", "House Store", "Calendar", "Applications", "House Settings"],
    houseOf: "HOUSE OF", applicationsOpen: "Applications open", leave: "← Back to the entrance", welcomeHome: "WELCOME HOME",
    houseStatus: "HOUSE STATUS · PRIVATE", ready: "Your House is ready.", readyText: "Tasks, messages and personal moments in one place.", houseKey: "HOUSE KEY",
    openTasks: "Open tasks", completed: "completed", messages: "Messages", chamber: "Private Chamber", houseXp: "House XP", relationshipStyle: "Relationship style", chosen: "individually selected",
    today: "TODAY", tasks: "Tasks", viewAll: "View all", personalMessages: "Personal messages", open: "Open", justNow: "just now", noMessage: "No messages yet",
    structure: "STRUCTURE & PROGRESS", createTask: "+ Create task", consentNotice: "Consequences must be based on prior, voluntary agreement. No threats, coercion or publication of private content.",
    personalArea: "Personal area", messagePlaceholder: "Write a personal message …", send: "Send", product1: "Personal task package", product1Text: "Demo product for the future digital House Store.", product2: "Exclusive House post", product2Text: "Preview for protected images, videos and posts.", unavailable: "Not available yet",
    alpha: "ALPHA MODULE", nextStep: "This module is prepared for the next development step.", statusOpen: "Open", statusReview: "For review", statusDone: "Completed", newTask: "New personal task", noDue: "No deadline"
  }
};

const initialTasks: Task[] = [
  { id: 1, titleDe: "Morgenroutine abschließen", titleEn: "Complete morning routine", dueDe: "Heute · 09:00", dueEn: "Today · 09:00", points: 25, status: "done" },
  { id: 2, titleDe: "Reflexion im Journal", titleEn: "Journal reflection", dueDe: "Heute · 20:00", dueEn: "Today · 20:00", points: 40, status: "open" },
  { id: 3, titleDe: "Wochenziel bestätigen", titleEn: "Confirm weekly goal", dueDe: "Morgen", dueEn: "Tomorrow", points: 60, status: "review" }
];

const initialMessages: ChatMessage[] = [
  { id: 1, direction: "incoming", de: "Guten Abend. Ich habe die Aufgabe erhalten.", en: "Good evening. I received the task." },
  { id: 2, direction: "outgoing", de: "Gut. Trage anschließend deine Reflexion im Journal ein.", en: "Good. Add your reflection to the journal afterwards." },
  { id: 3, direction: "incoming", de: "Ja, verstanden.", en: "Yes, understood." }
];

export default function Home() {
  const [lang, setLang] = useState<Lang>("de");
  const t = copy[lang];
  const [entered, setEntered] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [role, setRole] = useState<Role>("dom");
  const [displayName, setDisplayName] = useState("Lady Vanillaice");
  const [relationshipStyle, setRelationshipStyle] = useState("exclusive");
  const [active, setActive] = useState(0);
  const [tasks, setTasks] = useState(initialTasks);
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");

  const completed = useMemo(() => tasks.filter((task) => task.status === "done").length, [tasks]);
  const xp = useMemo(() => tasks.filter((task) => task.status === "done").reduce((sum, task) => sum + task.points, 0), [tasks]);
  const initials = displayName.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const relationshipLabel = relationshipStyle === "exclusive" ? t.exclusive : relationshipStyle === "circle" ? t.circle : t.community;
  const statusLabel = (status: TaskStatus) => status === "done" ? t.statusDone : status === "review" ? t.statusReview : t.statusOpen;
  const toggleTask = (id: number) => setTasks((current) => current.map((task) => task.id === id ? { ...task, status: task.status === "done" ? "open" : "done" } : task));
  const addTask = () => setTasks((current) => [...current, { id: Date.now(), titleDe: t.newTask, titleEn: copy.en.newTask, dueDe: t.noDue, dueEn: copy.en.noDue, points: 20, status: "open" }]);
  const sendMessage = (event: FormEvent) => { event.preventDefault(); if (!draft.trim()) return; setMessages((current) => [...current, { id: Date.now(), direction: "outgoing", de: draft.trim(), en: draft.trim() }]); setDraft(""); };
  const LanguageSwitch = () => <div className="languageSwitch" aria-label="Sprache wechseln"><button className={lang === "de" ? "activeLang" : ""} onClick={() => setLang("de")}>DE</button><button className={lang === "en" ? "activeLang" : ""} onClick={() => setLang("en")}>EN</button></div>;

  if (!entered) return <main className="landing"><div className="ambient ambientOne" /><div className="ambient ambientTwo" /><header className="topbar"><div className="brand"><span className="crest">H</span><span>HOUSE OF DOMS</span></div><div className="topActions"><span className="adult">{t.adult}</span><LanguageSwitch /></div></header><section className="hero"><div className="eyebrow">{t.eyebrow}</div><h1>{t.slogan1}<br />{t.slogan2}<br /><em>{t.slogan3}</em></h1><p>{t.intro}</p><div className="roleChoice"><button className={role === "dom" ? "selected" : ""} onClick={() => setRole("dom")}><strong>{t.dom}</strong><span>{t.domSub}</span></button><button className={role === "sub" ? "selected" : ""} onClick={() => setRole("sub")}><strong>{t.sub}</strong><span>{t.subSub}</span></button></div><button className="enterButton" onClick={() => setEntered(true)}>{t.enter}<span>→</span></button><small>{t.legal}</small></section><section className="doorStage"><div className="doorFrame"><div className="door"><div className="doorMark">H</div><div className="handle" /></div></div><div className="doorCaption"><span>{t.door}</span><strong>{t.doorSub}</strong></div></section></main>;

  if (!configured) return <main className="onboarding"><div className="floatingLanguage"><LanguageSwitch /></div><section className="setupCard"><div className="crest large">H</div><span className="eyebrow">{t.welcomeInside}</span><h1>{t.setupTitle}</h1><p>{t.setupText}</p><label>{t.displayName}<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></label><label>{t.relationship}<select value={relationshipStyle} onChange={(event) => setRelationshipStyle(event.target.value)}><option value="exclusive">{t.exclusive}</option><option value="circle">{t.circle}</option><option value="community">{t.community}</option></select></label><button className="enterButton" onClick={() => setConfigured(true)}>{t.createHouse}<span>→</span></button></section></main>;

  return <main className="appShell"><aside className="sidebar"><div className="brand"><span className="crest">H</span><span>HOUSE OF DOMS</span></div><div className="houseIdentity"><span>{t.houseOf}</span><strong>{displayName}</strong><small>{relationshipLabel} · {t.applicationsOpen}</small></div><nav>{t.nav.map((item, index) => <button key={item} className={active === index ? "active" : ""} onClick={() => setActive(index)}>{item}</button>)}</nav><button className="leave" onClick={() => { setEntered(false); setConfigured(false); }}>{t.leave}</button></aside><section className="workspace"><header className="workspaceHeader"><div><span className="eyebrow">{t.welcomeHome}</span><h2>{t.nav[active]}</h2></div><div className="headerTools"><LanguageSwitch /><div className="profileChip"><span>{initials}</span><div><strong>{displayName}</strong><small>{role === "dom" ? t.dom : t.sub}</small></div></div></div></header>
  {active === 0 && <><section className="welcomeCard"><div><span className="eyebrow">{t.houseStatus}</span><h3>{t.ready}</h3><p>{t.readyText}</p></div><div className="keyCard"><span>{t.houseKey}</span><strong>HOD-0001</strong><small>Obsidian · Alpha</small></div></section><section className="stats"><article><span>{t.openTasks}</span><strong>{tasks.filter((task) => task.status !== "done").length}</strong><small>{completed} {t.completed}</small></article><article><span>{t.messages}</span><strong>{messages.length}</strong><small>{t.chamber}</small></article><article><span>{t.houseXp}</span><strong>{xp}</strong><small>Level 3</small></article><article><span>{t.relationshipStyle}</span><strong className="smallStat">{relationshipLabel}</strong><small>{t.chosen}</small></article></section><section className="gridTwo"><div className="panel"><div className="panelHead"><div><span className="eyebrow">{t.today}</span><h3>{t.tasks}</h3></div><button onClick={() => setActive(2)}>{t.viewAll}</button></div>{tasks.slice(0, 3).map((task) => <TaskRow key={task.id} task={task} lang={lang} label={statusLabel(task.status)} onToggle={toggleTask} />)}</div><div className="panel"><div className="panelHead"><div><span className="eyebrow">{t.chamber.toUpperCase()}</span><h3>{t.personalMessages}</h3></div><button onClick={() => setActive(1)}>{t.open}</button></div><Message initial="J" name="Johnny" text={messages[messages.length - 1]?.[lang] ?? t.noMessage} time={t.justNow} /></div></section></>}
  {active === 2 && <section className="panel full"><div className="panelHead"><div><span className="eyebrow">{t.structure}</span><h3>{t.tasks}</h3></div><button onClick={addTask}>{t.createTask}</button></div>{tasks.map((task) => <TaskRow key={task.id} task={task} lang={lang} label={statusLabel(task.status)} onToggle={toggleTask} />)}<div className="notice">{t.consentNotice}</div></section>}
  {active === 1 && <section className="chatLayout"><div className="threads"><button className="thread activeThread"><span>J</span><div><strong>Johnny</strong><small>Online</small></div></button></div><div className="conversation"><div className="chatHead"><div><strong>{t.chamber} · Johnny</strong><small>{t.personalArea}</small></div><button>⋯</button></div><div className="messages">{messages.map((message) => <div key={message.id} className={`bubble ${message.direction}`}>{message[lang]}</div>)}</div><form className="composer" onSubmit={sendMessage}><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={t.messagePlaceholder} /><button type="submit">{t.send}</button></form></div></section>}
  {active === 4 && <section className="storeGrid"><article className="productCard"><span className="productVisual">PRIVATE</span><h3>{t.product1}</h3><p>{t.product1Text}</p><strong>19,00 €</strong><button>{t.unavailable}</button></article><article className="productCard"><span className="productVisual">MEMBERS</span><h3>{t.product2}</h3><p>{t.product2Text}</p><strong>9,00 €</strong><button>{t.unavailable}</button></article></section>}
  {![0,1,2,4].includes(active) && <section className="panel full placeholder"><span className="eyebrow">{t.alpha}</span><h3>{t.nav[active]}</h3><p>{t.nextStep}</p></section>}
  </section></main>;
}

function TaskRow({ task, lang, label, onToggle }: { task: Task; lang: Lang; label: string; onToggle: (id: number) => void }) { return <div className="taskRow"><button className={task.status === "done" ? "check done" : "check"} onClick={() => onToggle(task.id)}>{task.status === "done" ? "✓" : ""}</button><div className="taskText"><strong>{lang === "de" ? task.titleDe : task.titleEn}</strong><small>{lang === "de" ? task.dueDe : task.dueEn}</small></div><span className="status">{label}</span><strong className="points">+{task.points} XP</strong></div>; }
function Message({ initial, name, text, time }: { initial: string; name: string; text: string; time: string }) { return <div className="message"><span>{initial}</span><div><strong>{name}</strong><p>{text}</p><small>{time}</small></div></div>; }
