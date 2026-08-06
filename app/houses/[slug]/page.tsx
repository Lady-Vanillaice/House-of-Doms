import Link from "next/link";
import "../houses.css";

const profiles: Record<string,{house:string;dom:string;city:string;style:string;open:boolean;bio:string}> = {
  "house-obsidian":{house:"House Obsidian",dom:"Madame Noire",city:"Hamburg",style:"Privater Kreis",open:true,bio:"Ein diskretes House mit Fokus auf Rituale, Reflexion und langfristige, einvernehmliche Dynamiken."},
  "house-velvet":{house:"House Velvet",dom:"Dom Alexander",city:"Köln",style:"Community",open:false,bio:"Persönliche Führung, regelmäßige Sessions und klare Vereinbarungen für volljährige Mitglieder."}
};

export default async function PublicHouseProfile({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const p=profiles[slug]??profiles["house-obsidian"];
  return <main className="directoryPage profilePage"><header className="profileHero"><div><Link href="/houses" className="backLink">← Zum House-Verzeichnis</Link><span className="eyebrow">ÖFFENTLICHES DOM-/DOMINA-PROFIL · 18+</span><h1>{p.dom}</h1><p className="profileLead">{p.bio}</p><div className="profileBadges"><span>{p.open?"✓ Bewerbungen offen":"○ Bewerbungen geschlossen"}</span><span>◆ {p.city}</span><span>◆ {p.style}</span></div></div><div className="profileSeal"><span>{p.dom.split(" ").map(v=>v[0]).join("").slice(0,2)}</span><strong>{p.house.toUpperCase()}</strong><small>PUBLIC ALPHA PROFILE</small></div></header><section className="profileLayout"><div className="profileMain"><article className="profilePanel"><span className="eyebrow">ÜBER DAS HOUSE</span><h2>{p.house}</h2><p>{p.bio} Grenzen, Einwilligung, Diskretion und offene Kommunikation stehen im Mittelpunkt.</p></article><article className="profilePanel"><span className="eyebrow">REGELN</span><h2>Klare Vereinbarungen</h2><ul><li>Nur für volljährige Personen</li><li>Freiwilligkeit und Einvernehmlichkeit</li><li>Respekt und vertrauliche Kommunikation</li><li>Aufgaben und Sessions nur nach Vereinbarung</li></ul></article></div><aside className="applicationAside"><span className="eyebrow">BEWERBUNG</span><h2>{p.open?"Die Tür ist offen.":"Aktuell geschlossen."}</h2><p>{p.open?"Sende eine persönliche Bewerbung mit Erfahrungen, Erwartungen, Verfügbarkeit und Grenzen.":"Dieses House nimmt derzeit keine neuen Bewerbungen an."}</p>{p.open&&<Link href="/bewerbungen" className="applyButton">Bewerbung senden →</Link>}<small>Eine Bewerbung begründet keine Verpflichtung. Beide Seiten entscheiden freiwillig.</small></aside></section></main>;
}
