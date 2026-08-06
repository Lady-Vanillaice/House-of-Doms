import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase ist noch nicht konfiguriert. Bitte die Vercel-Umgebungsvariablen setzen.");
  }

  return createBrowserClient(url, key);
}
