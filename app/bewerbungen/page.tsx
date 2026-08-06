"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import "./applications.css";

type Lang = "de" | "en";
type Role = "dom" | "sub";
type Status = "pending" | "accepted" | "rejected" | "waitlist" | "withdrawn";
type Application = {
  id: number;
  applicant: string;
  dom: string;
  title: string;
  message: string;
  experience: string;
  availability: string;
  boundaries: string;
  status: Status;
  createdAt: string;
};

const copy = {
  de: {
    back: "Zurück ins House",
    title: "Bewerbungen",
    subtitle: "Subs und Sklaven bewerben sich persönlich bei einem Dom oder einer Domina. Der Dom entscheidet über Annahme, Warteliste oder Ablehnung.",
    role: "Ansicht",
    domView: "Dom / Domina",
    subView: "Sub / Sklave",
    domLabel: "DOM / DOMINA · ENTSCHEIDET",
    subLabel: "SUB / SKLAVE · BEWIRBT SICH",
    incoming: "Eingegangene Bewerbungen",
    myApplications: "Meine Bewerbungen",
    newApplication: "Neue Bewerbung senden",
    applicant: "Bewerber/in",
    targetDom: "Dom / Domina",
    subject: "Betreff",
    message: "Persönliche Nachricht",
    experience: "Erfahrung und Erwartungen",
    availability: "Verfügbarkeit",
    boundaries: "Grenzen und wichtige Hinweise",
    send: "Bewerbung absenden",
    accept: "Annehmen",
    reject: "Ablehnen",
    waitlist: "Warteliste",
    withdraw: "Zurückziehen",
    pending: "Offen",
    accepted: "Angenommen",
    rejected: "Abgelehnt",
    waitlisted: "Warteliste",
    withdrawn: "Zurückgezogen",
    acceptedNote: "Nach der Annahme wird eine persönliche House-Verbindung angelegt. Danach kann der Dom Aufgaben zuweisen und der Sub Sessions buchen.",
    roleNotice: "Nur Subs/Sklaven senden Bewerbungen. Nur Doms/Dominas bearbeiten sie und vergeben anschließend Aufgaben, Studio-Tage und Session-Slots.",
    empty: "Noch keine Bewerbungen vorhanden.",
    houseKey: "House Key wird nach Annahme erstellt",
    details: "Details",
    created: "Gesendet am"
  },
  en: {
    back: "Back to the House",
    title: "Applications",
    subtitle: "Subs and slaves apply personally to a Dom or Domme. The Dom decides whether to accept, waitlist or decline.",
    role: "View",
    domView: "Dom / Domme",
    subView: "Sub / Slave",
    domLabel: "DOM / DOMME · DECIDES",
    subLabel: "SUB / SLAVE · APPLIES",
    incoming: "Incoming applications",
    myApplications: "My applications",
    newApplication: "Send new application",
    applicant: "Applicant",
    targetDom: "Dom / Domme",
    subject: "Subject",
    message: "Personal message",
    experience: "Experience and expectations",
    availability: "Availability",
    boundaries: "Boundaries and important notes",
    send: "Send application",
    accept: "Accept",
    reject: "Decline",
    waitlist: "Waitlist",
    withdraw: "Withdraw",
    pending: "Pending",
    accepted: "Accepted",
    rejected: "Declined",
    waitlisted: "Waitlisted",
    withdrawn: "Withdrawn",
    acceptedNote: "After acceptance, a personal House connection is created. The Dom can then assign tasks and the Sub can book sessions.",
    roleNotice: "Only Subs/Slaves send applications. Only Doms/Dommes process them and then create tasks, studio days and session slots.",
    empty: "No applications yet.",
    houseKey: "House Key is created after acceptance",
    details: "Details",
    created: "Sent on"
  }
};

const initialApplications: Application[] = [
  {
    id: 1,
    applicant: "Johnny",
    dom: "Lady Vanillaice",
    title: "Bewerbung für eine persönliche Dynamik",
    message: "Ich wünsche mir eine klare, persönliche Führung mit verlässlichen Aufgaben und ehrlicher Kommunikation.",
    experience: "Erste Erfahrungen mit strukturierten Aufgaben und Journaling.",
    availability: "Abends und am Wochenende",
    boundaries: "Keine Veröffentlichung persönlicher Inhalte. Alles nur nach vorheriger Absprache.",
    status: "pending",
    createdAt: "06.08.2026"
  },
  {
    id: 2,
    applicant: "Alex",
    dom: "Lady Vanillaice",
    title: "Aufnahme in den privaten Kreis",
    message: "Ich suche eine langfristige, respektvolle Verbindung mit klaren Regeln.",
    experience: "Mehrjährige Erfahrung in konsensuellen D/s-Dynamiken.",
    availability: "Dienstag und Donnerstag ab 18 Uhr",
    boundaries: "Gesundheitliche Grenzen werden vor jeder Session besprochen.",
    status: "waitlist",
    createdAt: "04.08.2026"
  }
];

const statusClass: Record<Status, string> = {
  pending: "pending",
  accepted: "accepted",
  rejected: "rejected",
  waitlist: "waitlist",
  withdrawn: "withdrawn"
};

export default function ApplicationsPage() {
  const [lang, setLang] = useState<Lang>("de");
  const [role, setRole] = useState<Role>("dom");
  const [applications, setApplications] = useState<Application[]>(initialApplications);
  const [selectedId, setSelectedId] = useState<number | null>(1);
  const [domName, setDomName] = useState("Lady Vanillaice");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [experience, setExperience] = useState("");
  const [availability, setAvailability] = useState("");
  const [boundaries, setBoundaries] = useState("");
  const t = copy[lang];

  const visibleApplications = useMemo(
    () => role === "dom" ? applications.filter((item) => item.dom === "Lady Vanillaice") : applications.filter((item) => item.applicant === "Johnny"),
    [applications, role]
  );
  const selected = applications.find((item) => item.id === selectedId) ?? null;

  const statusLabel = (status: Status) => status === "pending" ? t.pending : status === "accepted" ? t.accepted : status === "rejected" ? t.rejected : status === "waitlist" ? t.waitlisted : t.withdrawn;

  const updateStatus = (id: number, status: Status) => {
    setApplications((current) => current.map((item) => item.id === id ? { ...item, status } : item));
  };

  const sendApplication = (event: FormEvent) => {
    event.preventDefault();
    if (!domName.trim() || !subject.trim() || !message.trim()) return;
    const next: Application = {
      id: Date.now(),
      applicant: "Johnny",
      dom: domName.trim(),
      title: subject.trim(),
      message: message.trim(),
      experience: experience.trim(),
      availability: availability.trim(),
      boundaries: boundaries.trim(),
      status: "pending",
      createdAt: new Intl.DateTimeFormat(lang === "de" ? "de-DE" : "en-GB").format(new Date())
    };
    setApplications((current) => [next, ...current]);
    setSelectedId(next.id);
    setSubject(""); setMessage(""); setExperience(""); setAvailability(""); setBoundaries("");
  };

  return <main className="applicationsPage">
    <header className="applicationsTop">
      <div>
        <Link href="/" className="backLink">← {t.back}</Link>
        <span className="eyebrow">HOUSE OF DOMS</span>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </div>
      <div className="topControls">
        <div className="roleSwitch" aria-label={t.role}>
          <button className={role === "dom" ? "active" : ""} onClick={() => setRole("dom")}>{t.domView}</button>
          <button className={role === "sub" ? "active" : ""} onClick={() => setRole("sub")}>{t.subView}</button>
        </div>
        <div className="languageSwitch">
          <button className={lang === "de" ? "active" : ""} onClick={() => setLang("de")}>DE</button>
          <button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button>
        </div>
      </div>
    </header>

    <section className="roleNotice">
      <strong>{role === "dom" ? t.domLabel : t.subLabel}</strong>
      <span>{t.roleNotice}</span>
    </section>

    <section className="applicationStats">
      <article><span>{t.pending}</span><strong>{visibleApplications.filter((item) => item.status === "pending").length}</strong></article>
      <article><span>{t.accepted}</span><strong>{visibleApplications.filter((item) => item.status === "accepted").length}</strong></article>
      <article><span>{t.waitlisted}</span><strong>{visibleApplications.filter((item) => item.status === "waitlist").length}</strong></article>
      <article><span>{t.rejected}</span><strong>{visibleApplications.filter((item) => item.status === "rejected").length}</strong></article>
    </section>

    {role === "dom" ? <section className="applicationsLayout">
      <div className="applicationList panel">
        <div className="panelHead"><div><span className="eyebrow">DOM / DOMINA</span><h2>{t.incoming}</h2></div></div>
        {visibleApplications.length === 0 && <p className="empty">{t.empty}</p>}
        {visibleApplications.map((item) => <button key={item.id} className={`applicationListItem ${selectedId === item.id ? "selected" : ""}`} onClick={() => setSelectedId(item.id)}>
          <div><strong>{item.applicant}</strong><span>{item.title}</span><small>{t.created}: {item.createdAt}</small></div>
          <span className={`status ${statusClass[item.status]}`}>{statusLabel(item.status)}</span>
        </button>)}
      </div>
      <div className="applicationDetail panel">
        {selected ? <>
          <div className="detailHead"><div><span className="eyebrow">{t.details}</span><h2>{selected.applicant}</h2><p>{selected.title}</p></div><span className={`status large ${statusClass[selected.status]}`}>{statusLabel(selected.status)}</span></div>
          <dl>
            <div><dt>{t.message}</dt><dd>{selected.message}</dd></div>
            <div><dt>{t.experience}</dt><dd>{selected.experience || "–"}</dd></div>
            <div><dt>{t.availability}</dt><dd>{selected.availability || "–"}</dd></div>
            <div><dt>{t.boundaries}</dt><dd>{selected.boundaries || "–"}</dd></div>
          </dl>
          <div className="decisionBar">
            <button className="acceptButton" onClick={() => updateStatus(selected.id, "accepted")}>{t.accept}</button>
            <button onClick={() => updateStatus(selected.id, "waitlist")}>{t.waitlist}</button>
            <button className="rejectButton" onClick={() => updateStatus(selected.id, "rejected")}>{t.reject}</button>
          </div>
          {selected.status === "accepted" && <div className="acceptedNote"><strong>{t.houseKey}</strong><p>{t.acceptedNote}</p></div>}
        </> : <p className="empty">{t.empty}</p>}
      </div>
    </section> : <section className="subApplicationsLayout">
      <form className="applicationForm panel" onSubmit={sendApplication}>
        <div className="panelHead"><div><span className="eyebrow">SUB / SKLAVE</span><h2>{t.newApplication}</h2></div></div>
        <label>{t.targetDom}<input value={domName} onChange={(event) => setDomName(event.target.value)} required /></label>
        <label>{t.subject}<input value={subject} onChange={(event) => setSubject(event.target.value)} required /></label>
        <label>{t.message}<textarea rows={5} value={message} onChange={(event) => setMessage(event.target.value)} required /></label>
        <label>{t.experience}<textarea rows={3} value={experience} onChange={(event) => setExperience(event.target.value)} /></label>
        <label>{t.availability}<input value={availability} onChange={(event) => setAvailability(event.target.value)} /></label>
        <label>{t.boundaries}<textarea rows={3} value={boundaries} onChange={(event) => setBoundaries(event.target.value)} /></label>
        <button className="primaryButton">{t.send}</button>
      </form>
      <div className="myApplications panel">
        <div className="panelHead"><div><span className="eyebrow">SUB / SKLAVE</span><h2>{t.myApplications}</h2></div></div>
        {visibleApplications.length === 0 && <p className="empty">{t.empty}</p>}
        {visibleApplications.map((item) => <article className="myApplication" key={item.id}>
          <div><strong>{item.dom}</strong><span>{item.title}</span><small>{t.created}: {item.createdAt}</small></div>
          <span className={`status ${statusClass[item.status]}`}>{statusLabel(item.status)}</span>
          {item.status === "pending" && <button onClick={() => updateStatus(item.id, "withdrawn")}>{t.withdraw}</button>}
        </article>)}
      </div>
    </section>}
  </main>;
}
