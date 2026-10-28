/* Amplía el contenedor completo sin duplicar el video ni las apuestas. */
(()=>{
'use strict';
const view=document.getElementById('live-view'),open=document.getElementById('expand-live'),close=document.getElementById('close-live-view');if(!view||!open||!close)return;
let expanded=false,oldOverflow='',focusBefore=null;
function render(active){
 if(active===expanded)return;
 expanded=active;view.classList.toggle('is-expanded',active);
 open.setAttribute('aria-label',active?'Salir de pantalla completa':'Pantalla completa con apuestas');open.setAttribute('aria-expanded',String(active));
 if(active){oldOverflow=document.body.style.overflow;focusBefore=document.activeElement;document.body.style.overflow='hidden';close.focus({preventScroll:true})}
 else{document.body.style.overflow=oldOverflow;if(!document.documentElement.hasAttribute('data-auth-pending'))focusBefore?.focus({preventScroll:true})}
}
function exit(){
 render(false);
 if(document.fullscreenElement===view)document.exitFullscreen?.().catch(()=>{});
 else if(document.webkitFullscreenElement===view)document.webkitExitFullscreen?.();
}
open.addEventListener('click',()=>{
 if(expanded){exit();return}
 if(!window.gcAuth?.user||window.gcAuth.accessSuspended||document.documentElement.hasAttribute('data-auth-pending'))return;
 render(true);
 try{const result=view.requestFullscreen?view.requestFullscreen():view.webkitRequestFullscreen?.();result?.catch(()=>{/* Vista ampliada como respaldo. */})}catch{/* Vista ampliada como respaldo. */}
});
close.addEventListener('click',exit);
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement)render(false)});
document.addEventListener('webkitfullscreenchange',()=>{if(!document.webkitFullscreenElement)render(false)});
document.addEventListener('keydown',event=>{if(expanded&&event.key==='Escape'){event.preventDefault();exit()}});
window.addEventListener('pagehide',exit);
new MutationObserver(()=>{if(document.documentElement.hasAttribute('data-auth-pending'))exit()}).observe(document.documentElement,{attributes:true,attributeFilter:['data-auth-pending']});
})();
