import Link from "next/link";
import "../houses.css";

export default function LadyVanillaiceProfile(){
  return <main className="directoryPage profilePage">
    <header className="profileHero"><div><Link href="/houses" className="backLink">← Zum House-Verzeichnis</Link><span className="eyebrow">ÖFFENTLICHES DOM-/DOMINA-PROFIL · 18+</span><h1>Lady Vanillaice</h1><p className="profileLead">Klare Führung, persönliche Struktur und eine verlässliche, einvernehmliche Dynamik in einem privaten digitalen House.</p><div className="profileBadges"><span>✓ Bewerbungen offen</span><span>◆ Berlin</span><span>◆ Studio-Tage</span><span>◆ Exklusive Dynamik</span></div></div><div className="profileSeal"><span>LV</span><strong>HOUSE OF<br/>VANILLAICE</strong><small>OBSIDIAN HOUSE</small></div></header>

    <section className="profileLayout"><div className="profileMain">
      <article className="profilePanel"><span className="eyebrow">ÜBER DAS HOUSE</span><h2>Führung mit Klarheit.</h2><p>Dieses House richtet sich an volljährige Subs und Sklaven, die eine strukturierte, respektvolle und langfristig aufgebaute Dynamik suchen. Aufgaben, Journal-Nachweise und Sessions werden individuell vereinbart. Grenzen, Einwilligung und offene Kommunikation haben jederzeit Vorrang.</p></article>
      <article className="profilePanel"><span className="eyebrow">REGELN & ERWARTUNGEN</span><h2>Was im House zählt</h2><ul><li>Ehrliche Kommunikation und freiwillige Vereinbarungen</li><li>Zuverlässiger Umgang mit Aufgaben und Terminen</li><li>Grenzen können jederzeit angesprochen und angepasst werden</li><li>Keine Veröffentlichung privater Inhalte ohne ausdrückliche Freigabe</li><li>Respekt gilt in beide Richtungen</li></ul></article>
      <article className="profilePanel"><span className="eyebrow">STUDIO & SESSIONS</span><h2>Berlin · Studio Obsidian</h2><p>Ausgewählte Studio-Tage werden im Kalender veröffentlicht. Nach einer angenommenen Bewerbung können freie Zeitfenster angefragt werden. Jede Session wird vorab besprochen und bestätigt.</p><div className="sessionPreview"><span><b>10. Aug.</b> Studio-Tag geplant</span><span><b>3</b> freie Zeitslots</span></div></article>
    </div>
    <aside className="applicationAside"><span className="eyebrow">BEWERBUNG</span><h2>Die Tür ist offen.</h2><p>Beschreibe, warum du dich bewirbst, welche Erfahrungen du mitbringst, wann du verfügbar bist und welche Grenzen wichtig sind.</p><dl><div><dt>Status</dt><dd>Bewerbungen offen</dd></div><div><dt>Antwortzeit</dt><dd>In der Regel 2–4 Tage</dd></div><div><dt>Aufnahme</dt><dd>Persönliche Entscheidung</dd></div></dl><Link href="/bewerbungen" className="applyButton">Bewerbung senden →</Link><small>Eine Bewerbung begründet keine Verpflichtung. Beide Seiten entscheiden freiwillig.</small></aside>
    </section>
  </main>;
}
