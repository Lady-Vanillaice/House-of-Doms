"use client";

import { useState } from "react";
import "./profil.css";

const offers = ["Online-Befehle", "Aufgaben", "Studio-Sessions", "Rituale"];
const seeks = ["Langzeitdynamik", "Disziplin", "Verlässlichkeit"];
const limits = ["Keine Schulden", "Keine Weitergabe privater Inhalte", "Jederzeit widerrufbar"];

export default function ProfilePage() {
  const [editing, setEditing] = useState(false);
  const [role, setRole] = useState("Domina");
  const [contact, setContact] = useState("Geöffnet");

  return <main className="profilePage">
    <section className="profileHero">
      <div className="profileAvatar">LV</div>
      <div className="profileHeroCopy"><span className="eyebrow">ÖFFENTLICHES PROFIL</span><h1>Lady Vanillaice</h1><p>Persönliche, klare und einvernehmliche D/s-Dynamiken mit Struktur, Aufgaben und Studio-Sessions.</p><div className="profileMeta"><span>{role}</span><span>Berlin</span><span>DE · EN</span><span className="verified">✓ Verifiziert</span></div></div>
      <button className="editProfile" onClick={() => setEditing(!editing)}>{editing ? "Vorschau" : "Profil bearbeiten"}</button>
    </section>

    <section className="profileGrid">
      <article className="profileCard"><h2>Kontakt</h2><label>Status<select value={contact} onChange={e => setContact(e.target.value)} disabled={!editing}><option>Geöffnet</option><option>Nur Bewerbungen</option><option>Geschlossen</option></select></label><label>Rolle<select value={role} onChange={e => setRole(e.target.value)} disabled={!editing}><option>Domina</option><option>Dom</option><option>Sub</option><option>Sklave</option><option>Switch</option></select></label><label>Standort<input defaultValue="Berlin" disabled={!editing}/></label></article>
      <article className="profileCard"><h2>Über mich</h2><textarea defaultValue="Ich lege Wert auf klare Kommunikation, Verlässlichkeit und persönliche Dynamiken statt austauschbarer Kontakte." disabled={!editing}/></article>
      <article className="profileCard"><h2>Biete ich</h2><div className="tagCloud">{offers.map(x => <span key={x}>{x}</span>)}</div></article>
      <article className="profileCard"><h2>Suche ich</h2><div className="tagCloud">{seeks.map(x => <span key={x}>{x}</span>)}</div></article>
      <article className="profileCard wide"><h2>Grenzen & Rahmen</h2><div className="limitList">{limits.map(x => <div key={x}>◆ {x}</div>)}</div></article>
      <article className="profileCard wide"><h2>Studio & Verfügbarkeit</h2><div className="availability"><div><strong>Studio</strong><span>Berlin · diskreter Zugang</span></div><div><strong>Nächster Studiotag</strong><span>Samstag · 12:00–18:00</span></div><div><strong>Kontakt</strong><span>{contact}</span></div></div></article>
    </section>
  </main>;
}
