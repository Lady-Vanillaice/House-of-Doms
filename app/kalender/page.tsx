"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "../../lib/supabase/client";
import "./calendar.css";

type Lang = "de" | "en";
type EventType = "task" | "studio" | "booking";
type CalendarEvent = { id: string; date: string; start?: string; end?: string; title: string; type: EventType; status?: string };
type StudioDay = { id: string; houseId: string; date: string; start: string; end: string; studio: string; hourlyPrice?: number };
type Booking = { id: string; studioDayId: string; date: string; start: string; end: string; status: string };

const copy = {
  de: {
    title: "House-Kalender", subtitle: "Studio-Tage, Aufgaben und Buchungen live aus deinem House.", back: "Zurück ins House", today: "Heute", agenda: "Agenda", addStudio: "Studio-Zeitfenster eintragen", studioDate: "Datum", from: "Von", to: "Bis", studio: "Studio / Ort", price: "Preis pro Stunde (optional)", create: "Zeitfenster veröffentlichen", available: "Verfügbare Studio-Zeiten", book: "Session buchen", requested: "Angefragt", confirmed: "Bestätigt", tasks: "Aufgaben", noEvents: "Keine Einträge", filters: "Anzeigen", all: "Alles", studioDays: "Studio-Tage", bookings: "Buchungen", openTasks: "Aufgaben", bookingNote: "Notiz zur Buchung", request: "Buchungsanfrage senden", selected: "Session innerhalb des Zeitfensters wählen", legend: "Legende", domHint: "Du legst nur Datum, Studio und das verfügbare Zeitfenster fest. Die Session-Länge wählt der Sub/Sklave selbst.", subHint: "Wähle innerhalb eines freigegebenen Zeitfensters deine gewünschte Start- und Endzeit.", loading: "Kalender wird geladen …", saved: "Gespeichert.", login: "Bitte melde dich an.", noHouse: "Für dein Dom-Profil wurde noch kein House gefunden.", invalidWindow: "Die Endzeit muss nach der Startzeit liegen.", outsideWindow: "Die Session muss vollständig innerhalb des angebotenen Zeitfensters liegen.", sessionFrom: "Session von", sessionTo: "Session bis", week: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]
  },
  en: {
    title: "House Calendar", subtitle: "Studio days, tasks and bookings live from your House.", back: "Back to the House", today: "Today", agenda: "Agenda", addStudio: "Add studio availability", studioDate: "Date", from: "From", to: "To", studio: "Studio / location", price: "Price per hour (optional)", create: "Publish availability", available: "Available studio windows", book: "Book session", requested: "Requested", confirmed: "Confirmed", tasks: "Tasks", noEvents: "No entries", filters: "Show", all: "All", studioDays: "Studio days", bookings: "Bookings", openTasks: "Tasks", bookingNote: "Booking note", request: "Send booking request", selected: "Choose your session inside this window", legend: "Legend", domHint: "You only set the date, studio and available time window. The Sub chooses the session length.", subHint: "Choose your preferred start and end time inside an available window.", loading: "Loading calendar …", saved: "Saved.", login: "Please sign in.", noHouse: "No House was found for your Dom profile.", invalidWindow: "End time must be after start time.", outsideWindow: "The session must stay completely inside the offered window.", sessionFrom: "Session from", sessionTo: "Session to", week: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  }
};

const pad = (value: number) => String(value).padStart(2, "0");
const toDateKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const trimTime = (value?: string | null) => value ? value.slice(0, 5) : "";
const mins = (time: string) => { const [h, m] = time.split(":").map(Number); return h * 60 + m; };

export default function CalendarPage() {
  const [lang, setLang] = useState<Lang>("de");
  const t = copy[lang];
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [role, setRole] = useState("sub");
  const [userId, setUserId] = useState("");
  const [houseId, setHouseId] = useState<string | null>(null);
  const [cursor, setCursor] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [studioDays, setStudioDays] = useState<StudioDay[]>([]);
  const [filter, setFilter] = useState<"all" | EventType>("all");
  const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()));
  const [studioDate, setStudioDate] = useState(toDateKey(new Date()));
  const [studioStart, setStudioStart] = useState("12:00");
  const [studioEnd, setStudioEnd] = useState("18:00");
  const [studioName, setStudioName] = useState("");
  const [price, setPrice] = useState("");
  const [bookingDay, setBookingDay] = useState<StudioDay | null>(null);
  const [bookingStart, setBookingStart] = useState("");
  const [bookingEnd, setBookingEnd] = useState("");
  const [bookingNote, setBookingNote] = useState("");

  const isDom = role === "dom" || role === "domina";

  const loadCalendar = useCallback(async () => {
    setLoading(true); setMessage("");
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) { window.location.href = "/anmelden?error=" + encodeURIComponent(t.login); return; }
    setUserId(user.id);

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    const currentRole = String(profile?.role || user.user_metadata?.role || "sub").toLowerCase();
    setRole(currentRole);

    let activeHouse: string | null = null;
    if (currentRole === "dom" || currentRole === "domina") {
      const { data: house } = await supabase.from("houses").select("id").eq("owner_id", user.id).maybeSingle();
      activeHouse = house?.id || null;
    } else {
      const { data: membership } = await supabase.from("memberships").select("house_id").eq("member_id", user.id).is("ended_at", null).limit(1).maybeSingle();
      activeHouse = membership?.house_id || null;
    }
    setHouseId(activeHouse);

    const { data: days, error: dayError } = await supabase.from("studio_days").select("id,house_id,event_date,starts_at,ends_at,studio_name,price_cents").order("event_date", { ascending: true });
    if (dayError) setMessage(dayError.message);
    const nextDays: StudioDay[] = (days || []).map((day: any) => ({ id: day.id, houseId: day.house_id, date: day.event_date, start: trimTime(day.starts_at), end: trimTime(day.ends_at), studio: day.studio_name, hourlyPrice: day.price_cents == null ? undefined : day.price_cents / 100 }));
    setStudioDays(nextDays);

    const nextEvents: CalendarEvent[] = nextDays.map(day => ({ id: `studio-${day.id}`, date: day.date, start: day.start, end: day.end, title: `Studio-Tag · ${day.studio}`, type: "studio" }));

    const { data: bookings } = await supabase.from("slot_bookings").select("id,studio_day_id,starts_at,ends_at,status,requester_id").not("studio_day_id", "is", null);
    const dayMap = new Map(nextDays.map(day => [day.id, day]));
    for (const booking of bookings || []) {
      const day = dayMap.get(booking.studio_day_id);
      if (!day) continue;
      nextEvents.push({ id: `booking-${booking.id}`, date: day.date, start: trimTime(booking.starts_at), end: trimTime(booking.ends_at), title: booking.status === "confirmed" ? "Bestätigte Session" : "Session angefragt", type: "booking", status: booking.status });
    }

    const { data: tasks } = await supabase.from("tasks").select("id,title,due_at,status").not("due_at", "is", null).order("due_at", { ascending: true });
    for (const task of tasks || []) {
      const due = new Date(task.due_at);
      nextEvents.push({ id: `task-${task.id}`, date: toDateKey(due), start: `${pad(due.getHours())}:${pad(due.getMinutes())}`, title: task.title, type: "task", status: task.status });
    }

    setEvents(nextEvents); setLoading(false);
  }, [t.login]);

  useEffect(() => { void loadCalendar(); }, [loadCalendar]);

  const monthLabel = new Intl.DateTimeFormat(lang === "de" ? "de-DE" : "en-GB", { month: "long", year: "numeric" }).format(cursor);
  const days = useMemo(() => { const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1); const offset = (first.getDay() + 6) % 7; return Array.from({ length: 42 }, (_, i) => new Date(cursor.getFullYear(), cursor.getMonth(), i - offset + 1)); }, [cursor]);
  const visibleEvents = events.filter(e => filter === "all" || e.type === filter);
  const selectedEvents = visibleEvents.filter(e => e.date === selectedDate);
  const selectedStudioDays = studioDays.filter(day => day.date === selectedDate);

  async function createStudioDay(event: FormEvent) {
    event.preventDefault(); setMessage("");
    if (!isDom || !houseId || !userId || !studioName.trim()) { setMessage(t.noHouse); return; }
    if (mins(studioEnd) <= mins(studioStart)) { setMessage(t.invalidWindow); return; }
    const supabase = createClient();
    const { error } = await supabase.from("studio_days").insert({ house_id: houseId, creator_id: userId, event_date: studioDate, starts_at: studioStart, ends_at: studioEnd, studio_name: studioName.trim(), slot_length_minutes: 60, break_minutes: 0, price_cents: price ? Math.round(Number(price) * 100) : null, currency: "EUR", is_public: true, booking_enabled: true });
    if (error) { setMessage(error.message); return; }
    setSelectedDate(studioDate); setMessage(t.saved); await loadCalendar();
  }

  function openBooking(day: StudioDay) {
    setBookingDay(day); setBookingStart(day.start); setBookingEnd(day.end); setBookingNote("");
  }

  async function sendBooking(event: FormEvent) {
    event.preventDefault();
    if (!bookingDay || !userId) return;
    if (mins(bookingEnd) <= mins(bookingStart)) { setMessage(t.invalidWindow); return; }
    if (mins(bookingStart) < mins(bookingDay.start) || mins(bookingEnd) > mins(bookingDay.end)) { setMessage(t.outsideWindow); return; }
    const supabase = createClient();
    const { error } = await supabase.rpc("request_studio_booking", { p_studio_day_id: bookingDay.id, p_starts_at: bookingStart, p_ends_at: bookingEnd, p_note: bookingNote.trim() || null });
    if (error) { setMessage(error.message); return; }
    setBookingDay(null); setMessage(t.saved); await loadCalendar();
  }

  return <main className="calendarPage">
    <header className="calendarTop"><div><Link href="/" className="backLink">← {t.back}</Link><span className="eyebrow">HOUSE OF DOMS</span><h1>{t.title}</h1><p>{t.subtitle}</p><p>{isDom ? t.domHint : t.subHint}</p></div><div className="languageSwitch"><button className={lang === "de" ? "active" : ""} onClick={() => setLang("de")}>DE</button><button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button></div></header>
    {message && <p className="calendarMessage">{message}</p>}
    {loading ? <section className="calendarCard"><p>{t.loading}</p></section> : <>
      <section className="calendarStats"><article><span>{t.studioDays}</span><strong>{events.filter(e => e.type === "studio").length}</strong></article><article><span>{t.available}</span><strong>{studioDays.length}</strong></article><article><span>{t.bookings}</span><strong>{events.filter(e => e.type === "booking").length}</strong></article><article><span>{t.tasks}</span><strong>{events.filter(e => e.type === "task").length}</strong></article></section>
      <section className="calendarLayout"><div className="calendarCard"><div className="calendarToolbar"><button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>‹</button><h2>{monthLabel}</h2><button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>›</button><button className="todayButton" onClick={() => { const now = new Date(); setCursor(new Date(now.getFullYear(), now.getMonth(), 1)); setSelectedDate(toDateKey(now)); }}>{t.today}</button></div><div className="filters"><span>{t.filters}:</span>{(["all", "task", "studio", "booking"] as const).map(value => <button key={value} className={filter === value ? "activeFilter" : ""} onClick={() => setFilter(value)}>{value === "all" ? t.all : value === "task" ? t.openTasks : value === "studio" ? t.studioDays : t.bookings}</button>)}</div><div className="weekHeader">{t.week.map(day => <span key={day}>{day}</span>)}</div><div className="monthGrid">{days.map(day => { const key = toDateKey(day); const dayEvents = visibleEvents.filter(e => e.date === key); return <button key={key} className={`dayCell ${day.getMonth() !== cursor.getMonth() ? "outside" : ""} ${selectedDate === key ? "selectedDay" : ""}`} onClick={() => setSelectedDate(key)}><span className="dayNumber">{day.getDate()}</span><div className="dayEvents">{dayEvents.slice(0, 3).map(item => <span key={item.id} className={`eventPill ${item.type}`}>{item.start ? `${item.start} ` : ""}{item.title}</span>)}</div></button>; })}</div></div>
      <aside className="agendaCard"><div className="panelHead"><div><span className="eyebrow">{selectedDate}</span><h2>{t.agenda}</h2></div></div>{selectedEvents.length === 0 && selectedStudioDays.length === 0 && <p className="empty">{t.noEvents}</p>}{selectedEvents.map(event => <article className={`agendaItem ${event.type}`} key={event.id}><span>{event.start}{event.end ? `–${event.end}` : ""}</span><strong>{event.title}</strong></article>)}<h3>{t.available}</h3>{selectedStudioDays.map(day => <article className="slotRow" key={day.id}><div><strong>{day.start}–{day.end}</strong><span>{day.studio}{day.hourlyPrice != null ? ` · ${day.hourlyPrice.toFixed(2)} €/h` : ""}</span></div>{!isDom && <button onClick={() => openBooking(day)}>{t.book}</button>}</article>)}</aside></section>
      {isDom && <section className="studioFormCard"><div><span className="eyebrow">DOM / DOMINA</span><h2>{t.addStudio}</h2><p>{t.domHint}</p></div><form onSubmit={createStudioDay} className="studioForm"><label>{t.studioDate}<input type="date" value={studioDate} onChange={e => setStudioDate(e.target.value)} required /></label><label>{t.from}<input type="time" value={studioStart} onChange={e => setStudioStart(e.target.value)} required /></label><label>{t.to}<input type="time" value={studioEnd} onChange={e => setStudioEnd(e.target.value)} required /></label><label>{t.studio}<input value={studioName} onChange={e => setStudioName(e.target.value)} required /></label><label>{t.price}<input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} /></label><button className="primaryButton">{t.create}</button></form></section>}
      <section className="legend"><strong>{t.legend}</strong><span><i className="taskDot" />{t.openTasks}</span><span><i className="studioDot" />{t.studioDays}</span><span><i className="bookingDot" />{t.bookings}</span></section>
    </>}
    {bookingDay && <div className="modalBackdrop" onClick={() => setBookingDay(null)}><form className="bookingModal" onSubmit={sendBooking} onClick={e => e.stopPropagation()}><button type="button" className="close" onClick={() => setBookingDay(null)}>×</button><span className="eyebrow">{t.selected}</span><h2>{bookingDay.date} · {bookingDay.studio}</h2><p>{bookingDay.start}–{bookingDay.end}</p><label>{t.sessionFrom}<input type="time" min={bookingDay.start} max={bookingDay.end} value={bookingStart} onChange={e => setBookingStart(e.target.value)} required /></label><label>{t.sessionTo}<input type="time" min={bookingDay.start} max={bookingDay.end} value={bookingEnd} onChange={e => setBookingEnd(e.target.value)} required /></label><label>{t.bookingNote}<textarea value={bookingNote} onChange={e => setBookingNote(e.target.value)} rows={4} /></label><button className="primaryButton">{t.request}</button></form></div>}
  </main>;
}
