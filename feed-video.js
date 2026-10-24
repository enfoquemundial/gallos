/* GIF silencioso en bucle; un toque abre el MP4 con sonido. */
(()=>{
'use strict';
const preview=document.getElementById('feed-pesas'),dialog=document.querySelector('.feed-video-dialog');
if(!preview||!dialog)return;
const tap=document.querySelector('.feed-video-tap'),full=dialog.querySelector('video'),close=dialog.querySelector('button');
let previousOverflow='';
tap.addEventListener('click',()=>{
if(dialog.open)return;
previousOverflow=document.body.style.overflow;dialog.showModal();document.body.style.overflow='hidden';
const configured=window.tnSiteContent?.media?.['feed-video']?.src;let source='assets/pesas-ligero.mp4?v=2';try{const url=new URL(configured,location.href);if(configured&&url.protocol==='https:')source=url.href}catch{}full.src=source;full.muted=false;full.volume=1;full.load();
const result=full.play();if(result?.catch)result.catch(()=>{/* Los controles permiten iniciar si el navegador bloquea el sonido. */});
close.focus();
});
close.addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{full.pause();full.removeAttribute('src');full.load();document.body.style.overflow=previousOverflow;tap.focus({preventScroll:true})});
preview.addEventListener('error',()=>{preview.src.endsWith('pesas-poster.webp') || (preview.src='assets/pesas-poster.webp')});
document.addEventListener('visibilitychange',()=>{if(document.hidden)full.pause()});
window.addEventListener('pagehide',()=>full.pause());
})();

