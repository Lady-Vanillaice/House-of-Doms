"use client";

import { useMemo, useState } from "react";
import "./studios.css";

type Studio = {
  id: string;
  name: string;
  city: string;
  region: string;
  intro: string;
  verified: boolean;
  featured: boolean;
  rentable: boolean;
  discreet: boolean;
  accessible: boolean;
  transit: string;
  amenities: string[];
  sessionTypes: string[];
  nextSlots: string[];
};

const studios: Studio[] = [
  {
    id: "obsidian-suite-berlin",
    name: "Obsidian Suite Berlin",
    city: "Berlin",
    region: "Berlin",
    intro: "Diskretes, privat buchbares Studio mit mehreren Themenräumen, Umkleide und separatem Empfang.",
    verified: true,
    featured: true,
    rentable: true,
    discreet: true,
    accessible: false,
    transit: "U-Bahn ca. 6 Min.",
    amenities: ["Dusche", "Umkleide", "Parken", "Privater Eingang", "Foto-Licht"],
    sessionTypes: ["Private Sessions", "Fotoshooting", "Dom/Domina vor Ort"],
    nextSlots: ["08. Aug. · 18:00", "10. Aug. · 12:00", "12. Aug. · 20:00"]
  },
  {
    id: "velvet-rooms-hamburg",
    name: "Velvet Rooms Hamburg",
    city: "Hamburg",
    region: "Hamburg",
    intro: "Mietstudio mit ruhiger Lounge, zwei separat buchbaren Räumen und flexiblem Stundenmodell.",
    verified: true,
    featured: false,
    rentable: true,
    discreet: true,
    accessible: true,
    transit: "S-Bahn ca. 4 Min.",
    amenities: ["Barrierearm", "Dusche", "Lounge", "ÖPNV", "Spättermine"],
    sessionTypes: ["Mietstudio", "Private Sessions", "Content-Produktion"],
    nextSlots: ["09. Aug. · 16:30", "11. Aug. · 19:00"]
  },
  {
    id: "noir-private-suite-koeln",
    name: "Noir Private Suite Köln",
    city: "Köln",
    region: "Nordrhein-Westfalen",
    intro: "Kleines privates Studio für Einzeltermine mit vollständig separatem Zugang und diskreter Terminplanung.",
    verified: false,
    featured: true,
    rentable: false,
    discreet: true,
    accessible: false,
    transit: "Parkhaus ca. 2 Min.",
    amenities: ["Privater Eingang", "Parken", "Umkleide", "Getränke"],
    sessionTypes: ["Private Sessions", "Dom/Domina vor Ort"],
    nextSlots: ["13. Aug. · 15:00"]
  }
];

export default function StudiosPage() {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("alle");
  const [rentableOnly, setRentableOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [accessibleOnly, setAccessibleOnly] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return studios.filter((studio) => {
      const searchable = [studio.name, studio.city, studio.region, studio.intro, ...studio.amenities, ...studio.sessionTypes].join(" ").toLowerCase();
      if (q && !searchable.includes(q)) return false;
      if (city !== "alle" && studio.city !== city) return false;
      if (rentableOnly && !studio.rentable) return false;
      if (verifiedOnly && !studio.verified) return false;
      if (accessibleOnly && !studio.accessible) return false;
      return true;
    });
  }, [query, city, rentableOnly, verifiedOnly, accessibleOnly]);

  return (
    <main className="studiosPage">
      <a className="studioBack" href="/">← House</a>
      <section className="studioHero">
        <span>STUDIOS · VERZEICHNIS</span>
        <h1>Räume für Sessions, Produktion und private Termine.</h1>
        <p>Studios können sich präsentieren, freie Zeitfenster zeigen und später direkt mit Sessions und Buchungen verbunden werden. Hervorgehobene Profile sind klar als Featured gekennzeichnet.</p>
      </section>

      <section className="studioFilters">
        <label>Suche<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Studio, Ort, Ausstattung …" /></label>
        <label>Ort<select value={city} onChange={(event) => setCity(event.target.value)}><option value="alle">Alle Orte</option><option>Berlin</option><option>Hamburg</option><option>Köln</option></select></label>
        <label className="studioCheck"><input type="checkbox" checked={rentableOnly} onChange={(event) => setRentableOnly(event.target.checked)} /> Mietbar</label>
        <label className="studioCheck"><input type="checkbox" checked={verifiedOnly} onChange={(event) => setVerifiedOnly(event.target.checked)} /> Verifiziert</label>
        <label className="studioCheck"><input type="checkbox" checked={accessibleOnly} onChange={(event) => setAccessibleOnly(event.target.checked)} /> Barrierearm</label>
      </section>

      <div className="studioMeta"><strong>{results.length} Studios</strong><span>Alpha-Daten · Supabase-Anbindung folgt</span></div>

      <section className="studioGrid">
        {results.map((studio) => (
          <article className="studioCard" key={studio.id}>
            <div className="studioVisual">
              <div className="studioMark">HOD</div>
              <div className="studioBadges">
                {studio.featured && <span>FEATURED</span>}
                {studio.verified && <span>VERIFIZIERT</span>}
                {studio.discreet && <span>DISKRET</span>}
              </div>
            </div>
            <div className="studioBody">
              <div className="studioTitleRow"><div><small>{studio.city} · {studio.region}</small><h2>{studio.name}</h2></div><span className="studioStatus">freie Zeiten</span></div>
              <p>{studio.intro}</p>
              <div className="studioTags">{studio.amenities.map((item) => <span key={item}>{item}</span>)}</div>
              <div className="studioFacts"><b>Geeignet für</b><span>{studio.sessionTypes.join(" · ")}</span><b>Anreise</b><span>{studio.transit}</span></div>
              <div className="studioSlots"><b>Nächste freie Zeiten</b>{studio.nextSlots.map((slot) => <span key={slot}>{slot}</span>)}</div>
              <div className="studioActions"><a href={`/studios/${studio.id}`}>Studio ansehen</a><a className="studioSessionLink" href={`/sessions?studio=${studio.id}`}>Mit Session verknüpfen</a></div>
            </div>
          </article>
        ))}
      </section>

      {results.length === 0 && <div className="studioEmpty">Keine Studios für diese Filter gefunden.</div>}

      <section className="studioPromoInfo">
        <div><span>FÜR STUDIOS</span><h2>Eigene Präsenz auf House of Doms.</h2><p>Vorbereitet sind öffentliche Profile, Ausstattung, Verfügbarkeit, Featured-Platzierung und die Verbindung zu Sessions. Zahlungen und echte Buchungen werden erst nach der Supabase-Anbindung aktiviert.</p></div>
        <div className="promoCards"><article><b>Standard</b><span>Profil · Ausstattung · freie Slots</span></article><article><b>Featured</b><span>Hervorgehobene Platzierung · klar gekennzeichnet</span></article><article><b>Session-ready</b><span>Später direkt mit Kalender und Buchung verbunden</span></article></div>
      </section>
    </main>
  );
}
