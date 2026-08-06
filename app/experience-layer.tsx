"use client";

import { useEffect, useRef, useState } from "react";

const copy = {
  de: { opening: "DIE TÜR ÖFFNET SICH", welcome: "WILLKOMMEN ZU HAUSE", key: "HOUSE KEY", alerts: "MITTEILUNGEN", quick: "SCHNELLZUGRIFF", copied: "Kopiert", copy: "Schlüssel kopieren", planned: "1 Aufgabe geplant", session: "Nächste Session", discover:"Discover", directory:"House-Verzeichnis", sessions:"Sessions", notifications:"Alle Mitteilungen", calendar: "Kalender", applications: "Bewerbungen", journal: "Journal", settings: "Einstellungen", sound: "Atmosphäre", focus: "Fokus" },
  en: { opening: "THE DOOR IS OPENING", welcome: "WELCOME HOME", key: "HOUSE KEY", alerts: "NOTIFICATIONS", quick: "QUICK ACCESS", copied: "Copied", copy: "Copy key", planned: "1 task planned", session: "Next session", discover:"Discover", directory:"House Directory", sessions:"Sessions", notifications:"All notifications", calendar: "Calendar", applications: "Applications", journal: "Journal", settings: "Settings", sound: "Atmosphere", focus: "Focus" }
};

export default function ExperienceLayer() {
  const [lang, setLang] = useState<"de" | "en">("de");
  const [opening, setOpening] = useState(false);
  const [welcome, setWelcome] = useState(false);
  const [inside, setInside] = useState(false);
  const [panel, setPanel] = useState<"key" | "alerts" | "quick" | null>(null);
  const [copied, setCopied] = useState(false);
  const [sound, setSound] = useState(false);
  const [focus, setFocus] = useState(false);
  const bypass = useRef(false);
  const t = copy[lang];

  useEffect(() => {
    const sync = () => {
      setLang(document.documentElement.lang === "en" ? "en" : "de");
      setInside(!document.querySelector(".landing") && !document.querySelector(".onboarding"));
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, childList: true, subtree: true });
    const handleEnter = (event: MouseEvent) => {
      if (bypass.current) { bypass.current = false; return; }
      const button = (event.target as HTMLElement | null)?.closest(".landing .enterButton") as HTMLButtonElement | null;
      if (!button) return;
      event.preventDefault(); event.stopPropagation(); setOpening(true);
      document.body.classList.add("doorExperienceActive");
      window.setTimeout(() => { setWelcome(true); bypass.current = true; button.click(); }, 1250);
      window.setTimeout(() => { setOpening(false); setWelcome(false); document.body.classList.remove("doorExperienceActive"); sync(); }, 2450);
    };
    document.addEventListener("click", handleEnter, true);
    return () => { observer.disconnect(); document.removeEventListener("click", handleEnter, true); };
  }, []);

  useEffect(() => { document.body.classList.toggle("houseFocusMode", focus); }, [focus]);
  const copyKey = async () => { await navigator.clipboard?.writeText("HOD-0001"); setCopied(true); window.setTimeout(() => setCopied(false), 1400); };

  return <>
    {opening && <div className="doorCinematic" role="status" aria-live="polite"><div className="cinematicAura" /><div className="cinematicPortal"><div className="cinematicDoor left"><span>H</span></div><div className="cinematicDoor right" /><div className="cinematicLight" /></div><strong>{welcome ? t.welcome : t.opening}</strong><i /></div>}
    {inside && <div className="houseGadgets"><button onClick={() => setPanel(panel === "key" ? null : "key")} title={t.key}><b>◆</b><span>{t.key}</span></button><button onClick={() => setPanel(panel === "alerts" ? null : "alerts")} title={t.alerts}><b>●</b><em>3</em><span>{t.alerts}</span></button><button onClick={() => setPanel(panel === "quick" ? null : "quick")} title={t.quick}><b>✦</b><span>{t.quick}</span></button><button className={sound ? "enabled" : ""} onClick={() => setSound(!sound)} title={t.sound}><b>{sound ? "◉" : "○"}</b><span>{t.sound}</span></button><button className={focus ? "enabled" : ""} onClick={() => setFocus(!focus)} title={t.focus}><b>◐</b><span>{t.focus}</span></button></div>}
    {inside && panel && <aside className="gadgetPanel"><button className="gadgetClose" onClick={() => setPanel(null)}>×</button><span className="gadgetLabel">{panel === "key" ? t.key : panel === "alerts" ? t.alerts : t.quick}</span>{panel === "key" && <><div className="digitalHouseKey"><small>HOUSE OF DOMS</small><strong>HOD-0001</strong><span>OBSIDIAN · ACTIVE</span></div><button className="gadgetAction" onClick={copyKey}>{copied ? t.copied : t.copy}</button></>}{panel === "alerts" && <div className="gadgetFeed"><article><b>{t.planned}</b><span>08. Aug. · 18:00</span></article><article><b>{t.session}</b><span>10. Aug. · 12:00</span></article><a href="/benachrichtigungen">{t.notifications} →</a></div>}{panel === "quick" && <div className="quickLinks"><a href="/discover">{t.discover}</a><a href="/houses">{t.directory}</a><a href="/sessions">{t.sessions}</a><a href="/benachrichtigungen">{t.notifications}</a><a href="/kalender">{t.calendar}</a><a href="/bewerbungen">{t.applications}</a><a href="/journal">{t.journal}</a><a href="/house-einstellungen">{t.settings}</a></div>}</aside>}
  </>;
}
