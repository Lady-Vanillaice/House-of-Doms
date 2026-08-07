"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "../lib/supabase/client";

export default function DomCalendarSubscribe() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (pathname !== "/kalender") {
      setVisible(false);
      return;
    }

    let alive = true;
    void (async () => {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user || !alive) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", auth.user.id)
        .maybeSingle();
      const role = String(profile?.role || auth.user.user_metadata?.role || "").toLowerCase();
      if (!alive || (role !== "dom" && role !== "domina")) return;

      setVisible(true);
      const { data, error } = await supabase.rpc("get_my_calendar_feed_token");
      if (!alive) return;
      if (error) {
        setMessage(`Kalender-Feed: ${error.message}`);
        return;
      }
      const value = Array.isArray(data) ? data[0] : data;
      setToken(value ? String(value) : null);
    })();

    return () => {
      alive = false;
    };
  }, [pathname]);

  if (!visible) return null;

  const httpsUrl = token && typeof window !== "undefined"
    ? `${window.location.origin}/api/calendar/${token}.ics`
    : "";
  const webcalUrl = httpsUrl ? httpsUrl.replace(/^https?:\/\//, "webcal://") : "";

  async function copyLink() {
    if (!httpsUrl) return;
    try {
      await navigator.clipboard.writeText(httpsUrl);
      setMessage("Privater Kalender-Link kopiert.");
    } catch {
      setMessage("Kopieren nicht möglich. Bitte den Abo-Button verwenden.");
    }
  }

  return (
    <section style={{
      position: "fixed",
      left: "18px",
      bottom: "18px",
      zIndex: 80,
      width: "min(390px, calc(100vw - 36px))",
      border: "1px solid rgba(214,181,106,.45)",
      borderRadius: 16,
      background: "rgba(14,10,16,.96)",
      boxShadow: "0 18px 55px rgba(0,0,0,.45)",
      padding: 16,
      color: "#f7f2f8"
    }}>
      <div style={{fontSize: 10, letterSpacing: ".22em", color: "#d6b56a", marginBottom: 6}}>DOM / DOMINA · PRIVAT</div>
      <strong style={{display: "block", fontSize: 18, marginBottom: 6}}>📱 Handy-Kalender</strong>
      <p style={{fontSize: 12, lineHeight: 1.5, opacity: .72, margin: "0 0 12px"}}>
        Studio-Zeitfenster und bestätigte Sessions automatisch im Apple Kalender sehen. Der Link ist privat und gehört nur zu deinem House.
      </p>
      {token ? (
        <div style={{display: "flex", flexWrap: "wrap", gap: 8}}>
          <a href={webcalUrl} style={{textDecoration: "none", borderRadius: 9, padding: "10px 12px", background: "linear-gradient(135deg,#b59042,#e2c875)", color: "#160f13", fontWeight: 800, fontSize: 12}}>
            Auf iPhone abonnieren
          </a>
          <button type="button" onClick={copyLink} style={{borderRadius: 9, padding: "10px 12px", background: "transparent", color: "#d6b56a", border: "1px solid rgba(214,181,106,.45)", fontWeight: 700, fontSize: 12, cursor: "pointer"}}>
            Link kopieren
          </button>
        </div>
      ) : (
        <div style={{fontSize: 12, opacity: .65}}>Kalender-Link wird vorbereitet …</div>
      )}
      {message && <div style={{fontSize: 11, marginTop: 9, color: "#d6b56a"}}>{message}</div>}
    </section>
  );
}
