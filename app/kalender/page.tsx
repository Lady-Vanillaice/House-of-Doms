"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "../../lib/supabase/client";
import "./calendar.css";

type Lang = "de" | "en";
type EventType = "task" | "studio" | "booking";
type CalendarEvent = { id: string; date: string; start?: string; end?: string; title: string; type: EventType; status?: string };
type Slot = { id: string; studioDayId: string; houseId: string; date: string; start: string; end: string; studio: string; price?: number; bookingStatus?: string; bookingId?: string };

const copy = {
  de: { title:"House-Kalender", subtitle:"Studio-Tage, Aufgaben und Buchungen live aus deinem House.", back:"Zurück ins House", today:"Heute", agenda:"Agenda", addStudio:"Studio-Tag eintragen", studioDate:"Datum", from:"Von", to:"Bis", studio:"Studio / Ort", duration:"Slot-Länge", price:"Preis pro Slot (optional)", create:"Studio-Tag erstellen", available:"Zeitslots", book:"Buchen", booked:"Angefragt", confirmed:"Bestätigt", tasks:"Aufgaben", noEvents:"Keine Einträge", filters:"Anzeigen", all:"Alles", studioDays:"Studio-Tage", bookings:"Buchungen", openTasks:"Aufgaben", bookingNote:"Notiz zur Buchung", request:"Buchungsanfrage senden", selected:"Ausgewählter Slot", legend:"Legende", domHint:"Als Dom/Domina kannst du Studio-Tage und buchbare Slots anlegen.", subHint:"Als Sub/Sklave kannst du freigegebene Studio-Tage sehen und freie Slots buchen.", loading:"Kalender wird geladen …", saved:"Gespeichert.", login:"Bitte melde dich an.", noHouse:"Für dein Dom-Profil wurde noch kein House gefunden. Führe zuerst Migration 013 aus.", week:["Mo","Di","Mi","Do","Fr","Sa","So"] },
  en: { title:"House Calendar", subtitle:"Studio days, tasks and bookings live from your House.", back:"Back to the House", today:"Today", agenda:"Agenda", addStudio:"Add studio day", studioDate:"Date", from:"From", to:"To", studio:"Studio / location", duration:"Slot length", price:"Price per slot (optional)", create:"Create studio day", available:"Time slots", book:"Book", booked:"Requested", confirmed:"Confirmed", tasks:"Tasks", noEvents:"No entries", filters:"Show", all:"All", studioDays:"Studio days", bookings:"Bookings", openTasks:"Tasks", bookingNote:"Booking note", request:"Send booking request", selected:"Selected slot", legend:"Legend", domHint:"As Dom/Domina you can create studio days and bookable slots.", subHint:"As Sub/slave you can see released studio days and book available slots.", loading:"Loading calendar …", saved:"Saved.", login:"Please sign in.", noHouse:"No House was found for your Dom profile. Run migration 013 first.", week:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] }
};

const pad = (value:number) => String(value).padStart(2,"0");
const toDateKey = (date:Date) => `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
const trimTime = (value?:string|null) => value ? value.slice(0,5) : undefined;

export default function CalendarPage() {
  const [lang,setLang] = useState<Lang>("de");
  const t = copy[lang];
  const [loading,setLoading] = useState(true);
  const [message,setMessage] = useState("");
  const [role,setRole] = useState("sub");
  const [userId,setUserId] = useState("");
  const [houseId,setHouseId] = useState<string|null>(null);
  const [cursor,setCursor] = useState(() => new Date(new Date().getFullYear(),new Date().getMonth(),1));
  const [events,setEvents] = useState<CalendarEvent[]>([]);
  const [slots,setSlots] = useState<Slot[]>([]);
  const [filter,setFilter] = useState<"all"|EventType>("all");
  const [selectedDate,setSelectedDate] = useState(toDateKey(new Date()));
  const [studioDate,setStudioDate] = useState(toDateKey(new Date()));
  const [studioStart,setStudioStart] = useState("12:00");
  const [studioEnd,setStudioEnd] = useState("18:00");
  const [studioName,setStudioName] = useState("");
  const [slotLength,setSlotLength] = useState(60);
  const [price,setPrice] = useState("");
  const [bookingSlot,setBookingSlot] = useState<Slot|null>(null);
  const [bookingNote,setBookingNote] = useState("");

  const isDom = role === "dom" || role === "domina";

  const loadCalendar = useCallback(async () => {
    setLoading(true); setMessage("");
    const supabase = createClient();
    const { data:auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) { window.location.href = "/anmelden?error=" + encodeURIComponent(t.login); return; }
    setUserId(user.id);

    const { data:detail } = await supabase.from("profile_details").select("role").eq("user_id",user.id).maybeSingle();
    const currentRole = String(detail?.role || user.user_metadata?.role || "sub").toLowerCase();
    setRole(currentRole);

    let activeHouse:string|null = null;
    if (currentRole === "dom" || currentRole === "domina") {
      const { data:house } = await supabase.from("houses").select("id").eq("owner_id",user.id).maybeSingle();
      activeHouse = house?.id || null;
    } else {
      const { data:membership } = await supabase.from("memberships").select("house_id").eq("member_id",user.id).is("ended_at",null).limit(1).maybeSingle();
      activeHouse = membership?.house_id || null;
    }
    setHouseId(activeHouse);

    const { data:studioDays,error:studioError } = await supabase.from("studio_days").select("id,house_id,event_date,starts_at,ends_at,studio_name,price_cents").order("event_date",{ascending:true});
    if (studioError) setMessage(studioError.message);

    const dayMap = new Map<string,any>();
    const nextEvents:CalendarEvent[] = [];
    for (const day of studioDays || []) {
      dayMap.set(day.id,day);
      nextEvents.push({ id:`studio-${day.id}`, date:day.event_date, start:trimTime(day.starts_at), end:trimTime(day.ends_at), title:`Studio-Tag · ${day.studio_name}`, type:"studio" });
    }

    const dayIds = (studioDays || []).map((d:any)=>d.id);
    let slotRows:any[] = [];
    if (dayIds.length) {
      const { data } = await supabase.from("studio_slots").select("id,studio_day_id,starts_at,ends_at,is_available").in("studio_day_id",dayIds).order("starts_at",{ascending:true});
      slotRows = data || [];
    }

    const { data:bookings } = await supabase.from("slot_bookings").select("id,slot_id,status,requester_id");
    const bookingBySlot = new Map((bookings || []).map((b:any)=>[b.slot_id,b]));
    const nextSlots:Slot[] = slotRows.map((slot:any)=>{
      const day = dayMap.get(slot.studio_day_id);
      const booking:any = bookingBySlot.get(slot.id);
      if (booking) nextEvents.push({ id:`booking-${booking.id}`, date:day.event_date, start:trimTime(slot.starts_at), end:trimTime(slot.ends_at), title:booking.status === "confirmed" ? "Bestätigte Buchung" : "Buchungsanfrage", type:"booking", status:booking.status });
      return { id:slot.id, studioDayId:slot.studio_day_id, houseId:day.house_id, date:day.event_date, start:trimTime(slot.starts_at)!, end:trimTime(slot.ends_at)!, studio:day.studio_name, price:day.price_cents == null ? undefined : day.price_cents/100, bookingStatus:booking?.status, bookingId:booking?.id };
    });

    const { data:tasks } = await supabase.from("tasks").select("id,title,due_at,status").not("due_at","is",null).order("due_at",{ascending:true});
    for (const task of tasks || []) {
      const due = new Date(task.due_at);
      nextEvents.push({ id:`task-${task.id}`, date:toDateKey(due), start:`${pad(due.getHours())}:${pad(due.getMinutes())}`, title:task.title, type:"task", status:task.status });
    }

    setEvents(nextEvents); setSlots(nextSlots); setLoading(false);
  },[t.login]);

  useEffect(()=>{ void loadCalendar(); },[loadCalendar]);

  const monthLabel = new Intl.DateTimeFormat(lang === "de" ? "de-DE":"en-GB",{month:"long",year:"numeric"}).format(cursor);
  const days = useMemo(()=>{ const first=new Date(cursor.getFullYear(),cursor.getMonth(),1); const offset=(first.getDay()+6)%7; return Array.from({length:42},(_,i)=>new Date(cursor.getFullYear(),cursor.getMonth(),i-offset+1)); },[cursor]);
  const visibleEvents = events.filter(e=>filter==="all"||e.type===filter);
  const selectedEvents = visibleEvents.filter(e=>e.date===selectedDate);
  const selectedSlots = slots.filter(s=>s.date===selectedDate);

  async function createStudioDay(event:FormEvent) {
    event.preventDefault(); setMessage("");
    if (!isDom || !houseId || !userId || !studioName.trim()) { setMessage(t.noHouse); return; }
    const supabase=createClient();
    const { data:day,error } = await supabase.from("studio_days").insert({ house_id:houseId, creator_id:userId, event_date:studioDate, starts_at:studioStart, ends_at:studioEnd, studio_name:studioName.trim(), slot_length_minutes:slotLength, break_minutes:15, price_cents:price ? Math.round(Number(price)*100):null, currency:"EUR", is_public:true, booking_enabled:true }).select("id").single();
    if (error) { setMessage(error.message); return; }
    const { error:slotError } = await supabase.rpc("generate_studio_slots",{day_id:day.id});
    if (slotError) { setMessage(slotError.message); return; }
    setSelectedDate(studioDate); setMessage(t.saved); await loadCalendar();
  }

  async function sendBooking(event:FormEvent) {
    event.preventDefault(); if (!bookingSlot || !userId) return;
    const supabase=createClient();
    const { error } = await supabase.from("slot_bookings").insert({ slot_id:bookingSlot.id, house_id:bookingSlot.houseId, requester_id:userId, status:"requested", note:bookingNote.trim() || null });
    if (error) { setMessage(error.message); return; }
    setBookingSlot(null); setBookingNote(""); setMessage(t.saved); await loadCalendar();
  }

  return <main className="calendarPage">
    <header className="calendarTop"><div><Link href="/" className="backLink">← {t.back}</Link><span className="eyebrow">HOUSE OF DOMS</span><h1>{t.title}</h1><p>{t.subtitle}</p><p>{isDom ? t.domHint : t.subHint}</p></div><div className="languageSwitch"><button className={lang==="de"?"active":""} onClick={()=>setLang("de")}>DE</button><button className={lang==="en"?"active":""} onClick={()=>setLang("en")}>EN</button></div></header>
    {message && <p className="calendarMessage">{message}</p>}
    {loading ? <section className="calendarCard"><p>{t.loading}</p></section> : <>
      <section className="calendarStats"><article><span>{t.studioDays}</span><strong>{events.filter(e=>e.type==="studio").length}</strong></article><article><span>{t.available}</span><strong>{slots.filter(s=>!s.bookingStatus).length}</strong></article><article><span>{t.bookings}</span><strong>{slots.filter(s=>!!s.bookingStatus).length}</strong></article><article><span>{t.tasks}</span><strong>{events.filter(e=>e.type==="task").length}</strong></article></section>
      <section className="calendarLayout"><div className="calendarCard"><div className="calendarToolbar"><button onClick={()=>setCursor(new Date(cursor.getFullYear(),cursor.getMonth()-1,1))}>‹</button><h2>{monthLabel}</h2><button onClick={()=>setCursor(new Date(cursor.getFullYear(),cursor.getMonth()+1,1))}>›</button><button className="todayButton" onClick={()=>{const now=new Date();setCursor(new Date(now.getFullYear(),now.getMonth(),1));setSelectedDate(toDateKey(now));}}>{t.today}</button></div><div className="filters"><span>{t.filters}:</span>{(["all","task","studio","booking"] as const).map(value=><button key={value} className={filter===value?"activeFilter":""} onClick={()=>setFilter(value)}>{value==="all"?t.all:value==="task"?t.openTasks:value==="studio"?t.studioDays:t.bookings}</button>)}</div><div className="weekHeader">{t.week.map(day=><span key={day}>{day}</span>)}</div><div className="monthGrid">{days.map(day=>{const key=toDateKey(day);const dayEvents=visibleEvents.filter(e=>e.date===key);return <button key={key} className={`dayCell ${day.getMonth()!==cursor.getMonth()?"outside":""} ${selectedDate===key?"selectedDay":""}`} onClick={()=>setSelectedDate(key)}><span className="dayNumber">{day.getDate()}</span><div className="dayEvents">{dayEvents.slice(0,3).map(item=><span key={item.id} className={`eventPill ${item.type}`}>{item.start?`${item.start} `:""}{item.title}</span>)}</div></button>})}</div></div>
      <aside className="agendaCard"><div className="panelHead"><div><span className="eyebrow">{selectedDate}</span><h2>{t.agenda}</h2></div></div>{selectedEvents.length===0&&selectedSlots.length===0&&<p className="empty">{t.noEvents}</p>}{selectedEvents.map(event=><article className={`agendaItem ${event.type}`} key={event.id}><span>{event.start}{event.end?`–${event.end}`:""}</span><strong>{event.title}</strong></article>)}<h3>{t.available}</h3>{selectedSlots.map(slot=><article className="slotRow" key={slot.id}><div><strong>{slot.start}–{slot.end}</strong><span>{slot.studio}{slot.price!=null?` · ${slot.price.toFixed(2)} €`:""}</span></div>{!isDom && <button disabled={!!slot.bookingStatus} className={slot.bookingStatus?"bookedButton":""} onClick={()=>!slot.bookingStatus&&setBookingSlot(slot)}>{slot.bookingStatus==="confirmed"?t.confirmed:slot.bookingStatus?t.booked:t.book}</button>}</article>)}</aside></section>
      {isDom && <section className="studioFormCard"><div><span className="eyebrow">DOM / DOMINA</span><h2>{t.addStudio}</h2></div><form onSubmit={createStudioDay} className="studioForm"><label>{t.studioDate}<input type="date" value={studioDate} onChange={e=>setStudioDate(e.target.value)} required/></label><label>{t.from}<input type="time" value={studioStart} onChange={e=>setStudioStart(e.target.value)} required/></label><label>{t.to}<input type="time" value={studioEnd} onChange={e=>setStudioEnd(e.target.value)} required/></label><label>{t.studio}<input value={studioName} onChange={e=>setStudioName(e.target.value)} required/></label><label>{t.duration}<select value={slotLength} onChange={e=>setSlotLength(Number(e.target.value))}><option value={30}>30 Min.</option><option value={45}>45 Min.</option><option value={60}>60 Min.</option><option value={90}>90 Min.</option><option value={120}>120 Min.</option></select></label><label>{t.price}<input type="number" min="0" step="0.01" value={price} onChange={e=>setPrice(e.target.value)}/></label><button className="primaryButton">{t.create}</button></form></section>}
      <section className="legend"><strong>{t.legend}</strong><span><i className="taskDot"/>{t.openTasks}</span><span><i className="studioDot"/>{t.studioDays}</span><span><i className="bookingDot"/>{t.bookings}</span></section>
    </>}
    {bookingSlot && <div className="modalBackdrop" onClick={()=>setBookingSlot(null)}><form className="bookingModal" onSubmit={sendBooking} onClick={e=>e.stopPropagation()}><button type="button" className="close" onClick={()=>setBookingSlot(null)}>×</button><span className="eyebrow">{t.selected}</span><h2>{bookingSlot.date} · {bookingSlot.start}–{bookingSlot.end}</h2><p>{bookingSlot.studio}{bookingSlot.price!=null?` · ${bookingSlot.price.toFixed(2)} €`:""}</p><label>{t.bookingNote}<textarea value={bookingNote} onChange={e=>setBookingNote(e.target.value)} rows={4}/></label><button className="primaryButton">{t.request}</button></form></div>}
  </main>;
}
