/* Preview silencioso; primer toque sonido, segundo toque vista completa. */
(()=>{
'use strict';
const preview=document.getElementById('feed-pesas'),dialog=document.querySelector('.feed-video-dialog');
if(!preview||!dialog)return;
const tap=document.querySelector('.feed-video-tap'),hint=tap.querySelector('.video-tap-hint'),icon=tap.querySelector('.video-sound-icon');
const full=dialog.querySelector('video'),close=dialog.querySelector('button'),home=document.querySelector('.phone-mockup');
let visible=false,loading=false,previousOverflow='';
function load(){if(!preview.getAttribute('src')){preview.src=preview.dataset.src;preview.load()}}
function soundLabel(){const silent=preview.muted;hint.textContent=silent?'Toca para activar el sonido':'Toca otra vez para ver completo';icon.textContent=silent?'🔇':'🔊';tap.setAttribute('aria-label',silent?'Activar sonido del video':'Abrir video completo')}
function tryPlay(video){const result=video.play();if(result&&result.catch)result.catch(()=>{if(video===preview&&preview.muted)hint.textContent='Toca para reproducir'})}
function sync(){if(visible&&!document.hidden&&!home?.hidden&&!dialog.open){load();tryPlay(preview)}else preview.pause()}
tap.addEventListener('click',()=>{
load();
if(preview.muted){preview.muted=false;preview.volume=1;soundLabel();tryPlay(preview);return}
if(dialog.open)return;
preview.pause();previousOverflow=document.body.style.overflow;
dialog.showModal();document.body.style.overflow='hidden';
full.src=preview.dataset.src;full.muted=false;full.volume=1;loading=true;
full.load();close.focus();
});
full.addEventListener('loadedmetadata',()=>{if(!loading||!dialog.open)return;loading=false;full.currentTime=Math.min(preview.currentTime,Number.isFinite(full.duration)?Math.max(0,full.duration-.05):preview.currentTime);tryPlay(full)});
close.addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{loading=false;full.pause();if(Number.isFinite(full.currentTime))preview.currentTime=full.currentTime;full.removeAttribute('src');full.load();document.body.style.overflow=previousOverflow;preview.muted=true;soundLabel();sync();tap.focus({preventScroll:true})});
preview.addEventListener('error',()=>{document.getElementById('feed-video-error').hidden=false;hint.textContent='Video no disponible'});
full.addEventListener('error',()=>{if(dialog.open)dialog.close()});
preview.addEventListener('volumechange',soundLabel);
if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync()},{threshold:.25});observer.observe(preview)}else{visible=true;sync()}
if(home)new MutationObserver(sync).observe(home,{attributes:true,attributeFilter:['hidden']});
document.addEventListener('visibilitychange',()=>{if(document.hidden){preview.pause();full.pause()}else sync()});
window.addEventListener('pagehide',()=>{preview.pause();full.pause()});
window.addEventListener('pageshow',sync);
soundLabel();
})();
