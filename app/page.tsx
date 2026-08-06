const tasks = [
  { title: "Morgenroutine dokumentieren", meta: "Heute · 09:00", points: 20 },
  { title: "30 Minuten Bewegung", meta: "Heute · 18:00", points: 30 },
  { title: "Abendliches Reflexionsjournal", meta: "Täglich · 21:30", points: 25 }
];

export default function Home() {
  return (
    <main>
      <nav className="nav shell">
        <div className="brand"><span>H</span> House of Doms</div>
        <div className="navlinks"><a href="#features">Funktionen</a><a href="#safety">Sicherheit</a><button>Anmelden</button></div>
      </nav>

      <section className="hero shell">
        <div className="eyebrow">CONSENSUAL D/S MANAGEMENT</div>
        <h1>Struktur. Vertrauen.<br/><em>Hingabe.</em></h1>
        <p>Eine diskrete Plattform für einvernehmliche Dynamiken: Aufgaben, Vereinbarungen, Fortschritt und sichere Kommunikation an einem Ort.</p>
        <div className="actions"><button className="primary">Kostenlos starten</button><button className="secondary">Demo ansehen</button></div>
        <div className="trust"><span>✓ Nur für Erwachsene</span><span>✓ Einvernehmlich</span><span>✓ Privat & sicher</span></div>
      </section>

      <section className="dashboard shell" aria-label="Dashboard Vorschau">
        <aside>
          <div className="miniBrand">HOD</div>
          <a className="active">Übersicht</a><a>Aufgaben</a><a>Vereinbarungen</a><a>Kalender</a><a>Nachrichten</a><a>Profil</a>
        </aside>
        <div className="content">
          <header><div><small>Guten Abend</small><h2>Dein Dashboard</h2></div><div className="avatar">LV</div></header>
          <div className="stats"><article><small>Offene Aufgaben</small><strong>3</strong></article><article><small>Serie</small><strong>12 Tage</strong></article><article><small>Punkte</small><strong>1.240</strong></article></div>
          <div className="panel"><div className="panelHead"><h3>Heutige Aufgaben</h3><button>+ Neue Aufgabe</button></div>{tasks.map((task) => <div className="task" key={task.title}><span className="check"></span><div><b>{task.title}</b><small>{task.meta}</small></div><strong>+{task.points}</strong></div>)}</div>
        </div>
      </section>

      <section id="features" className="features shell">
        <article><span>01</span><h3>Aufgaben & Routinen</h3><p>Einmalige und wiederkehrende Aufgaben mit Fristen, Punkten und Nachweisen.</p></article>
        <article><span>02</span><h3>Klare Vereinbarungen</h3><p>Grenzen, Regeln und Einwilligungen transparent dokumentieren und jederzeit widerrufen.</p></article>
        <article><span>03</span><h3>Diskrete Verwaltung</h3><p>Private Profile, geschützte Inhalte und nachvollziehbare Zugriffsrechte.</p></article>
      </section>

      <section id="safety" className="safety shell"><div><small>SICHERHEIT ZUERST</small><h2>Macht braucht Verantwortung.</h2></div><p>House of Doms ist ausschließlich für volljährige Nutzer und freiwillige, jederzeit widerrufbare Vereinbarungen gedacht. Drohungen, Erpressung und nicht einvernehmliche Veröffentlichung privater Inhalte sind verboten.</p></section>

      <footer className="shell"><b>House of Doms</b><span>© 2026 · Consent first.</span></footer>
    </main>
  );
}
