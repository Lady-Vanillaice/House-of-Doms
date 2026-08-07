import type { ReactNode } from "react";
import "./task-interactions.css";

export default function AufgabenLayout({ children }: { children: ReactNode }) {
  return <>
    {children}
    <script dangerouslySetInnerHTML={{__html:`
(function(){
  function enhance(){
    document.querySelectorAll('.tasksPage .task').forEach(function(card){
      if(card.dataset.clickEnhanced) return;
      card.dataset.clickEnhanced='1';
      card.classList.add('task-collapsible');
      var head=card.querySelector(':scope > div:first-child');
      if(head){
        head.setAttribute('role','button'); head.setAttribute('tabindex','0');
        head.setAttribute('aria-expanded','false');
        var hint=document.createElement('span'); hint.className='taskOpenHint'; hint.textContent='Aufgabe öffnen ▾'; head.appendChild(hint);
        function toggle(){ var open=card.classList.toggle('task-open'); head.setAttribute('aria-expanded',String(open)); hint.textContent=open?'Aufgabe schließen ▴':'Aufgabe öffnen ▾'; }
        head.addEventListener('click',toggle);
        head.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle();} });
      }
    });
    document.querySelectorAll('.tasksPage .filePicker').forEach(function(label){
      if(label.dataset.uploadEnhanced) return;
      label.dataset.uploadEnhanced='1';
      var input=label.querySelector('input[type=file]'); if(!input) return;
      var text=(label.closest('.task')?.textContent||'');
      var wantsImage=text.includes('Bild');
      var wantsVideo=text.includes('Video');
      var wrap=document.createElement('div'); wrap.className='uploadChoiceButtons';
      function button(text,accept){ var b=document.createElement('button'); b.type='button'; b.className='uploadChoice'; b.textContent=text; b.onclick=function(e){e.stopPropagation(); input.accept=accept; input.click();}; return b; }
      if(wantsImage) wrap.appendChild(button('🖼 Bild hinzufügen','image/*'));
      if(wantsVideo) wrap.appendChild(button('🎥 Video hinzufügen','video/*'));
      if(!wantsImage&&!wantsVideo){ wrap.appendChild(button('🖼 Bild hinzufügen','image/*')); wrap.appendChild(button('🎥 Video hinzufügen','video/*')); }
      input.classList.add('nativeEvidenceInput');
      while(label.firstChild && label.firstChild!==input) label.removeChild(label.firstChild);
      label.insertBefore(wrap,input);
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',enhance); else enhance();
  new MutationObserver(enhance).observe(document.documentElement,{childList:true,subtree:true});
})();
`}} />
  </>;
}
