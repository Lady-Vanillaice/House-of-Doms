"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";
import "./entrance.css";
import "./entrance-motion.css";
import "./entrance-brand.css";
import "./entrance-overlay-fix.css";
import "./entrance-cinematic.css";
import "./entrance-detail-rich.css";

type Lang = "de" | "en";

const copy = {
  de: {
    discover: "Entdecken",
    login: "Anmelden",
    enter: "HOUSE BETRETEN",
    hint: "Die Tür berühren, um einzutreten",
    legal: "Nur für volljährige Personen · freiwillig · einvernehmlich · privat",
    aria: "House of Doms Eingang",
    flyingWords: [
      "DISZIPLIN", "HINGABE", "MACHT", "VERTRAUEN", "KONTROLLE", "GEHORSAM",
      "FÜHRUNG", "UNTERWERFUNG", "BINDUNG", "RITUAL", "LOYALITÄT", "ACHTSAMKEIT",
      "GRENZEN", "KONSENS", "VERANTWORTUNG", "INTENSITÄT", "DOMINANZ", "DEVOTION"
    ],
  },
  en: {
    discover: "Discover",
    login: "Login",
    enter: "ENTER THE HOUSE",
    hint: "Touch the door to enter",
    legal: "Adults only · voluntary · consensual · private",
    aria: "House of Doms entrance",
    flyingWords: [
      "DISCIPLINE", "DEVOTION", "POWER", "TRUST", "CONTROL", "OBEDIENCE",
      "GUIDANCE", "SUBMISSION", "BOND", "RITUAL", "LOYALTY", "MINDFULNESS",
      "BOUNDARIES", "CONSENT", "RESPONSIBILITY", "INTENSITY", "DOMINANCE", "SURRENDER"
    ],
  },
} as const;

export default function Home() {
  const router = useRouter();
  const [entering, setEntering] = useState(false);
  const [lang, setLang] = useState<Lang>("de");
  const t = copy[lang];

  useEffect(() => {
    const stored = window.localStorage.getItem("house-language");
    const initial: Lang = stored === "en" || stored === "de" ? stored : navigator.language.toLowerCase().startsWith("en") ? "en" : "de";
    setLang(initial);
    document.documentElement.lang = initial;
  }, []);

  function changeLanguage(next: Lang) {
    setLang(next);
    window.localStorage.setItem("house-language", next);
    document.documentElement.lang = next;
  }

  function enterHouse() {
    if (entering) return;
    setEntering(true);
    window.setTimeout(() => router.push("/anmelden"), 3600);
  }

  return (
    <main className={`luxuryEntrance${entering ? " isEntering" : ""}`}>
      <div className="entranceStone" aria-hidden="true" />
      <div className="wallGlow" aria-hidden="true" />
      <div className="groundLight" aria-hidden="true" />
      <div className="floor" aria-hidden="true" />
      <div className="facadeCornice" aria-hidden="true" />
      <div className="floorReflection" aria-hidden="true" />

      <div className="entranceActions">
        <div className="entranceLanguage" aria-label="Sprache / Language">
          <button type="button" className={lang === "de" ? "active" : ""} onClick={() => changeLanguage("de")}>DE</button>
          <button type="button" className={lang === "en" ? "active" : ""} onClick={() => changeLanguage("en")}>EN</button>
        </div>
        <Link href="/discover">{t.discover}</Link>
        <Link href="/anmelden">{t.login}</Link>
      </div>

      <section className="entranceScene" aria-label={t.aria}>
        <aside className="housePlaque plaqueLeft">
          <img className="plaqueEmblem" src="/door-emblem.svg" alt="" aria-hidden="true" />
          <strong>HOUSE<br />OF<br />DOMS</strong>
          <small>Discipline · Devotion · Desire</small>
        </aside>

        <div className="doorTemple">
          <div className="archGlow" aria-hidden="true" />
          <div className="doorLight" aria-hidden="true" />
          <div className="stonePilaster pilasterLeft" aria-hidden="true"><i/><i/><i/></div>
          <div className="stonePilaster pilasterRight" aria-hidden="true"><i/><i/><i/></div>
          <div className="lantern left" aria-hidden="true"><span /></div>
          <div className="lantern right" aria-hidden="true"><span /></div>
          <div className="arch">
            <div className="archCrown" aria-hidden="true" />
            <div className="transom" aria-hidden="true">
              <span className="transomRay rayOne" /><span className="transomRay rayTwo" /><span className="transomRay rayThree" />
              <span className="fanArc arcOne"/><span className="fanArc arcTwo"/><span className="fanArc arcThree"/>
            </div>
            <div className="doubleDoor">
              <div className="doorLeaf doorLeft" aria-hidden="true"><span className="panelTop" /><span className="panelBottom" /><span className="doorMoulding"/></div>
              <div className="doorLeaf doorRight" aria-hidden="true"><span className="panelTop" /><span className="panelBottom" /><span className="doorMoulding"/></div>
              <div className="doorOrnament" aria-hidden="true"><img src="/door-emblem.svg" alt="" /></div>
              <div className="handles" aria-hidden="true"><span /><span /></div>
              <button className="enterOverlay" type="button" onClick={enterHouse} aria-label={t.enter}><span>{t.enter}</span></button>
            </div>
          </div>
          <div className="steps" aria-hidden="true"><span /><span /><span /></div>
          <div className="entryRunner" aria-hidden="true" />
        </div>

        <aside className="housePlaque plaqueRight">
          <img className="plaqueEmblem" src="/door-emblem.svg" alt="" aria-hidden="true" />
          <strong>HOUSE<br />OF<br />DOMS</strong>
          <small>Discipline · Devotion · Desire</small>
        </aside>

        <div className="sideGarden leftGarden" aria-hidden="true"><span className="gardenPot"/><span className="shrub shrubTall"/><span className="shrub shrubLow"/></div>
        <div className="sideGarden rightGarden" aria-hidden="true"><span className="gardenPot"/><span className="shrub shrubTall"/><span className="shrub shrubLow"/></div>
        <div className="groundLamp groundLampLeft" aria-hidden="true" />
        <div className="groundLamp groundLampRight" aria-hidden="true" />
      </section>

      <div className="entranceCopy">
        <div className="kicker">HOUSE OF DOMS</div>
        <h1>{lang === "de" ? "MEIN HOUSE. MEINE REGELN. MEIN KOMMANDO." : "MY HOUSE. MY RULES. MY COMMAND."}</h1>
        <p>{t.legal}</p>
      </div>
      <div className="entranceHint">{t.hint}</div>

      <div className="wordBurst" aria-hidden="true">
        {t.flyingWords.map((word, index) => <span key={`${lang}-${word}-${index}`} style={{ "--word-index": index } as CSSProperties}>{word}</span>)}
      </div>
    </main>
  );
}
