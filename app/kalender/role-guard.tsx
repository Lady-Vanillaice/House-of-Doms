"use client";

import { useEffect, useState } from "react";

type Role = "dom" | "sub";

export default function CalendarRoleGuard() {
  const [role, setRole] = useState<Role>("dom");

  useEffect(() => {
    const stored = window.localStorage.getItem("hod-role");
    if (stored === "sub" || stored === "dom") setRole(stored);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.hodRole = role;
    window.localStorage.setItem("hod-role", role);
  }, [role]);

  return <div className="calendarRoleGuard">
    <span>Ansicht</span>
    <button className={role === "dom" ? "active" : ""} onClick={() => setRole("dom")}>Dom / Domina</button>
    <button className={role === "sub" ? "active" : ""} onClick={() => setRole("sub")}>Sub / Sklave</button>
    <small>{role === "dom" ? "Erstellt Aufgaben, Studio-Tage und Slots" : "Erfüllt Aufgaben und bucht freie Sessions"}</small>
    <style jsx global>{`
      .calendarRoleGuard{position:fixed;right:22px;bottom:22px;z-index:50;display:flex;align-items:center;gap:7px;flex-wrap:wrap;max-width:510px;padding:10px 12px;border-radius:16px;background:rgba(12,10,17,.96);border:1px solid #3a3048;box-shadow:0 18px 55px rgba(0,0,0,.4);color:#b9b0c4}
      .calendarRoleGuard>span{font-size:.72rem;text-transform:uppercase;letter-spacing:.12em;color:#d3af5a;font-weight:800}
      .calendarRoleGuard button{border:1px solid #3a3246;background:#18141f;color:#a9a1b4;border-radius:999px;padding:8px 11px;cursor:pointer}
      .calendarRoleGuard button.active{background:linear-gradient(135deg,#d7b65f,#927027);color:#0c0910;border-color:transparent;font-weight:900}
      .calendarRoleGuard small{width:100%;padding-left:4px;color:#8e869a}
      html[data-hod-role="sub"] .studioFormCard{display:none!important}
      html[data-hod-role="dom"] .slotRow button{display:none!important}
      html[data-hod-role="dom"] .bookingModal{display:none!important}
      html[data-hod-role="sub"] .calendarStats article:first-child{opacity:.55}
      @media(max-width:650px){.calendarRoleGuard{left:12px;right:12px;bottom:12px}.calendarPage{padding-bottom:150px!important}}
    `}</style>
  </div>;
}
