import Link from "next/link";
import "../info-pages.css";

const features=[
  ["Eigene Präsenz","Baue dein öffentliches Creator-Profil mit Bio, Kinks, Medien, Angeboten und Memberships auf."],
  ["Content verkaufen","Veröffentliche Medien öffentlich, als Pay-per-View oder exklusiv für deine Mitglieder."],
  ["Sessions & Workshops","Biete Studio-Sessions, Shibari, Bondage, Workshops, Fetisch-Sessions oder andere buchbare Erlebnisse an."],
  ["Buchungsseite & Kalender","Verwalte Verfügbarkeiten, Termine, Studiozeiten und Buchungen zentral an einem Ort."],
  ["Kassenbuch & Verwaltung","Behalte Einnahmen, Buchungen und deine geschäftliche Übersicht direkt im House im Blick."],
  ["Community & Memberships","Baue wiederkehrende Mitgliedschaften, exklusive Inhalte und eine eigene Community auf."],
  ["Discover & Reichweite","Werde über Kinks, Interessen, Standort und Angebote gefunden – nicht nur über eine einzelne Rolle."],
  ["Private Bereiche","Nutze Nachrichten und geschützte Bereiche für individuelle Kontakte und einvernehmliche Dynamiken."]
];

export default function CreatorInfoPage(){return <main className="infoPage">
  <header className="infoNav"><Link className="infoBrand" href="/"><img src="/door-emblem.svg" alt=""/><span>HOUSE OF DOMS</span></Link><nav className="infoNavLinks"><Link href="/discover">ENTDECKEN</Link><Link className="active" href="/fuer-creator">FÜR CREATOR</Link><Link href="/fuer-members">FÜR MEMBERS</Link><Link href="/so-funktionierts">SO FUNKTIONIERT'S</Link><Link href="/anmelden">LOGIN</Link></nav></header>
  <section className="infoHero"><span className="infoKicker">FÜR CREATOR & ANBIETER</span><h1>Dein Business, dein Content, deine Sessions – alles in einem House.</h1><p>Für Dominas/Doms, Rigger, Shibari-Artists, Fetisch-Creator, Models, Studios und alle anderen, die in der Kink-Welt etwas anbieten möchten. House of Doms verbindet deine öffentliche Präsenz, Content, Buchungen, Memberships, Kalender, Kassenbuch und Community, damit du nicht für jeden Teil deines Angebots eine andere Plattform brauchst.</p><div className="infoActions"><Link className="infoButton primary" href="/anmelden?tab=register&rolle=creator">ALS CREATOR STARTEN</Link><Link className="infoButton" href="/discover">CREATOR ENTDECKEN</Link></div></section>
  <section className="infoSection"><span className="infoKicker">DEIN ALL-IN-ONE BEREICH</span><h2>Was du im House anbieten und verwalten kannst.</h2><div className="infoGrid">{features.map(([title,text])=><article className="infoCard" key={title}><strong>{title}</strong><p>{text}</p></article>)}</div></section>
  <section className="infoSection"><span className="infoKicker">GEBÜHREN NUR FÜR ANBIETER</span><h2>Transparent, bevor du etwas verkaufst.</h2><div className="feeBox"><h3>Das Gebührenmodell gehört hierher.</h3><p>Gebühren betreffen Creator und Anbieter, die über House of Doms Content, Memberships, digitale Angebote, Sessions oder Workshops verkaufen. Deshalb findest du das Gebührenmodell nur im Creator-Bereich – nicht im normalen Member-/Entdecker-Bereich.</p><div className="infoActions"><Link className="infoButton primary" href="/gebuehrenmodell">GEBÜHRENMODELL ANSEHEN</Link></div></div></section>
</main>}