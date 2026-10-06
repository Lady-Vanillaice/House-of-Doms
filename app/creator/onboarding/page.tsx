"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../../lib/supabase/client";
import "./onboarding.css";

type Profile = {
  user_id: string;
  display_name: string;
  role: string;
  bio: string;
  location: string;
  languages: string[];
  offers: string[];
  seeks: string[];
  boundaries: string[];
  contact_status: string;
  studio_info: string;
  is_verified: boolean;
  visibility: string;
};

const emptyProfile: Profile = {
  user_id: "",
  display_name: "",
  role: "dom",
  bio: "",
  location: "",
  languages: ["DE"],
  offers: [],
  seeks: [],
  boundaries: ["Jederzeit widerrufbar"],
  contact_status: "open",
  studio_info: "",
  is_verified: false,
  visibility: "public",
};

function csv(value: string) {
  return value.split(",").map((x) => x.trim()).filter(Boolean);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "creator";
}

export default function CreatorOnboardingPage() {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    try {
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        window.location.href = "/anmelden?tab=register&rolle=creator";
        return;
      }
      const user = authData.user;
      const { data } = await supabase.from("profile_details").select("*").eq("user_id", user.id).maybeSingle();
      const metadata = user.user_metadata ?? {};
      const next = data
        ? ({ ...emptyProfile, ...data, user_id: user.id } as Profile)
        : ({
            ...emptyProfile,
            user_id: user.id,
            display_name: metadata.display_name ?? user.email?.split("@")[0] ?? "",
            role: metadata.role ?? "dom",
          } as Profile);
      setProfile(next);
      setSlug(slugify(next.display_name));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Onboarding konnte nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }

  const progress = useMemo(() => Math.round((step / 3) * 100), [step]);

  async function finish() {
    setSaving(true);
    setMessage("");
    try {
      const supabase = createClient();
      const { error: profileError } = await supabase.from("profile_details").upsert(
        { ...profile, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );
      if (profileError) throw profileError;

      const cleanSlug = slugify(slug || profile.display_name);
      const { error: siteError } = await supabase.rpc("save_my_domina_site", {
        p_slug: cleanSlug,
        p_display_name: profile.display_name,
        p_headline: profile.bio ? profile.bio.slice(0, 120) : "Willkommen in meinem House",
        p_about_text: profile.bio,
        p_services_text: profile.offers.join(", "),
        p_rules_text: profile.boundaries.join(", "),
        p_pricing_text: "",
        p_faq_text: "",
        p_location_text: profile.location,
        p_contact_note: profile.studio_info,
        p_theme: "obsidian",
        p_instagram_url: null,
        p_website_url: null,
        p_is_published: false,
      });

      if (siteError) {
        setMessage("Profil gespeichert. Die öffentliche Creator-Seite konnte noch nicht automatisch angelegt werden: " + siteError.message);
      } else {
        setMessage("Dein Creator-Grundprofil ist bereit. Deine öffentliche Seite wurde als Entwurf angelegt.");
      }
      setFinished(true);
      setSlug(cleanSlug);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Dein Creator-Profil konnte nicht gespeichert werden.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <main className="creatorOnboarding"><section className="onboardingCard"><p>Creator-Onboarding wird geladen …</p></section></main>;
  }

  if (finished) {
    return <main className="creatorOnboarding">
      <section className="onboardingCard successCard">
        <span className="onboardingKicker">DEIN CREATOR-BEREICH IST BEREIT</span>
        <h1>Jetzt wird aus deinem Profil ein echtes Angebot.</h1>
        <p>{message}</p>
        <div className="nextGrid">
          <Link href="/homepage-builder"><strong>Öffentliche Creator-Seite gestalten</strong><span>Hero, Galerie, Buchung, Memberships, SEO und Veröffentlichung.</span></Link>
          <Link href="/store"><strong>Content anlegen</strong><span>Öffentlich, Pay-per-View oder exklusiv für Memberships.</span></Link>
          <Link href="/profil"><strong>Profil prüfen</strong><span>Kinks, Grenzen, Standort und Kontaktstatus jederzeit anpassen.</span></Link>
          <Link href="/discover"><strong>Discover ansehen</strong><span>So wirkt dein Angebot aus Sicht der Members.</span></Link>
        </div>
        <div className="onboardingActions">
          <Link className="primaryAction" href="/homepage-builder">CREATOR-SEITE WEITERBAUEN →</Link>
          <Link href={slug ? `/d/${slug}` : "/profil"}>Öffentliche URL prüfen</Link>
        </div>
      </section>
    </main>;
  }

  return <main className="creatorOnboarding">
    <header className="onboardingTop">
      <Link href="/" className="onboardingBrand"><img src="/door-emblem.svg" alt=""/><span>HOUSE OF DOMS</span></Link>
      <span>CREATOR ONBOARDING · {progress}%</span>
    </header>

    <section className="onboardingShell">
      <div className="onboardingIntro">
        <span className="onboardingKicker">SCHRITT {step} VON 3</span>
        <h1>{step === 1 ? "Zeig, wer du bist." : step === 2 ? "Was möchtest du anbieten?" : "Wie soll dein House sichtbar sein?"}</h1>
        <p>{step === 1 ? "Dein Name, deine Präsenz und deine Kinks bilden die Grundlage deines Creator-Profils." : step === 2 ? "Content, Sessions, Workshops oder Memberships: Sag klar, was Members bei dir finden können." : "Lege Kontakt, Sichtbarkeit und deine öffentliche URL fest. Veröffentlichen kannst du später im Creator-Builder."}</p>
        <div className="progressBar"><i style={{ width: `${progress}%` }}/></div>
      </div>

      <section className="onboardingCard">
        {step === 1 && <>
          <label>Anzeigename<input value={profile.display_name} onChange={e => { setProfile(p => ({...p, display_name:e.target.value})); if (!slug) setSlug(slugify(e.target.value)); }} placeholder="Dein Creator-Name"/></label>
          <label>Standort / Region<input value={profile.location} onChange={e => setProfile(p => ({...p, location:e.target.value}))} placeholder="z. B. Berlin oder Online"/></label>
          <label>Sprachen<input value={profile.languages.join(", ")} onChange={e => setProfile(p => ({...p, languages:csv(e.target.value)}))} placeholder="DE, EN"/></label>
          <label>Über dich<textarea rows={6} value={profile.bio} onChange={e => setProfile(p => ({...p, bio:e.target.value}))} placeholder="Wer bist du? Welche Atmosphäre, Kinks und Art von Angeboten erwartet Members bei dir?"/></label>
          <label>Interessen & Kinks<input value={profile.seeks.join(", ")} onChange={e => setProfile(p => ({...p, seeks:csv(e.target.value)}))} placeholder="Shibari, Latex, Fußfetisch, Bondage, Worship …"/></label>
        </>}

        {step === 2 && <>
          <label>Content, Sessions & Angebote<textarea rows={6} value={profile.offers.join(", ")} onChange={e => setProfile(p => ({...p, offers:csv(e.target.value)}))} placeholder="z. B. Foto-Content, Videos, Memberships, Studio-Sessions, Shibari, Workshops"/></label>
          <label>Sessions, Studio & Verfügbarkeit<textarea rows={5} value={profile.studio_info} onChange={e => setProfile(p => ({...p, studio_info:e.target.value}))} placeholder="z. B. Studio in Berlin · Termine nach Kalender · Online-Sessions möglich"/></label>
          <label>Grenzen & Rahmen<textarea rows={5} value={profile.boundaries.join(", ")} onChange={e => setProfile(p => ({...p, boundaries:csv(e.target.value)}))} placeholder="Klare Absprache, Consent first, keine Veröffentlichung ohne Freigabe …"/></label>
        </>}

        {step === 3 && <>
          <label>Kontaktstatus<select value={profile.contact_status} onChange={e => setProfile(p => ({...p, contact_status:e.target.value}))}><option value="open">Kontakt geöffnet</option><option value="applications">Nur Anfragen</option><option value="closed">Vorübergehend geschlossen</option></select></label>
          <label>Profilsichtbarkeit<select value={profile.visibility} onChange={e => setProfile(p => ({...p, visibility:e.target.value}))}><option value="public">Öffentlich</option><option value="members">Nur Mitglieder</option><option value="private">Privat</option></select></label>
          <label>Deine öffentliche Creator-URL<div className="slugInput"><span>house-of-doms.com/d/</span><input value={slug} onChange={e => setSlug(slugify(e.target.value))}/></div></label>
          <div className="publishNote"><strong>Noch nicht live.</strong><p>Wir legen deine Creator-Seite zunächst als Entwurf an. Im nächsten Schritt kannst du Bilder, Galerie, Memberships, Buchung, SEO und Content ergänzen und sie erst dann veröffentlichen.</p></div>
        </>}

        {message && <p className="onboardingMessage">{message}</p>}

        <div className="onboardingActions">
          {step > 1 && <button type="button" onClick={() => setStep(s => s - 1)}>← ZURÜCK</button>}
          {step < 3
            ? <button className="primaryAction" type="button" onClick={() => setStep(s => s + 1)}>WEITER →</button>
            : <button className="primaryAction" type="button" onClick={finish} disabled={saving || !profile.display_name.trim()}>{saving ? "WIRD ANGELEGT …" : "CREATOR-BEREICH ANLEGEN →"}</button>}
        </div>
      </section>
    </section>
  </main>;
}
