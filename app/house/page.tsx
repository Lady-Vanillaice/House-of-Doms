import Link from "next/link";
import DomCashbookCard from "./dom-cashbook-card";
import "./house.css";

const sections=[
 ["Sub-Akten","Mitglieder, Verlauf, Aufgaben, Sessions und private Notizen","/mitglieder"],
 ["Aufgaben","Aufgaben, Nachweise, Vorlagen und Freigaben","/aufgaben"],
 ["Aufgaben-Vorlagen","Wiederverwendbare Aufgaben und Serien vorbereiten","/aufgaben/vorlagen"],
 ["Kalender","Studio, Sessions, Handy-Kalender und Buchungen","/kalender"],
 ["Journal","Reflexionen und Verlauf","/journal"],
 ["Keuschhaltung","Status, Regeln, Laufzeit und Check-ins","/keuschhaltung"],
 ["Studio","Studios und verfügbare Zeiten","/studios"],
 ["Store","Digitale Inhalte und Angebote","/store"],
 ["Tribute","Tribute und Finanzdynamiken","/tribute"],
 ["Homepage","Domina-Homepage, SEO und Kontakt verwalten","/homepage-builder"],
 ["Bewerbungen","Neue House-Verbindungen live prüfen","/bewerbungen"],
 ["Benachrichtigungen","In-App, E-Mail- und Push-Einstellungen","/benachrichtigungen/einstellungen"],
 ["Rechte & Rollen","Delegierte House-Rechte verwalten","/house-rechte"],
 ["Einstellungen","House-Regeln und Konfiguration","/house-einstellungen"]
] as const;

export default function HouseHub(){return <main className="houseHub"><header><span className="hubEyebrow">HOUSE ZENTRALE · HOUSE OS 2</span><h1>Ein House.<br/><em>Alles verbunden.</em></h1><p>Mitglieder, Kommunikation, Aufgaben, Kalender, Finanzen und öffentliche Homepage greifen jetzt als ein System ineinander.</p></header><section className="hubGrid">{sections.map(([title,text,href],i)=><Link key={href} href={href} className="hubCard"><span>{String(i+1).padStart(2,"0")}</span><div><h2>{title}</h2><p>{text}</p></div><b>→</b></Link>)}<DomCashbookCard/></section></main>}
