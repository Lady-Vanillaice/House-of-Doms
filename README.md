# House of Doms

Deutschsprachige, zweisprachig umschaltbare Alpha einer persönlichen Plattform für volljährige Doms/Dominas und Subs/Sklaven.

## Aktueller Stand

- DE/EN-Sprachschalter
- persönliches House-Onboarding
- Aufgaben- und Nachrichten-Demo
- House Store Vorschau
- Login- und Registrierungsseite unter `/anmelden`
- Supabase-Clients für Browser und Server
- vollständiges Datenbankschema mit Row Level Security

## Lokal starten

```bash
npm install
cp .env.example .env.local
npm run dev
```

Dann `http://localhost:3000` öffnen.

## Supabase einrichten

1. Ein neues Supabase-Projekt erstellen.
2. Den SQL-Inhalt aus `supabase/migrations/001_initial_schema.sql` im Supabase SQL Editor ausführen.
3. Project URL und Publishable Key in `.env.local` beziehungsweise in Vercel eintragen:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. In Supabase Auth die Vercel-Domain als Site URL und `https://DEINE-DOMAIN/auth/callback` als Redirect URL eintragen.
5. In Vercel neu deployen.

Der `SUPABASE_SERVICE_ROLE_KEY` ist nur für spätere geschützte Server- und Adminfunktionen vorgesehen. Er darf niemals im Browser verwendet oder öffentlich gespeichert werden.

## Datenmodell

Vorbereitet sind Profile, Houses, Bewerbungen, Mitgliedschaften, House Keys, Aufgaben, Nachrichten, Vereinbarungen, Produkte, Bestellungen und Meldungen. Für alle personenbezogenen Tabellen ist Row Level Security aktiviert.

## Zahlungen und Medien

Bezahlfunktionen, Auszahlungen und private Medienuploads bleiben deaktiviert, bis Altersprüfung, Moderation, sichere Speicherung und ein Zahlungsanbieter geklärt sind, der das konkrete Geschäftsmodell ausdrücklich akzeptiert.

## Sicherheit

Die Plattform ist ausschließlich für volljährige Personen und freiwillige, jederzeit widerrufbare Vereinbarungen vorgesehen. Erpressung, Drohungen, Zwang und nicht einvernehmliche Veröffentlichung privater Inhalte sind nicht zulässig.
