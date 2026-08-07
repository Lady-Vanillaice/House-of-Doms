"use client";
import {useEffect,useState} from "react";

type InstallEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:string}>};
export default function PwaRegister(){const[prompt,setPrompt]=useState<InstallEvent|null>(null);useEffect(()=>{if('serviceWorker'in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});const h=(e:Event)=>{e.preventDefault();setPrompt(e as InstallEvent)};window.addEventListener('beforeinstallprompt',h);return()=>window.removeEventListener('beforeinstallprompt',h)},[]);if(!prompt)return null;return <button onClick={async()=>{await prompt.prompt();await prompt.userChoice;setPrompt(null)}} style={{position:'fixed',left:18,bottom:18,zIndex:80,border:'1px solid rgba(214,176,93,.5)',background:'#140d10',color:'#f4e7c2',padding:'11px 15px',borderRadius:999,cursor:'pointer',boxShadow:'0 10px 30px #0008'}}>⌂ House als App installieren</button>}
