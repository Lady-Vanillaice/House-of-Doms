"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "../../lib/supabase/client";

export default function AnmeldenPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    try {
      const supabase = createClient();
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = "/";
      } else {
        const displayName = String(form.get("displayName") ?? "");
        const role = String(form.get("role") ?? "sub");
        const adult = form.get("adult") === "on";
        if (!adult) throw new Error("Bitte bestätige, dass du mindestens 18 Jahre alt bist.");

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: { display_name: displayName, role, is_adult_confirmed: adult },
          },
        });
        if (error) throw error;
        setMessage("Registrierung erfolgreich. Bitte bestätige deine E-Mail-Adresse.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ein unbekannter Fehler ist aufgetreten.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="authPage">
      <section className="authCard">
        <Link href="/" className="authBrand"><span className="crest">H</span><span>HOUSE OF DOMS</span></Link>
        <p className="eyebrow">{mode === "login" ? "WILLKOMMEN ZURÜCK" : "DEIN PERSÖNLICHES HOUSE"}</p>
        <h1>{mode === "login" ? "Anmelden" : "Konto erstellen"}</h1>
        <form onSubmit={submit}>
          {mode === "register" && <>
            <label>Anzeigename<input name="displayName" minLength={2} maxLength={60} required /></label>
            <label>Rolle<select name="role" required><option value="domina">Domina</option><option value="dom">Dom</option><option value="sub">Sub</option><option value="sklave">Sklave</option></select></label>
          </>}
          <label>E-Mail-Adresse<input type="email" name="email" autoComplete="email" required /></label>
          <label>Passwort<input type="password" name="password" minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} required /></label>
          {mode === "register" && <label className="consentCheck"><input type="checkbox" name="adult" required /><span>Ich bin mindestens 18 Jahre alt und akzeptiere, dass die Plattform ausschließlich auf freiwilligen und einvernehmlichen Interaktionen basiert.</span></label>}
          <button className="enterButton" disabled={loading}>{loading ? "Bitte warten …" : mode === "login" ? "ANMELDEN →" : "REGISTRIEREN →"}</button>
        </form>
        {message && <p className="authMessage" role="status">{message}</p>}
        <button className="authMode" onClick={() => { setMode(mode === "login" ? "register" : "login"); setMessage(""); }}>
          {mode === "login" ? "Noch kein Konto? Jetzt registrieren" : "Bereits registriert? Jetzt anmelden"}
        </button>
        <small>Die Anmeldung funktioniert, sobald die Supabase-Variablen in Vercel eingetragen wurden.</small>
      </section>
    </main>
  );
}
