import Link from "next/link";
import "../info-pages.css";

const features=[
  ["Kinks entdecken","Finde Creator, Content, Sessions und Communities nach deinen Interessen – von Shibari und Latex bis Fußfetisch, Bondage, D/s und mehr."],
  ["Content ansehen","Entdecke öffentlichen Content, Pay-per-View-Medien und exklusive Membership-Inhalte deiner Lieblings-Creator."],
  ["Sessions buchen","Buche Sessions, Workshops oder andere Kink-Erlebnisse direkt bei den passenden Anbietern."],
  ["Memberships nutzen","Folge Creator, werde Mitglied und erhalte Zugriff auf exklusive Inhalte und Vorteile."],
  ["Favoriten & Interessen","Speichere, was dir gefällt, und lass dir stärker das zeigen, was zu deinen Kinks passt."],
  ["Community & Nachrichten","Verbinde dich mit Menschen und Creator, die zu deinen Interessen und Vorstellungen passen."],
  ["Optionale Dynamiken","Wenn du möchtest, kannst du auch langfristige einvernehmliche Dynamiken, Aufgaben, Regeln oder Keuschhaltung nutzen."],
  ["Keine feste Rolle nötig","Du musst weder Sub, Sklave noch dominant sein. Du kannst das House einfach so nutzen, wie es zu dir passt."]
];

export default function MemberInfoPage(){return <main className="infoPage">
  <header className="infoNav"><Link className="infoBrand" href="/"><img src="/door-emblem.svg" alt=""/><span>HOUSE OF DOMS</span></Link><nav className="infoNavLinks"><Link href="/discover">ENTDECKEN</Link><Link href="/fuer-creator">FÜR CREATOR</Link><Link className="active" href="/fuer-members">FÜR MEMBERS</Link><Link href="/so-funktionierts">SO FUNKTIONIERT'S</Link><Link href="/anmelden">LOGIN</Link></nav></header>
  <section className="infoHero"><span className="infoKicker">FÜR MEMBERS & ENTDECKER</span><h1>Finde das, worauf du stehst – und erlebe es auf deine Art.</h1><p>Diese Seite ist für alle, die suchen, entdecken, erleben, buchen oder Creator unterstützen möchten. Egal, ob du gerade erst herausfindest, was dich reizt, einen bestimmten Fetisch liebst, Content suchst, eine Session buchen möchtest oder eine langfristige Dynamik finden willst: Du entscheidest, welche Teile des House zu dir passen.</p><div className="infoActions"><Link className="infoButton primary" href="/discover">JETZT ENTDECKEN</Link><Link className="infoButton" href="/anmelden?tab=register&rolle=member">ALS MEMBER STARTEN</Link></div></section>
  <section className="infoSection"><span className="infoKicker">DEIN HOUSE</span><h2>Entdecken, erleben, folgen und buchen.</h2><div className="infoGrid">{features.map(([title,text])=><article className="infoCard" key={title}><strong>{title}</strong><p>{text}</p></article>)}</div></section>
</main>}