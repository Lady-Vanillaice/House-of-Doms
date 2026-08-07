import Link from "next/link";
import "./entrance.css";

export default function Home() {
  return (
    <main className="luxuryEntrance">
      <div className="entranceStone" aria-hidden="true" />
      <div className="wallGlow" aria-hidden="true" />
      <div className="groundLight" aria-hidden="true" />
      <div className="floor" aria-hidden="true" />

      <div className="entranceActions">
        <Link href="/discover">Discover</Link>
        <Link href="/anmelden">Anmelden</Link>
      </div>

      <section className="entranceScene" aria-label="House of Doms Eingang">
        <aside className="housePlaque plaqueLeft">
          <div className="plaqueSigil" aria-hidden="true"><span>H</span></div>
          <strong>HOUSE<br />OF<br />DOMS</strong>
          <small>Discipline · Devotion · Desire</small>
        </aside>

        <div className="doorTemple">
          <div className="archGlow" aria-hidden="true" />
          <div className="lantern left" aria-hidden="true"><span /></div>
          <div className="lantern right" aria-hidden="true"><span /></div>

          <div className="arch">
            <div className="archCrown" aria-hidden="true" />
            <div className="transom" aria-hidden="true">
              <span className="transomRay rayOne" />
              <span className="transomRay rayTwo" />
              <span className="transomRay rayThree" />
            </div>

            <div className="doubleDoor">
              <div className="doorLeaf doorLeft" aria-hidden="true"><span className="panelTop" /><span className="panelBottom" /></div>
              <div className="doorLeaf doorRight" aria-hidden="true"><span className="panelTop" /><span className="panelBottom" /></div>
              <div className="doorOrnament" aria-hidden="true">H</div>
              <div className="handles" aria-hidden="true"><span /><span /></div>
              <Link className="enterOverlay" href="/anmelden" aria-label="House betreten">
                <span>HOUSE BETRETEN</span>
              </Link>
            </div>
          </div>

          <div className="steps" aria-hidden="true"><span /><span /><span /></div>
        </div>

        <aside className="housePlaque plaqueRight">
          <div className="plaqueSigil" aria-hidden="true"><span>H</span></div>
          <strong>HOUSE<br />OF<br />DOMS</strong>
          <small>Discipline · Devotion · Desire</small>
        </aside>
      </section>

      <div className="entranceCopy">
        <div className="kicker">HOUSE OF DOMS</div>
        <h1>DISCIPLINE. DEVOTION. DESIRE.</h1>
        <p>Nur für volljährige Personen · freiwillig · einvernehmlich · privat</p>
      </div>
      <div className="entranceHint">Die Tür berühren, um einzutreten</div>
    </main>
  );
}
