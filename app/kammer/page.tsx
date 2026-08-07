"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "../../lib/supabase/client";
import "./kammer.css";

type Contact={user_id:string;display_name:string;role:string;last_message:string;unread_count:number};
type Msg={id:string;sender_id:string;recipient_id:string;body:string|null;attachment_type:"image"|"video"|null;attachment_path:string|null;linked_task_id:string|null;created_at:string};

export default function ChamberPage(){
 const [contacts,setContacts]=useState<Contact[]>([]); const [active,setActive]=useState(""); const [query,setQuery]=useState("");
 const [messages,setMessages]=useState<Msg[]>([]); const [draft,setDraft]=useState(""); const [me,setMe]=useState("");
 const [loading,setLoading]=useState(true); const [sending,setSending]=useState(false); const [notice,setNotice]=useState("");
 const [pendingFile,setPendingFile]=useState<File|null>(null); const imageRef=useRef<HTMLInputElement>(null); const videoRef=useRef<HTMLInputElement>(null);

 const loadContacts=useCallback(async()=>{const supabase=createClient();const {data:auth}=await supabase.auth.getUser();if(!auth.user){location.href="/anmelden";return;}setMe(auth.user.id);const {data,error}=await supabase.rpc("get_chamber_contacts");if(error){setNotice(`Supabase: ${error.message}`);return;}const list=(data||[]) as Contact[];setContacts(list);setActive(v=>v||list[0]?.user_id||"");setLoading(false);},[]);
 const loadMessages=useCallback(async(id:string)=>{if(!id)return;const supabase=createClient();const {data,error}=await supabase.rpc("get_chamber_messages",{p_other_user:id});if(error){setNotice(`Supabase: ${error.message}`);return;}setMessages((data||[]) as Msg[]);},[]);
 useEffect(()=>{void loadContacts();},[loadContacts]); useEffect(()=>{if(active)void loadMessages(active);},[active,loadMessages]);
 const filtered=useMemo(()=>contacts.filter(c=>c.display_name.toLowerCase().includes(query.toLowerCase())),[contacts,query]);
 const contact=contacts.find(c=>c.user_id===active);

 async function send(e:FormEvent){e.preventDefault();if(!active||(!draft.trim()&&!pendingFile))return;setSending(true);setNotice("");const supabase=createClient();let path:string|null=null;let type:string|null=null;try{
   if(pendingFile){type=pendingFile.type.startsWith("video/")?"video":"image";const safe=pendingFile.name.replace(/[^a-zA-Z0-9._-]/g,"-");path=`${me}/${active}/${crypto.randomUUID()}-${safe}`;const {error:uploadError}=await supabase.storage.from("chamber-media").upload(path,pendingFile,{contentType:pendingFile.type,upsert:false});if(uploadError)throw uploadError;}
   const {error}=await supabase.rpc("send_chamber_message",{p_recipient_id:active,p_body:draft.trim()||null,p_attachment_type:type,p_attachment_path:path,p_linked_task_id:null});if(error)throw error;
   setDraft("");setPendingFile(null);await loadMessages(active);await loadContacts();
 }catch(err:any){setNotice(`Supabase: ${err?.message||"Senden fehlgeschlagen"}`);}finally{setSending(false);}}
 async function openAttachment(msg:Msg){if(!msg.attachment_path)return;const supabase=createClient();const {data,error}=await supabase.storage.from("chamber-media").createSignedUrl(msg.attachment_path,300);if(error){setNotice(`Supabase: ${error.message}`);return;}window.open(data.signedUrl,"_blank","noopener,noreferrer");}
 function chooseFile(e:ChangeEvent<HTMLInputElement>){const file=e.target.files?.[0]||null;setPendingFile(file);e.target.value="";}

 return <main className="chamberPage"><section className="chamberShell">
  <aside className="threadRail"><div className="railHead"><span className="eyebrow">PRIVATE KAMMER</span><h1>Nachrichten</h1><input placeholder="Kontakte durchsuchen …" value={query} onChange={e=>setQuery(e.target.value)}/></div>
   <div className="threadList">{loading?<p className="chamberEmpty">Kontakte werden geladen …</p>:filtered.length===0?<p className="chamberEmpty">Noch keine House-Kontakte.</p>:filtered.map(c=><button key={c.user_id} className={active===c.user_id?"threadButton active":"threadButton"} onClick={()=>setActive(c.user_id)}><span className="threadAvatar">{c.display_name.slice(0,2).toUpperCase()}</span><span className="threadCopy"><strong>{c.display_name}</strong><small>{c.last_message}</small></span>{Number(c.unread_count)>0&&<em>{c.unread_count}</em>}</button>)}</div>
  </aside>
  <section className="conversationPane">{contact?<><header className="conversationHead"><div><strong>{contact.display_name}</strong><span>{contact.role} · House-Verbindung aktiv</span></div><div className="headActions"><Link className="headButton" href={`/profil?user=${contact.user_id}`}>Profil</Link><button type="button" onClick={()=>setNotice("Weitere Kammer-Optionen folgen hier.")}>⋯</button></div></header>
   {notice&&<div className="chamberNotice">{notice}</div>}
   <div className="messageStream">{messages.length===0&&<p className="chamberEmpty">Noch keine Nachrichten. Schreib die erste Nachricht.</p>}{messages.map(m=><div key={m.id} className={m.sender_id===me?"msgBubble mine":"msgBubble theirs"}>{m.body&&<p>{m.body}</p>}{m.attachment_path&&<button className="mediaMessage" onClick={()=>void openAttachment(m)}>{m.attachment_type==="video"?"🎥 Video öffnen":"🖼 Bild öffnen"}</button>}{m.linked_task_id&&<Link className="taskMessageLink" href="/aufgaben">📋 Aufgabe öffnen</Link>}<small>{new Intl.DateTimeFormat("de-DE",{hour:"2-digit",minute:"2-digit",day:"2-digit",month:"2-digit"}).format(new Date(m.created_at))}</small></div>)}</div>
   <div className="attachmentPrep"><button type="button" onClick={()=>imageRef.current?.click()}>＋ Bild</button><button type="button" onClick={()=>videoRef.current?.click()}>＋ Video</button><Link className="attachLink" href="/aufgaben">＋ Aufgabe</Link><input ref={imageRef} hidden type="file" accept="image/*" onChange={chooseFile}/><input ref={videoRef} hidden type="file" accept="video/*" onChange={chooseFile}/>{pendingFile?<span className="pendingFile">Ausgewählt: {pendingFile.name}</span>:<span>Bild oder Video auswählen und mit der Nachricht senden.</span>}</div>
   <form className="composerBar" onSubmit={send}><input value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Nachricht schreiben …"/><button disabled={sending||(!draft.trim()&&!pendingFile)}>{sending?"Sendet …":"Senden"}</button></form></>:<div className="noConversation"><strong>Private Kammer</strong><p>Wähle links einen aktiven House-Kontakt aus.</p>{notice&&<div className="chamberNotice">{notice}</div>}</div>}</section>
 </section></main>;
}
