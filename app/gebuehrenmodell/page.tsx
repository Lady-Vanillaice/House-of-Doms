"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import "./fee-model.css";

type Lang="de"|"en";

const copy={
  de:{
    back:"Zurück zur Startseite",
    kicker:"HOUSE OF DOMS · GEBÜHRENMODELL",
    title:"Transparent. Einfach. Planbar.",
    lead:"Dominas sollen vorab genau wissen, welche Abgaben entstehen. Das Modell trennt digitale Umsätze, Tribute, Sessions und optionale Zusatzleistungen klar voneinander.",
    items:[
      ["20 %","Abonnements","Wiederkehrende Mitgliedschaften und Abo-Umsätze über House of Doms."],
      ["10 %","Zahlsklave / Tribute","Tribute, Geschenke und Zahlungen ohne zusätzliche digitale Leistung."],
      ["20 %","Medien","Bezahlte Bilder, Videos und andere digitale Einzelinhalte."],
      ["15 %","Online-Sessions","Digitale oder online durchgeführte Sessions, die über die Plattform gebucht und bezahlt werden."],
      ["5 %","Studio-Sessions","Offline-Studio-Sessions mit reduzierter Plattformabgabe."],
      ["29,90 €","Homepage Pro / Monat","Optionale eigene House-Präsenz mit erweiterter Homepage, Branding und zusätzlichen Präsentationsfunktionen."]
    ],
    providerTitle:"Zahlungsanbieter",
    providerText:"Gebühren des Zahlungsdienstleisters werden von der Auszahlung der Domina abgezogen. House of Doms trägt diese Transaktionskosten nicht.",
    freeTitle:"Einstieg bleibt kostenlos",
    freeText:"Registrierung und normales Domina-Profil bleiben ohne Anmeldegebühr. Kosten entstehen erst bei Umsätzen oder bei freiwilligen Zusatzpaketen.",
    tiersTitle:"Umsatzbonus bei Abonnements",
    tiersLead:"Wer mehr Umsatz über House of Doms abwickelt, kann von einer niedrigeren Abo-Provision profitieren.",
    tiers:[["Bis 2.500 € / Monat","20 %"],["2.500–7.500 € / Monat","18 %"],["Über 7.500 € / Monat","15 %"]],
    exampleTitle:"Beispiel",
    exampleText:"Bei 100 € Tribut: 10 € Plattformabgabe. Die Zahlungsanbieter-Gebühr wird zusätzlich von der Domina-Auszahlung abgezogen. Der verbleibende Betrag wird an die Domina ausgezahlt.",
    note:"Alle Preise, Leistungen, Plattformabgaben und Zahlungsanbieter-Gebühren sollen vor Abschluss einer Zahlung transparent angezeigt werden."
  },
  en:{
    back:"Back to homepage",
    kicker:"HOUSE OF DOMS · FEE MODEL",
    title:"Transparent. Simple. Predictable.",
    lead:"Dommes should know in advance which fees apply. The model clearly separates digital revenue, tributes, sessions and optional add-ons.",
    items:[
      ["20%","Subscriptions","Recurring memberships and subscription revenue processed through House of Doms."],
      ["10%","Tributes / paypig payments","Tributes, gifts and payments without an additional digital deliverable."],
      ["20%","Media","Paid images, videos and other individual digital content."],
      ["15%","Online sessions","Digital or online sessions booked and paid through the platform."],
      ["5%","Studio sessions","Offline studio sessions with a reduced platform fee."],
      ["€29.90","Homepage Pro / month","Optional enhanced House presence with a fuller homepage, branding and extra presentation features."]
    ],
    providerTitle:"Payment provider fees",
    providerText:"Payment provider fees are deducted from the Domme payout. House of Doms does not absorb those transaction costs.",
    freeTitle:"Free to join",
    freeText:"Registration and the standard Domme profile remain free. Costs only arise when revenue is generated or optional add-ons are chosen.",
    tiersTitle:"Subscription volume bonus",
    tiersLead:"Higher subscription revenue processed through House of Doms can qualify for a lower subscription fee.",
    tiers:[["Up to €2,500 / month","20%"],["€2,500–€7,500 / month","18%"],["Above €7,500 / month","15%"]],
    exampleTitle:"Example",
    exampleText:"On a €100 tribute: €10 is the platform fee. The payment provider fee is additionally deducted from the Domme payout. The remaining amount is paid to the Domme.",
    note:"Price, service, platform fee and payment provider fee should be shown transparently before payment is completed."
  }
} as const;

export default function FeeModelPage(){
  const [lang,setLang]=useState<Lang>("de");
  useEffect(()=>{const stored=window.localStorage.getItem("house-language");const initial:Lang=stored==="en"?"en":"de";setLang(initial);document.documentElement.lang=initial},[]);
  const t=copy[lang];
  function switchLang(){const next:Lang=lang==="de"?"en":"de";setLang(next);window.localStorage.setItem("house-language",next);document.documentElement.lang=next}
  return <main className="feeModelPage">
    <header className="feeModelTop"><Link href="/#payments" className="feeBack">← {t.back}</Link><button onClick={switchLang}>{lang.toUpperCase()}</button></header>
    <section className="feeHero"><span>{t.kicker}</span><h1>{t.title}</h1><p>{t.lead}</p></section>
    <section className="feeCards">{t.items.map(([value,title,text])=><article key={title}><strong>{value}</strong><h2>{title}</h2><p>{text}</p></article>)}</section>
    <section className="feeInfoGrid"><article><span>TRANSAKTIONEN</span><h2>{t.providerTitle}</h2><p>{t.providerText}</p></article><article><span>START</span><h2>{t.freeTitle}</h2><p>{t.freeText}</p></article></section>
    <section className="feeTiers"><span>LOYALTY / VOLUME</span><h2>{t.tiersTitle}</h2><p>{t.tiersLead}</p><div>{t.tiers.map(([label,value])=><article key={label}><b>{label}</b><strong>{value}</strong></article>)}</div></section>
    <section className="feeExample"><span>BEISPIEL / EXAMPLE</span><h2>{t.exampleTitle}</h2><p>{t.exampleText}</p></section>
    <footer className="feeLegal">{t.note}</footer>
  </main>
}
