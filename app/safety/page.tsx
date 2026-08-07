import Link from "next/link";
import "../growth/growth.css";

export default function SafetyGuidePage(){
 const sections=[
  ["Consent & Freiwilligkeit","Interaktionen auf House of Doms basieren auf freiwilliger Zustimmung erwachsener Personen. Grenzen, Stoppsignale und Widerruf müssen respektiert werden."],
  ["Safewords & Grenzen","Vereinbarte Safewords, harte Grenzen und gesundheitliche Hinweise sollen vor Sessions geklärt und jederzeit zugänglich sein."],
  ["Volljährigkeit & Verifizierung","Die Plattform ist ausschließlich für Erwachsene. Verifizierungs-Badges sollen sichtbar machen, wenn Identität und Volljährigkeit geprüft wurden."],
  ["Privatsphäre","Private Nachrichten, Aufgaben, Notizen und Medien gehören in geschützte Bereiche. Öffentlich ist nur, was ausdrücklich veröffentlicht wird."],
  ["Finanzielle Grenzen","Bei Tributen und Finanzdominanz gelten vorher vereinbarte Budgets. Kredite, Schuldenzwang und das Umgehen persönlicher Limits sollen nicht gefördert werden."],
  ["Melden & Blockieren","Profile, Nachrichten und Inhalte sollen direkt gemeldet oder blockiert werden können. Verstöße gehören in eine priorisierte Moderationsprüfung."],
  ["Session-Sicherheit","Für reale Sessions empfehlen sich klare Zeit- und Ortsangaben, Check-ins, Notfallkontakt und eindeutige Absprachen zu erlaubten Praktiken."],
  ["Keine Fachberatung","House of Doms organisiert Plattformfunktionen, ersetzt aber keine medizinische, psychologische oder rechtliche Fachberatung."]
 ];
 return <main className="growthPage"><header className="growthHero"><Link href="/">← Startseite</Link><span>HOUSE OF DOMS · SAFETY</span><h1>Sicherheit ist<br/><em>Teil der Struktur.</em></h1><p>Ein öffentlicher Überblick über Consent, Grenzen, Privatsphäre, Verifizierung und verantwortungsvolle Nutzung.</p></header><section className="growthPanel"><div className="checkGrid">{sections.map(([t,p])=><article key={t} style={{padding:"22px",border:"1px solid rgba(255,255,255,.07)",background:"#0a0807"}}><h3 style={{marginTop:0}}>{t}</h3><p className="lead">{p}</p></article>)}</div><div className="actionRow"><Link className="buttonLink" href="/kontakt">Kontakt / Problem melden</Link><Link className="buttonLink" href="/discover">Discover öffnen</Link></div></section></main>
}
