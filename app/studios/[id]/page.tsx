"use client";

import { useParams } from "next/navigation";
import "../studios.css";

const profiles: Record<string, {name:string;city:string;verified:boolean;intro:string;amenities:string[];sessionTypes:string[];slots:string[];access:string;rules:string[]}> = {
  "obsidian-suite-berlin": {name:"Obsidian Suite Berlin",city:"Berlin",verified:true,intro:"Diskretes, privat buchbares Studio mit mehreren Themenräumen, Umkleide und separatem Empfang.",amenities:["Dusche","Umkleide","Parken","Privater Eingang","Foto-Licht"],sessionTypes:["Private Sessions","Fotoshooting","Dom/Domina vor Ort"],slots:["08. Aug. · 18:00","10. Aug. · 12:00","12. Aug. · 20:00"],access:"Adresse wird nach bestätigter Buchung freigegeben.",rules:["Nur volljährige Gäste","Einvernehmliche Nutzung","Räume sauber hinterlassen","Keine Weitergabe der Zugangsdaten"]},
  "velvet-rooms-hamburg": {name:"Velvet Rooms Hamburg",city:"Hamburg",verified:true,intro:"Mietstudio mit ruhiger Lounge, zwei separat buchbaren Räumen und flexiblem Stundenmodell.",amenities:["Barrierearm","Dusche","Lounge","ÖPNV","Spättermine"],sessionTypes:["Mietstudio","Private Sessions","Content-Produktion"],slots:["09. Aug. · 16:30","11. Aug. · 19:00"],access:"Zentrale Lage, genaue Zugangsdaten nach Bestätigung.",rules:["Nur volljährige Gäste","Reservierungen sind personengebunden","Hausregeln vor Termin bestätigen"]},
  "noir-private-suite-koeln": {name:"Noir Private Suite Köln",city:"Köln",verified:false,intro:"Kleines privates Studio für Einzeltermine mit vollständig separatem Zugang und diskreter Terminplanung.",amenities:["Privater Eingang","Parken","Umkleide","Getränke"],sessionTypes:["Private Sessions","Dom/Domina vor Ort"],slots:["13. Aug. · 15:00"],access:"Diskreter Zugang, Details erst nach bestätigtem Termin.",rules:["Nur volljährige Gäste","Keine unangemeldeten Begleitpersonen","Privatsphäre anderer Gäste respektieren"]}
};

export default function StudioDetailPage(){
  const params = useParams<{id:string}>();
  const studio = profiles[params.id];
  if(!studio) return <main className="studiosPage"><a className="studioBack" href="/studios">← Studios</a><div className="studioEmpty">Studio nicht gefunden.</div></main>;
  return <main className="studiosPage">
    <a className="studioBack" href="/studios">← Studios</a>
    <section className="studioHero"><span>{studio.verified ? "VERIFIZIERT · " : ""}{studio.city.toUpperCase()}</span><h1>{studio.name}</h1><p>{studio.intro}</p></section>
    <section className="studioPromoInfo">
      <div><span>AUSSTATTUNG</span><h2>Für private Termine vorbereitet.</h2><div className="studioTags">{studio.amenities.map(x=><span key={x}>{x}</span>)}</div><div className="studioFacts"><b>Nutzung</b><span>{studio.sessionTypes.join(" · ")}</span><b>Zugang</b><span>{studio.access}</span></div></div>
      <div className="promoCards"><article><b>Freie Zeiten</b>{studio.slots.map(x=><span key={x}>{x}</span>)}</article><article><b>Hausregeln</b>{studio.rules.map(x=><span key={x}>• {x}</span>)}</article><a className="studioSessionLink" href={`/sessions?studio=${params.id}`}>Mit einer Session verknüpfen →</a></div>
    </section>
  </main>;
}
