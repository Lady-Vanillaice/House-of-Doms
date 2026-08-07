"use client";

import { ChangeEvent, useRef, useState } from "react";
import { createClient } from "../../lib/supabase/client";

type Props={mode:"hero"|"gallery";value:string|string[];onChange:(value:any)=>void;max?:number};

export default function MediaUploader({mode,value,onChange,max=12}:Props){
 const input=useRef<HTMLInputElement>(null);const[uploading,setUploading]=useState(false);const[msg,setMsg]=useState("");
 async function pick(e:ChangeEvent<HTMLInputElement>){const files=Array.from(e.target.files||[]);e.target.value="";if(!files.length)return;setUploading(true);setMsg("");const s=createClient();const{data:a}=await s.auth.getUser();if(!a.user){setUploading(false);setMsg("Bitte neu anmelden.");return}const urls:string[]=[];for(const file of files){if(!file.type.startsWith("image/")){continue}const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"-");const path=`${a.user.id}/${mode}/${crypto.randomUUID()}-${safe}`;const{error}=await s.storage.from("domina-site-media").upload(path,file,{contentType:file.type,upsert:false});if(error){setMsg(error.message);continue}const{data}=s.storage.from("domina-site-media").getPublicUrl(path);urls.push(data.publicUrl)}setUploading(false);if(mode==="hero"){if(urls[0])onChange(urls[0])}else{onChange([...(Array.isArray(value)?value:[]),...urls].slice(0,max))}}
 function remove(url:string){if(mode==="hero")onChange("");else onChange((Array.isArray(value)?value:[]).filter(x=>x!==url))}
 const items=mode==="hero"?(typeof value==="string"&&value?[value]:[]):Array.isArray(value)?value:[];
 return <div style={{display:"grid",gap:10}}><input ref={input} hidden type="file" accept="image/*" multiple={mode==="gallery"} onChange={pick}/><button type="button" className="secondary" onClick={()=>input.current?.click()} disabled={uploading}>{uploading?"Lädt hoch …":mode==="hero"?"Hero-Bild hochladen":"Galerie-Bilder hochladen"}</button>{msg&&<small>{msg}</small>}{items.length>0&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:8}}>{items.map(url=><div key={url} style={{position:"relative"}}><img src={url} alt="Upload" style={{width:"100%",aspectRatio:"4/3",objectFit:"cover",borderRadius:10}}/><button type="button" onClick={()=>remove(url)} style={{position:"absolute",right:6,top:6,borderRadius:999,border:0,padding:"5px 8px",cursor:"pointer"}}>×</button></div>)}</div>}</div>;
}
