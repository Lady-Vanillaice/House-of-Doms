"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import "./calendar.css";

type Lang = "de" | "en";
type EventType = "task" | "studio" | "booking";
type CalendarEvent = { id: number; date: string; start?: string; end?: string; title: string; type: EventType; status?: "open" | "booked" | "confirmed" };
type Slot = { id: number; date: string; start: string; end: string; studio: string; price?: number; booked: boolean; bookedBy?: string };

const copy = {
  de: {
    title: "House-Kalender", subtitle: "Studio-Tage, Aufgaben und persönliche Buchungen an einem Ort.", back: "Zurück ins House", today: "Heute", month: "Monat", agenda: "Agenda", addStudio: "Studio-Tag eintragen", studioDate: "Datum", from: "Von", to: "Bis", studio: "Studio / Ort", duration: "Slot-Länge", price: "Preis pro Slot (optional)", create: "Studio-Tag erstellen", available: "Buchbare Zeitslots", book: "Buchen", booked: "Gebucht", confirm: "Bestätigen", cancelled: "Stornieren", tasks: "Aufgaben", noEvents: "Keine Einträge", filters: "Anzeigen", all: "Alles", studioDays: "Studio-Tage", bookings: "Buchungen", openTasks: "Aufgaben", bookingName: "Name des Subs / Sklaven", bookingNote: "Notiz zur Buchung", request: "Buchungsanfrage senden", selected: "Ausgewählter Slot", statusOpen: "Frei", statusBooked: "Angefragt", statusConfirmed: "Bestätigt", legend: "Legende", saveNote: "Die Alpha speichert Einträge aktuell lokal im Browser. Das Datenbankschema ist für Supabase vorbereitet.", week: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]
  },
  en: {
    title: "House Calendar", subtitle: "Studio days, tasks and personal bookings in one place.", back: "Back to the House", today: "Today", month: "Month", agenda: "Agenda", addStudio: "Add studio day", studioDate: "Date", from: "From", to: "To", studio: "Studio / location", duration: "Slot length", price: "Price per slot (optional)", create: "Create studio day", available: "Bookable time slots", book: "Book", booked: "Booked", confirm: "Confirm", cancelled: "Cancel", tasks: "Tasks", noEvents: "No entries", filters: "Show", all: "All", studioDays: "Studio days", bookings: "Bookings", openTasks: "Tasks", bookingName: "Sub / slave name", bookingNote: "Booking note", request: "Send booking request", selected: "Selected slot", statusOpen: "Available", statusBooked: "Requested", statusConfirmed: "Confirmed", legend: "Legend", saveNote: "This alpha currently stores entries locally in the browser. The Supabase schema is prepared.", week: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  }
};

const pad = (value: number) => String(value).padStart(2, "0");
const toDateKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const minutes = (time: string) => { const [h, m] = time.split(":").map(Number); return h * 60 + m; };
const asTime = (value: number) => `${pad(Math.floor(value / 60))}:${pad(value % 60)}`;

const initialEvents: CalendarEvent[] = [
  { id: 1, date: "2026-08-07", start: "09:00", title: "Morgenroutine prüfen", type: "task", status: "open" },
  { id: 2, date: "2026-08-08", start: "18:00", title: "Journal-Reflexion", type: "task", status: "open" },
  { id: 3, date: "2026-08-10", start: "12:00", end: "18:00", title: "Studio-Tag · Studio Obsidian", type: "studio" }
];

export default function CalendarPage() {
  const [lang, setLang] = useState<Lang>("de");
  const t = copy[lang];
  const [cursor, setCursor] = useState(new Date(2026, 7, 1));
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [slots, setSlots] = useState<Slot[]>([
    { id: 101, date: "2026-08-10", start: "12:00", end: "13:00", studio: "Studio Obsidian", booked: false, price: 120 },
    { id: 102, date: "2026-08-10", start: "13:15", end: "14:15", studio: "Studio Obsidian", booked: true, bookedBy: "Johnny", price: 120 },
    { id: 103, date: "2026-08-10", start: "15:00", end: "16:00", studio: "Studio Obsidian", booked: false, price: 120 }
  ]);
  const [filter, setFilter] = useState<"all" | EventType>("all");
  const [selectedDate, setSelectedDate] = useState("2026-08-10");
  const [studioDate, setStudioDate] = useState("2026-08-15");
  const [studioStart, setStudioStart] = useState("12:00");
  const [studioEnd, setStudioEnd] = useState("18:00");
  const [studioName, setStudioName] = useState("Studio Obsidian");
  const [slotLength, setSlotLength] = useState(60);
  const [price, setPrice] = useState("");
  const [bookingSlot, setBookingSlot] = useState<Slot | null>(null);
  const [bookingName, setBookingName] = useState("");
  const [bookingNote, setBookingNote] = useState("");

  const monthLabel = new Intl.DateTimeFormat(lang === "de" ? "de-DE" : "en-GB", { month: "long", year: "numeric" }).format(cursor);
  const days = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    return Array.from({ length: 42 }, (_, index) => new Date(cursor.getFullYear(), cursor.getMonth(), index - offset + 1));
  }, [cursor]);
  const visibleEvents = events.filter((event) => filter === "all" || event.type === filter);
  const selectedEvents = visibleEvents.filter((event) => event.date === selectedDate);
  const selectedSlots = slots.filter((slot) => slot.date === selectedDate);

  const createStudioDay = (event: FormEvent) => {
    event.preventDefault();
    const start = minutes(studioStart); const end = minutes(studioEnd);
    if (!studioDate || !studioName.trim() || end <= start) return;
    const studioEvent: CalendarEvent = { id: Date.now(), date: studioDate, start: studioStart, end: studioEnd, title: `${lang === "de" ? "Studio-Tag" : "Studio day"} · ${studioName.trim()}`, type: "studio" };
    const generated: Slot[] = [];
    const breakMinutes = 15;
    for (let current = start; current + slotLength <= end; current += slotLength + breakMinutes) {
      generated.push({ id: Date.now() + current, date: studioDate, start: asTime(current), end: asTime(current + slotLength), studio: studioName.trim(), booked: false, price: price ? Number(price) : undefined });
    }
    setEvents((current) => [...current, studioEvent]);
    setSlots((current) => [...current, ...generated]);
    setSelectedDate(studioDate);
  };

  const sendBooking = (event: FormEvent) => {
    event.preventDefault();
    if (!bookingSlot || !bookingName.trim()) return;
    setSlots((current) => current.map((slot) => slot.id === bookingSlot.id ? { ...slot, booked: true, bookedBy: bookingName.trim() } : slot));
    setEvents((current) => [...current, { id: Date.now(), date: bookingSlot.date, start: bookingSlot.start, end: bookingSlot.end, title: `${lang === "de" ? "Buchungsanfrage" : "Booking request"} · ${bookingName.trim()}`, type: "booking", status: "booked" }]);
    setBookingSlot(null); setBookingName(""); setBookingNote("");
  };

  const toggleBooking = (slot: Slot) => setSlots((current) => current.map((item) => item.id === slot.id ? { ...item, booked: !item.booked, bookedBy: item.booked ? undefined : item.bookedBy } : item));

  return <main className="calendarPage">
    <header className="calendarTop"><div><Link href="/" className="backLink">← {t.back}</Link><span className="eyebrow">HOUSE OF DOMS</span><h1>{t.title}</h1><p>{t.subtitle}</p></div><div className="languageSwitch"><button className={lang === "de" ? "active" : ""} onClick={() => setLang("de")}>DE</button><button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button></div></header>

    <section className="calendarStats"><article><span>{t.studioDays}</span><strong>{events.filter((e) => e.type === "studio").length}</strong></article><article><span>{t.available}</span><strong>{slots.filter((s) => !s.booked).length}</strong></article><article><span>{t.bookings}</span><strong>{slots.filter((s) => s.booked).length}</strong></article><article><span>{t.tasks}</span><strong>{events.filter((e) => e.type === "task").length}</strong></article></section>

    <section className="calendarLayout"><div className="calendarCard"><div className="calendarToolbar"><button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>‹</button><h2>{monthLabel}</h2><button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>›</button><button className="todayButton" onClick={() => setCursor(new Date(2026, 7, 1))}>{t.today}</button></div><div className="filters"><span>{t.filters}:</span>{(["all", "task", "studio", "booking"] as const).map((value) => <button key={value} className={filter === value ? "activeFilter" : ""} onClick={() => setFilter(value)}>{value === "all" ? t.all : value === "task" ? t.openTasks : value === "studio" ? t.studioDays : t.bookings}</button>)}</div><div className="weekHeader">{t.week.map((day) => <span key={day}>{day}</span>)}</div><div className="monthGrid">{days.map((day) => { const key = toDateKey(day); const dayEvents = visibleEvents.filter((event) => event.date === key); const inMonth = day.getMonth() === cursor.getMonth(); return <button key={key} className={`dayCell ${!inMonth ? "outside" : ""} ${selectedDate === key ? "selectedDay" : ""}`} onClick={() => setSelectedDate(key)}><span className="dayNumber">{day.getDate()}</span><div className="dayEvents">{dayEvents.slice(0, 3).map((item) => <span key={item.id} className={`eventPill ${item.type}`}>{item.start ? `${item.start} ` : ""}{item.title}</span>)}</div></button>; })}</div></div>

    <aside className="agendaCard"><div className="panelHead"><div><span className="eyebrow">{selectedDate}</span><h2>{t.agenda}</h2></div></div>{selectedEvents.length === 0 && selectedSlots.length === 0 ? <p className="empty">{t.noEvents}</p> : null}{selectedEvents.map((event) => <article className={`agendaItem ${event.type}`} key={event.id}><span>{event.start}{event.end ? `–${event.end}` : ""}</span><strong>{event.title}</strong></article>)}<h3>{t.available}</h3>{selectedSlots.map((slot) => <article className="slotRow" key={slot.id}><div><strong>{slot.start}–{slot.end}</strong><span>{slot.studio}{slot.price ? ` · ${slot.price} €` : ""}</span>{slot.bookedBy && <small>{slot.bookedBy}</small>}</div><button className={slot.booked ? "bookedButton" : ""} onClick={() => slot.booked ? toggleBooking(slot) : setBookingSlot(slot)}>{slot.booked ? t.booked : t.book}</button></article>)}</aside></section>

    <section className="studioFormCard"><div><span className="eyebrow">DOM / DOMINA</span><h2>{t.addStudio}</h2><p>{t.saveNote}</p></div><form onSubmit={createStudioDay} className="studioForm"><label>{t.studioDate}<input type="date" value={studioDate} onChange={(e) => setStudioDate(e.target.value)} /></label><label>{t.from}<input type="time" value={studioStart} onChange={(e) => setStudioStart(e.target.value)} /></label><label>{t.to}<input type="time" value={studioEnd} onChange={(e) => setStudioEnd(e.target.value)} /></label><label>{t.studio}<input value={studioName} onChange={(e) => setStudioName(e.target.value)} /></label><label>{t.duration}<select value={slotLength} onChange={(e) => setSlotLength(Number(e.target.value))}><option value={30}>30 Min.</option><option value={45}>45 Min.</option><option value={60}>60 Min.</option><option value={90}>90 Min.</option><option value={120}>120 Min.</option></select></label><label>{t.price}<input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="120" /></label><button className="primaryButton">{t.create}</button></form></section>

    <section className="legend"><strong>{t.legend}</strong><span><i className="taskDot" />{t.openTasks}</span><span><i className="studioDot" />{t.studioDays}</span><span><i className="bookingDot" />{t.bookings}</span></section>

    {bookingSlot && <div className="modalBackdrop" onClick={() => setBookingSlot(null)}><form className="bookingModal" onSubmit={sendBooking} onClick={(e) => e.stopPropagation()}><button type="button" className="close" onClick={() => setBookingSlot(null)}>×</button><span className="eyebrow">{t.selected}</span><h2>{bookingSlot.date} · {bookingSlot.start}–{bookingSlot.end}</h2><p>{bookingSlot.studio}{bookingSlot.price ? ` · ${bookingSlot.price} €` : ""}</p><label>{t.bookingName}<input value={bookingName} onChange={(e) => setBookingName(e.target.value)} required /></label><label>{t.bookingNote}<textarea value={bookingNote} onChange={(e) => setBookingNote(e.target.value)} rows={4} /></label><button className="primaryButton">{t.request}</button></form></div>}
  </main>;
}
