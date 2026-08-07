import { createClient } from "@supabase/supabase-js";

function esc(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function fold(line: string) {
  const parts: string[] = [];
  let rest = line;
  while (rest.length > 73) {
    parts.push(rest.slice(0, 73));
    rest = rest.slice(73);
  }
  parts.push(rest);
  return parts.join("\r\n ");
}

function stamp(value?: string | null) {
  const date = value ? new Date(value) : new Date();
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function localDateTime(date: string, time: string) {
  return `${date.replace(/-/g, "")}T${time.slice(0, 8).replace(/:/g, "").padEnd(6, "0")}`;
}

type FeedRow = {
  event_uid: string;
  event_kind: string;
  title: string | null;
  description: string | null;
  location: string | null;
  event_date: string;
  starts_at: string;
  ends_at: string;
  updated_at: string | null;
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token: raw } = await context.params;
  const token = decodeURIComponent(raw).replace(/\.ics$/i, "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token)) {
    return new Response("Not found", { status: 404 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return new Response("Not configured", { status: 500 });

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });

  const { data, error } = await supabase.rpc("get_dom_calendar_feed", { p_token: token });
  if (error) {
    console.error("[dom-calendar-feed]", error.message);
    return new Response("Not found", { status: 404 });
  }

  const rows = (data || []) as FeedRow[];
  if (rows.length === 0) {
    // A valid empty House feed and an invalid token are deliberately
    // indistinguishable to callers; Apple Calendar can still subscribe.
  }

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//House of Doms//Domina Calendar//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:House of Doms — Mein House",
    "X-WR-TIMEZONE:Europe/Berlin",
  ];

  for (const row of rows) {
    if (!row.event_date || !row.starts_at || !row.ends_at) continue;
    lines.push("BEGIN:VEVENT");
    lines.push(fold(`UID:${row.event_uid}@house-of-doms`));
    lines.push(`DTSTAMP:${stamp(row.updated_at)}`);
    lines.push(`DTSTART;TZID=Europe/Berlin:${localDateTime(row.event_date, row.starts_at)}`);
    lines.push(`DTEND;TZID=Europe/Berlin:${localDateTime(row.event_date, row.ends_at)}`);
    lines.push(fold(`SUMMARY:${esc(row.title || "House of Doms")}`));
    if (row.location) lines.push(fold(`LOCATION:${esc(row.location)}`));
    if (row.description) lines.push(fold(`DESCRIPTION:${esc(row.description)}`));
    lines.push(row.event_kind === "booking" ? "STATUS:CONFIRMED" : "STATUS:TENTATIVE");
    lines.push("TRANSP:OPAQUE");
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return new Response(lines.join("\r\n") + "\r\n", {
    status: 200,
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": "inline; filename=house-of-doms.ics",
      "cache-control": "private, max-age=300",
    },
  });
}
