"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../lib/supabase/client";
import "./profil.css";

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
  role: "sub",
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

const roleLabels: Record<string, string> = {
  domina: "Domina",
  dom: "Dom",
  sub: "Sub",
  sklave: "Sklave",
  switch: "Switch",
};

const contactLabels: Record<string, string> = {
  open: "Geöffnet",
  applications: "Nur Bewerbungen",
  closed: "Geschlossen",
};

function csvToArray(value: string) {
  return value.split(",").map((x) => x.trim()).filter(Boolean);
}

export default function ProfilePage() {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile>(emptyProfile);

  const initials = useMemo(() => {
    const value = profile.display_name || "House User";
    return value.split(/\s+/).map((x) => x[0]).join("").slice(0, 2).toUpperCase();
  }, [profile.display_name]);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData.user) {
          window.location.href = "/anmelden?error=" + encodeURIComponent("Bitte melde dich an, um dein Profil zu öffnen.");
          return;
        }

        const user = authData.user;
        setEmail(user.email ?? "");
        const metadata = user.user_metadata ?? {};

        const { data, error } = await supabase
          .from("profile_details")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setProfile({ ...emptyProfile, ...data, user_id: user.id });
        } else {
          const starter: Profile = {
            ...emptyProfile,
            user_id: user.id,
            display_name: metadata.display_name ?? user.email?.split("@")[0] ?? "",
            role: metadata.role ?? "sub",
          };
          const { error: insertError } = await supabase.from("profile_details").insert(starter);
          if (insertError) throw insertError;
          setProfile(starter);
        }
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Profil konnte nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function saveProfile() {
    setSaving(true);
    setMessage("");
    try {
      const supabase = createClient();
      const { error } = await supabase.from("profile_details").upsert({
        ...profile,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
      if (error) throw error;
      setEditing(false);
      setMessage("Profil gespeichert.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Profil konnte nicht gespeichert werden.");
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (loading) return <main className="profilePage"><section className="profileHero"><div className="profileHeroCopy"><span className="eyebrow">PROFIL WIRD GELADEN</span><h1>Einen Moment …</h1></div></section></main>;

  return <main className="profilePage">
    <section className="profileHero">
      <div className="profileAvatar">{initials}</div>
      <div className="profileHeroCopy">
        <span className="eyebrow">{profile.visibility === "public" ? "ÖFFENTLICHES PROFIL" : "PRIVATES PROFIL"}</span>
        <h1>{profile.display_name || "Dein Profil"}</h1>
        <p>{profile.bio || "Ergänze deine Bio, Interessen und Grenzen, damit passende Kontakte dich besser einschätzen können."}</p>
        <div className="profileMeta">
          <span>{roleLabels[profile.role] ?? profile.role}</span>
          {profile.location && <span>{profile.location}</span>}
          <span>{profile.languages.join(" · ")}</span>
          {profile.is_verified && <span className="verified">✓ Verifiziert</span>}
        </div>
      </div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        <button className="editProfile" onClick={() => setEditing(!editing)}>{editing ? "Vorschau" : "Profil bearbeiten"}</button>
        <button className="editProfile" onClick={signOut}>Abmelden</button>
      </div>
    </section>

    {message && <p className="authMessage" role="status">{message}</p>}

    <section className="profileGrid">
      <article className="profileCard"><h2>Konto & Kontakt</h2>
        <label>E-Mail<input value={email} disabled /></label>
        <label>Anzeigename<input value={profile.display_name} onChange={e => setProfile(p => ({...p, display_name:e.target.value}))} disabled={!editing}/></label>
        <label>Status<select value={profile.contact_status} onChange={e => setProfile(p => ({...p, contact_status:e.target.value}))} disabled={!editing}><option value="open">Geöffnet</option><option value="applications">Nur Bewerbungen</option><option value="closed">Geschlossen</option></select></label>
        <label>Rolle<select value={profile.role} onChange={e => setProfile(p => ({...p, role:e.target.value}))} disabled={!editing}><option value="domina">Domina</option><option value="dom">Dom</option><option value="sub">Sub</option><option value="sklave">Sklave</option><option value="switch">Switch</option></select></label>
        <label>Standort<input value={profile.location} onChange={e => setProfile(p => ({...p, location:e.target.value}))} disabled={!editing}/></label>
        <label>Sprachen<input value={profile.languages.join(", ")} onChange={e => setProfile(p => ({...p, languages:csvToArray(e.target.value)}))} disabled={!editing}/></label>
        <label>Sichtbarkeit<select value={profile.visibility} onChange={e => setProfile(p => ({...p, visibility:e.target.value}))} disabled={!editing}><option value="public">Öffentlich</option><option value="members">Nur Mitglieder</option><option value="private">Privat</option></select></label>
      </article>

      <article className="profileCard"><h2>Über mich</h2><textarea value={profile.bio} onChange={e => setProfile(p => ({...p, bio:e.target.value}))} disabled={!editing}/></article>

      <article className="profileCard"><h2>Biete ich</h2>{editing ? <textarea value={profile.offers.join(", ")} onChange={e => setProfile(p => ({...p, offers:csvToArray(e.target.value)}))}/> : <div className="tagCloud">{profile.offers.length ? profile.offers.map(x => <span key={x}>{x}</span>) : <span>Noch nicht ausgefüllt</span>}</div>}</article>

      <article className="profileCard"><h2>Suche ich</h2>{editing ? <textarea value={profile.seeks.join(", ")} onChange={e => setProfile(p => ({...p, seeks:csvToArray(e.target.value)}))}/> : <div className="tagCloud">{profile.seeks.length ? profile.seeks.map(x => <span key={x}>{x}</span>) : <span>Noch nicht ausgefüllt</span>}</div>}</article>

      <article className="profileCard wide"><h2>Grenzen & Rahmen</h2>{editing ? <textarea value={profile.boundaries.join(", ")} onChange={e => setProfile(p => ({...p, boundaries:csvToArray(e.target.value)}))}/> : <div className="limitList">{profile.boundaries.map(x => <div key={x}>◆ {x}</div>)}</div>}</article>

      <article className="profileCard wide"><h2>Studio & Verfügbarkeit</h2><textarea value={profile.studio_info} onChange={e => setProfile(p => ({...p, studio_info:e.target.value}))} disabled={!editing} placeholder="z. B. Berlin · Studiotage nach Kalender · diskreter Zugang"/><div className="availability"><div><strong>Kontakt</strong><span>{contactLabels[profile.contact_status] ?? profile.contact_status}</span></div><div><strong>Rollenbereich</strong><span>{["domina","dom"].includes(profile.role) ? "House führen · Aufgaben vergeben · Sessions anbieten" : "Bewerben · Aufgaben erfüllen · Sessions buchen"}</span></div></div></article>
    </section>

    {editing && <div style={{display:"flex",justifyContent:"flex-end",marginTop:18}}><button className="editProfile" onClick={saveProfile} disabled={saving}>{saving ? "Speichere …" : "Änderungen speichern"}</button></div>}
  </main>;
}
