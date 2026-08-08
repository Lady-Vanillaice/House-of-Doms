"use client";

import { useEffect } from "react";

export default function RoleCardRouter(){
  useEffect(()=>{
    function handle(event:MouseEvent){
      const target=event.target as HTMLElement|null;
      if(!target)return;
      const card=target.closest(".roleSelectorCard") as HTMLElement|null;
      if(card){
        event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
        const text=(card.textContent||"").toLowerCase();
        window.location.href=text.includes("sub")||text.includes("sklave")?"/fuer-subs":"/fuer-dominas";
        return;
      }
      const link=target.closest('a[href="#roles"]') as HTMLAnchorElement|null;
      if(link){
        const text=(link.textContent||"").toLowerCase();
        if(text.includes("domina")||text.includes("domme")||text.includes("sub")){
          event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
          window.location.href=text.includes("sub")?"/fuer-subs":"/fuer-dominas";
        }
      }
    }
    document.addEventListener("click",handle,true);
    return()=>document.removeEventListener("click",handle,true);
  },[]);
  return null;
}
