import Link from "next/link";
import "./dashboard.css";

const cards=[
  ["Kammer","Nachrichten, Bilder, Videos und Aufgaben", "/kammer","✦"],
  ["Kalender","Studio-Zeiten, Sessions und Termine", "/kalender","◷"],
  ["Aufgaben","Aufgaben erstellen und Nachweise prüfen", "/aufgaben","✓"],
  ["Keuschhaltung","Status, Check-ins und Vereinbarungen", "/keuschhaltung","◇"]
] as const;
const activity=["Neue Nachrichten prüfen","Heutige Studio-Zeiten ansehen","Offene Aufgaben kontrollieren","House-Einstellungen verwalten"];

export default function DashboardPage(){return <main className="commandDashboard">
  <header className="commandHero"><div><span className="commandEyebrow">HOUSE OF DOMS · COMMAND CENTER</span><h1>Dein House.<br/><em>Alles unter Kontrolle.</em></h1><p>Die wichtigsten Bereiche an einem Ort. Weniger Menüs, weniger Suchen, mehr direkter Zugriff.</p></div><div className="commandSeal"><span>H</span><small>PRIVATE HOUSE OS</small></div></header>
  <section className="commandStrip"><Link href="/kammer"><span>Nachrichten</span><strong>Öffnen</strong></Link><Link href="/kalender"><span>Heute</span><strong>Kalender</strong></Link><Link href="/house"><span>House</span><strong>Zentrale</strong></Link><Link href="/discover"><span>Community</span><strong>Discover</strong></Link></section>
  <section className="commandGrid">{cards.map(([title,text,href,icon])=><Link className="commandCard" href={href} key={href}><i>{icon}</i><div><span>DIREKTZUGRIFF</span><h2>{title}</h2><p>{text}</p></div><b>→</b></Link>)}</section>
  <section className="commandLower"><article><span className="commandEyebrow">HEUTE</span><h2>Was als Nächstes ansteht</h2>{activity.map((x,i)=><Link key={x} href={["/kammer","/kalender","/aufgaben","/house-einstellungen"][i]}><em>0{i+1}</em><span>{x}</span><b>→</b></Link>)}</article><article className="housePortal"><span className="commandEyebrow">DEIN HOUSE</span><h2>Alle Werkzeuge.<br/>Eine Zentrale.</h2><p>Mitglieder, Journal, Tribute, Studio, Homepage, Store, Keuschhaltung und Einstellungen liegen gesammelt im House-Bereich.</p><Link href="/house">House öffnen →</Link></article></section>
</main>}
