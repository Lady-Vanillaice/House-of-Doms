import Link from "next/link";
import "../info-pages.css";

const steps=[
  ["Entdecken","Sieh dich zuerst um: Creator, Kinks, Content, Sessions und Communities findest du über Discover."],
  ["Deinen Weg wählen","Du kannst etwas anbieten, etwas suchen und erleben – oder beides. Eine feste D/s-Rolle ist keine Voraussetzung."],
  ["Profil & Interessen festlegen","Creator richten ihre Angebote ein. Members wählen Interessen und Favoriten, damit passende Inhalte schneller sichtbar werden."],
  ["Content, Memberships & Sessions nutzen","Content kann öffentlich, per Pay-per-View oder nur für Mitglieder angeboten werden. Sessions und Workshops lassen sich direkt buchen."],
  ["Organisation im House","Creator verwalten Kalender, Verfügbarkeit, Buchungen, Kassenbuch und Community. Members behalten ihre Buchungen, Favoriten und Kontakte im Blick."],
  ["Das House wächst mit euch","Fehlt eine sinnvolle Funktion, kann sie ergänzt werden. Das House ist als wachsendes All-in-One-System für die Kink-Community gedacht."]
];

export default function HowPage(){return <main className="infoPage">
  <header className="infoNav"><Link className="infoBrand" href="/"><img src="/door-emblem.svg" alt=""/><span>HOUSE OF DOMS</span></Link><nav className="infoNavLinks"><Link href="/discover">ENTDECKEN</Link><Link href="/fuer-creator">FÜR CREATOR</Link><Link href="/fuer-members">FÜR MEMBERS</Link><Link className="active" href="/so-funktionierts">SO FUNKTIONIERT'S</Link><Link href="/anmelden">LOGIN</Link></nav></header>
  <section className="infoHero"><span className="infoKicker">SO FUNKTIONIERT'S</span><h1>Ein House, zwei Seiten – und alles miteinander verbunden.</h1><p>House of Doms bringt die Menschen zusammen, die Kink, Content, Sessions und Erlebnisse anbieten, und die Menschen, die genau das suchen. Statt mehrere einzelne Plattformen zu brauchen, laufen Entdecken, Content, Memberships, Buchungen, Organisation und Community an einem Ort zusammen.</p></section>
  <section className="infoSection"><div className="infoSteps">{steps.map(([title,text])=><article className="infoStep" key={title}><strong>{title}</strong><p>{text}</p></article>)}</div><div className="infoActions"><Link className="infoButton primary" href="/fuer-creator">ICH BIETE ETWAS AN</Link><Link className="infoButton" href="/fuer-members">ICH MÖCHTE ENTDECKEN & ERLEBEN</Link></div></section>
</main>}