import Link from "next/link";
import "./house.css";

const sections=[
 ["Mitglieder","Verbindungen, Rollen und Bewerbungen","/houses"],
 ["Aufgaben","Aufgaben, Nachweise und Freigaben","/aufgaben"],
 ["Journal","Reflexionen und Verlauf","/journal"],
 ["Keuschhaltung","Status, Regeln und Check-ins","/keuschhaltung"],
 ["Studio","Studios und verfügbare Zeiten","/studios"],
 ["Store","Digitale Inhalte und Angebote","/store"],
 ["Tribute","Tribute und Finanzdynamiken","/tribute"],
 ["Homepage","Eigene Domina-Homepage verwalten","/homepage-builder"],
 ["Bewerbungen","Neue House-Verbindungen prüfen","/bewerbungen"],
 ["Einstellungen","House-Regeln und Konfiguration","/house-einstellungen"]
] as const;

export default function HouseHub(){return <main className="houseHub"><header><span className="hubEyebrow">HOUSE ZENTRALE</span><h1>Ein House.<br/><em>Alle Bereiche.</em></h1><p>Hier liegt alles, was zu deinem privaten House gehört. Die obere Navigation bleibt bewusst schlank.</p></header><section className="hubGrid">{sections.map(([title,text,href],i)=><Link key={href} href={href} className="hubCard"><span>{String(i+1).padStart(2,"0")}</span><div><h2>{title}</h2><p>{text}</p></div><b>→</b></Link>)}</section></main>}
