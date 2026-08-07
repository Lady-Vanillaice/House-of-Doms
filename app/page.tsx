"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";
import "./entrance-reference.css";
import "./entrance-jpg-fix.css";

type Lang = "de" | "en";

const copy = {
  de: {
    home: "HOME", dominas: "DOMINAS", membership: "MEMBERSHIP", about: "ÜBER UNS", contact: "KONTAKT", login: "LOGIN", enter: "House betreten",
    flyingWords: ["DISZIPLIN","HINGABE","MACHT","VERTRAUEN","KONTROLLE","GEHORSAM","FÜHRUNG","UNTERWERFUNG","BINDUNG","RITUAL","LOYALITÄT","ACHTSAMKEIT","GRENZEN","KONSENS","VERANTWORTUNG","INTENSITÄT","DOMINANZ","DEVOTION"],
  },
  en: {
    home: "HOME", dominas: "DOMINAS", membership: "MEMBERSHIP", about: "ABOUT US", contact: "CONTACT", login: "LOGIN", enter: "Enter House",
    flyingWords: ["DISCIPLINE","DEVOTION","POWER","TRUST","CONTROL","OBEDIENCE","GUIDANCE","SUBMISSION","BOND","RITUAL","LOYALTY","MINDFULNESS","BOUNDARIES","CONSENT","RESPONSIBILITY","INTENSITY","DOMINANCE","SURRENDER"],
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
    window.setTimeout(() => router.push("/anmelden"), 4600);
  }

  return (
    <main className={`referenceEntrance${entering ? " isEntering" : ""}`}>
      <div className="referenceScene">
        <div className="referenceBackdrop" aria-hidden="true" />
        <div className="referenceVignette" aria-hidden="true" />
        <button className="referenceDoorHotspot" type="button" onClick={enterHouse} aria-label={t.enter} />
        <div className="referenceDoorGlow" aria-hidden="true" />
        <div className="referenceWords" aria-hidden="true">{t.flyingWords.map((word,index)=><span key={`${lang}-${word}-${index}`} style={{"--word-index":index} as CSSProperties}>{word}</span>)}</div>
      </div>

      <header className="referenceNav">
        <Link href="/" className="referenceBrand"><img src="/door-emblem.svg" alt="" /><span>HOUSE OF DOMS</span></Link>
        <nav>
          <Link href="/">{t.home}</Link><Link href="/discover">{t.dominas}</Link><Link href="/abonnements">{t.membership}</Link><Link href="/ueber-uns">{t.about}</Link><Link href="/kontakt">{t.contact}</Link>
        </nav>
        <div className="referenceNavActions"><button type="button" onClick={() => changeLanguage(lang === "de" ? "en" : "de")}>{lang.toUpperCase()}</button><Link href="/anmelden">{t.login}</Link></div>
      </header>
    </main>
  );
}
