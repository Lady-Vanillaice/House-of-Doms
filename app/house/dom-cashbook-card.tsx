"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";

export default function DomCashbookCard(){
 const [show,setShow]=useState(false);
 useEffect(()=>{let live=true;(async()=>{try{const supabase=createClient();const {data:auth}=await supabase.auth.getUser();if(!auth.user)return;const {data,error}=await supabase.from("profiles").select("role").eq("id",auth.user.id).maybeSingle();if(!error&&live)setShow(["dom","domina"].includes(String(data?.role||"").toLowerCase()));}catch{}})();return()=>{live=false};},[]);
 if(!show)return null;
 return <Link href="/kassenbuch" className="hubCard"><span>11</span><div><h2>Kassenbuch</h2><p>Einnahmen, Sessions, Zahlsklaven, Studiokosten & Exporte</p></div><b>→</b></Link>;
}
