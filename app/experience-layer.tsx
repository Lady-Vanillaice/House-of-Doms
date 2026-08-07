"use client";

import { useEffect, useMemo, useState } from "react";

const copy = {
  de: { opening: "DIE TÜR ÖFFNET SICH", welcome: "WILLKOMMEN ZU HAUSE", key: "HOUSE KEY", alerts: "MITTEILUNGEN", quick: "SCHNELLZUGRIFF", copied: "Kopiert", copy: "Schlüssel kopieren", planned: "1 Aufgabe geplant", session: "Nächste Session", discover:"Discover", directory:"House-Verzeichnis", studios:"Studios", store:"House Store", sessions:"Sessions", notifications:"Alle Mitteilungen", calendar: "Kalender", applications: "Bewerbungen", journal: "Journal", settings: "Einstellungen", sound: "Atmosphäre", focus: "Fokus" },
  en: { opening: "THE DOOR IS OPENING", welcome: "WELCOME HOME", key: "HOUSE KEY", alerts: "NOTIFICATIONS", quick: "QUICK ACCESS", copied: "Copied", copy: "Copy key", planned: "1 task planned", session: "Next session", discover:"Discover", directory:"House Directory", studios:"Studios", store:"House Store", sessions:"Sessions", notifications:"All notifications", calendar: "Calendar", applications: "Applications", journal: "Journal", settings: "Settings", sound: "Atmosphere", focus: "Focus" }
};

const entranceWords = ["Gehorsam", "Disziplin", "Hingabe", "Vertrauen", "Kontrolle", "Ordnung", "Loyalität", "Führung", "Respekt", "Pflicht"];

export default function ExperienceLayer() {
  const [lang, setLang] = useState<"de" | "en">("de");
  const [inside, setInside] = useState(false);
  const [showEntrance, setShowEntrance] = useState(false);
  const [opening, setOpening] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [panel, setPanel] = useState<"key" | "alerts" | "quick" | null>(null);
  const [copied, setCopied] = useState(false);
  const [sound, setSound] = useState(false);
  const [focus, setFocus] = useState(false);
  const t = copy[lang];

  const flyingWords = useMemo(() => entranceWords.map((word, index) => ({
    word,
    left: `${7 + (index % 5) * 20}%`,
    top: `${17 + Math.floor(index / 5) * 40 + (index % 2) * 8}%`,
    delay: `${index * 0.1}s`
  })), []);

  useEffect(() => {
    const sync = () => {
      setLang(document.documentElement.lang === "en" ? "en" : "de");
      const isRoot = window.location.pathname === "/";
      const landing = Boolean(document.querySelector(".landing"));
      const onboarding = Boolean(document.querySelector(".onboarding"));
      setShowEntrance(isRoot && landing);
      setInside(!landing && !onboarding && !isRoot);
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, childList: true, subtree: true });
    window.addEventListener("popstate", sync);
    return () => { observer.disconnect(); window.removeEventListener("popstate", sync); };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("houseFocusMode", focus);
  }, [focus]);

  useEffect(() => {
    if (!opening) return;
    const timer = window.setTimeout(() => setShowAuth(true), 1450);
    return () => window.clearTimeout(timer);
  }, [opening]);

  const openDoor = () => {
    if (opening) return;
    setOpening(true);
    setFocus(true);
  };

  const copyKey = async () => {
    await navigator.clipboard?.writeText("HOD-0001");
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return <>
    {showEntrance && <div className={`doorCinematic antiqueEntrance ${opening ? "isOpening" : ""}`} role="dialog" aria-label="House of Doms Eingang">
      <div className="ancientFog" />
      <div className="ancientDust" />
      <button className="antiqueDoorStage" onClick={openDoor} aria-label="House betreten">
        <div className="antiqueStoneFrame">
          <div className="antiqueDoor antiqueDoorLeft"><span className="ironOrnament">H</span><i className="ironRing" /></div>
          <div className="antiqueDoor antiqueDoorRight"><i className="ironRing" /></div>
          <div className="doorSeamLight" />
        </div>
        {!opening && <div className="entranceInvitation"><small>HOUSE OF DOMS</small><strong>Betritt das House</strong><span>Berühre die Tür</span></div>}
      </button>
      <div className="flyingWords" aria-hidden="true">
        {flyingWords.map(({word,left,top,delay}) => <span key={word} style={{left,top,animationDelay:delay}}>{word}</span>)}
      </div>
      <div className={`entranceAuth ${showAuth ? "visible" : ""}`}>
        <div className="entranceAuthCard">
          <small>{t.welcome}</small>
          <h2>Anmelden oder registrieren</h2>
          <p>Betritt dein persönliches House als Dom/Domina oder Sub/Sklave.</p>
          <div className="entranceAuthActions"><a href="/anmelden">Anmelden</a><a href="/anmelden?tab=register">Registrieren</a></div>
          <div className="entranceRoles"><span>DOM / DOMINA</span><span>SUB / SKLAVE</span></div>
        </div>
      </div>
    </div>}

    {inside && <div className="houseGadgets"><button onClick={() => setPanel(panel === "key" ? null : "key")} title={t.key}><b>◆</b><span>{t.key}</span></button><button onClick={() => setPanel(panel === "alerts" ? null : "alerts")} title={t.alerts}><b>●</b><em>3</em><span>{t.alerts}</span></button><button onClick={() => setPanel(panel === "quick" ? null : "quick")} title={t.quick}><b>✦</b><span>{t.quick}</span></button><button className={sound ? "enabled" : ""} onClick={() => setSound(!sound)} title={t.sound}><b>{sound ? "◉" : "○"}</b><span>{t.sound}</span></button><button className={focus ? "enabled" : ""} onClick={() => setFocus(!focus)} title={t.focus}><b>◐</b><span>{t.focus}</span></button></div>}
    {inside && panel && <aside className="gadgetPanel"><button className="gadgetClose" onClick={() => setPanel(null)}>×</button><span className="gadgetLabel">{panel === "key" ? t.key : panel === "alerts" ? t.alerts : t.quick}</span>{panel === "key" && <><div className="digitalHouseKey"><small>HOUSE OF DOMS</small><strong>HOD-0001</strong><span>OBSIDIAN · ACTIVE</span></div><button className="gadgetAction" onClick={copyKey}>{copied ? t.copied : t.copy}</button></>}{panel === "alerts" && <div className="gadgetFeed"><article><b>{t.planned}</b><span>08. Aug. · 18:00</span></article><article><b>{t.session}</b><span>10. Aug. · 12:00</span></article><a href="/benachrichtigungen">{t.notifications} →</a></div>}{panel === "quick" && <div className="quickLinks"><a href="/discover">{t.discover}</a><a href="/houses">{t.directory}</a><a href="/studios">{t.studios}</a><a href="/store">{t.store}</a><a href="/sessions">{t.sessions}</a><a href="/benachrichtigungen">{t.notifications}</a><a href="/kalender">{t.calendar}</a><a href="/bewerbungen">{t.applications}</a><a href="/journal">{t.journal}</a><a href="/house-einstellungen">{t.settings}</a></div>}</aside>}
  </>;
}
