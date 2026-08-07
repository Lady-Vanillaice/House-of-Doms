"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";
import "./entrance.css";
import "./entrance-motion.css";

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
      "MEIN HOUSE",
      "MEINE REGELN",
      "MEIN KOMMANDO",
      "PRIVATE KAMMER",
      "AUFGABEN",
      "JOURNAL",
      "HOUSE STORE",
      "KALENDER",
      "BEWERBUNGEN",
      "HOUSE-EINSTELLUNGEN",
      "HOUSE-SCHLÜSSEL",
      "WILLKOMMEN ZU HAUSE",
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
      "MY HOUSE",
      "MY RULES",
      "MY COMMAND",
      "PRIVATE CHAMBER",
      "TASKS",
      "JOURNAL",
      "HOUSE STORE",
      "CALENDAR",
      "APPLICATIONS",
      "HOUSE SETTINGS",
      "HOUSE KEY",
      "WELCOME HOME",
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
    const initial: Lang = stored === "en" || stored === "de"
      ? stored
      : navigator.language.toLowerCase().startsWith("en") ? "en" : "de";
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
    window.setTimeout(() => router.push("/anmelden"), 1250);
  }

  return (
    <main className={`luxuryEntrance${entering ? " isEntering" : ""}`}>
      <div className="entranceStone" aria-hidden="true" />
      <div className="wallGlow" aria-hidden="true" />
      <div className="groundLight" aria-hidden="true" />
      <div className="floor" aria-hidden="true" />

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
              <div className="doorOrnament" aria-hidden="true">
                <img src="/door-emblem.svg" alt="" />
              </div>
              <div className="handles" aria-hidden="true"><span /><span /></div>
              <button className="enterOverlay" type="button" onClick={enterHouse} aria-label={t.enter}>
                <span>{t.enter}</span>
              </button>
            </div>
          </div>

          <div className="steps" aria-hidden="true"><span /><span /><span /></div>
        </div>

        <aside className="housePlaque plaqueRight">
          <img className="plaqueEmblem" src="/door-emblem.svg" alt="" aria-hidden="true" />
          <strong>HOUSE<br />OF<br />DOMS</strong>
          <small>Discipline · Devotion · Desire</small>
        </aside>
      </section>

      <div className="entranceCopy">
        <div className="kicker">HOUSE OF DOMS</div>
        <h1>{lang === "de" ? "MEIN HOUSE. MEINE REGELN. MEIN KOMMANDO." : "MY HOUSE. MY RULES. MY COMMAND."}</h1>
        <p>{t.legal}</p>
      </div>
      <div className="entranceHint">{t.hint}</div>

      <div className="wordBurst" aria-hidden="true">
        {t.flyingWords.map((word, index) => (
          <span key={`${lang}-${word}-${index}`} style={{ "--word-index": index } as CSSProperties}>
            {word}
          </span>
        ))}
      </div>
    </main>
  );
}
