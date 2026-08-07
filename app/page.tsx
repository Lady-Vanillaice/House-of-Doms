import Link from "next/link";
import "./entrance.css";

export default function Home() {
  return (
    <main className="luxuryEntrance">
      <div className="entranceStone" aria-hidden="true" />
      <div className="groundLight" aria-hidden="true" />

      <div className="entranceActions">
        <Link href="/discover">Discover</Link>
        <Link href="/anmelden">Anmelden</Link>
      </div>

      <section className="entranceScene" aria-label="House of Doms Eingang">
        <aside className="housePlaque" aria-hidden="true">
          <div className="sigil"><span>H</span></div>
          <strong>HOUSE<br />OF<br />DOMS</strong>
          <small>Discipline · Devotion · Desire</small>
        </aside>

        <div className="doorTemple">
          <div className="archGlow" aria-hidden="true" />
          <div className="lantern left" aria-hidden="true" />
          <div className="lantern right" aria-hidden="true" />

          <div className="arch">
            <div className="transom" aria-hidden="true" />
            <div className="doubleDoor">
              <div className="doorLeaf" aria-hidden="true" />
              <div className="doorLeaf" aria-hidden="true" />
              <div className="doorOrnament" aria-hidden="true">H</div>
              <div className="handles" aria-hidden="true"><span /><span /></div>
              <Link className="enterOverlay" href="/anmelden" aria-label="House betreten">House betreten</Link>
            </div>
          </div>
          <div className="steps" aria-hidden="true" />
        </div>

        <aside className="housePlaque" aria-hidden="true">
          <div className="sigil"><span>H</span></div>
          <strong>HOUSE<br />OF<br />DOMS</strong>
          <small>Discipline · Devotion · Desire</small>
        </aside>
      </section>

      <div className="entranceCopy">
        <div className="kicker">HOUSE OF DOMS</div>
        <h1>DEIN HOUSE. DEINE REGELN.</h1>
        <p>Ein geschützter digitaler Raum für volljährige, einvernehmliche Dynamiken.</p>
      </div>
      <div className="entranceHint">Tür berühren, um einzutreten</div>
    </main>
  );
}
