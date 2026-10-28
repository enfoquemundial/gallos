/* Galerías públicas ilustrativas. Los nombres son texto editable, nunca parte de las fotos. */
(async()=>{
'use strict';
const galleries={"galleros":{"title":"Los mejores galleros","items":[{"name":"Rafael Méndez","detail":"Gallero · Perfil de ejemplo","alt":"Hombre con polo azul sosteniendo un gallo fino rojinegro","src":"assets/destacados/galleros-1.jpg"},{"name":"Miguel Rosario","detail":"Gallero · Perfil de ejemplo","alt":"Hombre con camisa verde sosteniendo un gallo fino dorado","src":"assets/destacados/galleros-2.jpg"},{"name":"Antonio Peña","detail":"Gallero · Perfil de ejemplo","alt":"Hombre con sombrero sosteniendo un gallo fino caoba","src":"assets/destacados/galleros-3.jpg"},{"name":"Carlos Batista","detail":"Gallero · Perfil de ejemplo","alt":"Hombre con camiseta blanca sosteniendo un gallo fino plateado","src":"assets/destacados/galleros-4.jpg"},{"name":"José Ventura","detail":"Gallero · Perfil de ejemplo","alt":"Hombre con camisa azul de cuadros sosteniendo un gallo fino oscuro","src":"assets/destacados/galleros-5.jpg"},{"name":"Manuel Cabrera","detail":"Gallero · Perfil de ejemplo","alt":"Hombre con camisa vino sosteniendo un gallo fino cobrizo","src":"assets/destacados/galleros-6.jpg"}]},"criaderos":{"title":"Mejores criaderos","items":[{"name":"Traba La Palma","detail":"Santiago de los Caballeros","alt":"Interior de un criadero con corrales individuales y techo de madera","src":"assets/destacados/criaderos-1.jpg"},{"name":"Traba El Mango","detail":"La Vega","alt":"Criadero tropical con corrales a ambos lados de un camino arbolado","src":"assets/destacados/criaderos-2.jpg"},{"name":"Traba Vista Verde","detail":"Moca","alt":"Gallo fino rojinegro en un corral limpio de un criadero","src":"assets/destacados/criaderos-3.jpg"},{"name":"Traba El Roble","detail":"San Francisco de Macorís","alt":"Área de cría con aves jóvenes y nidales de madera","src":"assets/destacados/criaderos-4.jpg"},{"name":"Traba Los Pinos","detail":"Bonao","alt":"Instalaciones rurales de un criadero con corrales ventilados","src":"assets/destacados/criaderos-5.jpg"},{"name":"Traba La Ceiba","detail":"Puerto Plata","alt":"Área de cuidado de un criadero con gallo fino dorado","src":"assets/destacados/criaderos-6.jpg"}]}};
const initialContent=await(window.tnContentReady||Promise.resolve({}));
const originalGalleries=structuredClone(galleries);
function updateGalleries(data){for(const[key,gallery]of Object.entries(galleries))gallery.items.forEach((item,i)=>{const original=originalGalleries[key].items[i],override=data.media?.[key+'-'+i];Object.assign(item,original);if(override){try{const url=new URL(override.src,location.href);if(url.protocol==='https:')item.src=url.href}catch{}for(const field of ['name','detail','alt'])if(typeof override[field]==='string')item[field]=override[field]}})}
updateGalleries(initialContent);window.addEventListener('tn-content-change',event=>updateGalleries(event.detail));
const dialog=document.querySelector('.featured-stories');if(!dialog)return;
const title=dialog.querySelector('#stories-title'),stage=dialog.querySelector('.stories-stage'),image=dialog.querySelector('.stories-image'),status=dialog.querySelector('.stories-status');
const name=dialog.querySelector('.stories-name'),detail=dialog.querySelector('.stories-detail'),counter=dialog.querySelector('.stories-counter');
const progress=dialog.querySelector('.stories-progress'),pause=dialog.querySelector('.stories-toggle'),close=dialog.querySelector('.stories-close');
const cache=new Map(),duration=3000;
let gallery=null,index=0,elapsed=0,last=null,raf=0,token=0,paused=false,ready=false,opener=null,oldOverflow='';
function preload(src){if(cache.has(src))return cache.get(src);const promise=new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('image-load'));img.src=src});cache.set(src,promise);promise.catch(()=>cache.delete(src));return promise}
function paint(){[...progress.children].forEach((bar,i)=>{bar.style.setProperty('--progress',String(i<index?1:i===index?Math.min(elapsed/duration,1):0));if(i===index)bar.setAttribute('aria-current','true');else bar.removeAttribute('aria-current')})}
function updatePause(){pause.textContent=paused?'▶':'Ⅱ';pause.setAttribute('aria-label',paused?'Reanudar presentación':'Pausar presentación');pause.setAttribute('aria-pressed',String(paused))}
async function show(n){
if(!gallery||!dialog.open)return;
index=(n+gallery.items.length)%gallery.items.length;elapsed=0;last=null;ready=false;const ticket=++token,item=gallery.items[index];paint();
stage.setAttribute('data-loading','');status.hidden=false;status.textContent='Cargando foto…';
try{await preload(item.src);if(ticket!==token||!dialog.open)return;
image.src=item.src;image.alt=item.alt;name.textContent=item.name;detail.textContent=item.detail;counter.textContent=(index+1)+' / '+gallery.items.length;
status.hidden=true;stage.removeAttribute('data-loading');ready=true;last=null;
preload(gallery.items[(index+1)%gallery.items.length].src).catch(()=>{});
}catch{if(ticket!==token||!dialog.open)return;status.textContent='No se pudo cargar esta foto. Puedes pasar a la siguiente.';stage.removeAttribute('data-loading')}
}
function tick(now){if(!dialog.open)return;if(last!==null&&ready&&!paused&&!document.hidden){elapsed+=now-last;paint();if(elapsed>=duration)show(index+1)}last=now;raf=requestAnimationFrame(tick)}
function open(key,button){const selected=galleries[key];if(!selected)return;
if(dialog.open)dialog.close();
gallery=selected;opener=button;paused=false;elapsed=0;last=null;oldOverflow=document.body.style.overflow;
progress.replaceChildren();gallery.items.forEach((item,i)=>{const bar=document.createElement('button');bar.type='button';bar.setAttribute('aria-label','Ver foto '+(i+1)+': '+item.name);bar.appendChild(document.createElement('span'));bar.addEventListener('click',()=>show(i));progress.appendChild(bar)});
title.textContent=gallery.title;updatePause();dialog.showModal();document.body.style.overflow='hidden';document.getElementById('feed-pesas')?.pause?.();show(0);cancelAnimationFrame(raf);raf=requestAnimationFrame(tick);close.focus();
}
document.querySelectorAll('[data-story-gallery]').forEach(card=>{card.addEventListener('click',()=>open(card.dataset.storyGallery,card));card.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();open(card.dataset.storyGallery,card)}})});
close.addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{++token;ready=false;cancelAnimationFrame(raf);last=null;document.body.style.overflow=oldOverflow;image.removeAttribute('src');gallery=null;opener?.focus({preventScroll:true})});
dialog.querySelector('.stories-prev').addEventListener('click',()=>show(index-1));
dialog.querySelector('.stories-next').addEventListener('click',()=>show(index+1));
pause.addEventListener('click',()=>{paused=!paused;last=null;updatePause()});
dialog.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();show(index+(event.key==='ArrowRight'?1:-1))}});
document.addEventListener('visibilitychange',()=>{last=null});
window.addEventListener('pagehide',()=>{if(dialog.open)dialog.close()});

/* Un solo reloj para ambas tarjetas; las fotos se preparan antes de deslizar juntas. */
const cardSlides=[...document.querySelectorAll('[data-story-gallery]')].map(card=>{
 const collection=galleries[card.dataset.storyGallery];if(!collection)return null;
 const layers=[document.createElement('img'),document.createElement('img')];
 layers.forEach(img=>{img.className='category-photo';img.alt='';img.setAttribute('aria-hidden','true');img.decoding='async';card.prepend(img)});
 layers[0].src=collection.items[0].src;layers[0].classList.add('is-visible');
 return {card,collection,layers,position:0,front:0,visible:!('IntersectionObserver' in window)};
}).filter(Boolean);
const slideMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)');
let slideTimer=null,slideVersion=0;
function stopSlides(){clearTimeout(slideTimer);slideTimer=null;++slideVersion}
function scheduleSlides(){clearTimeout(slideTimer);if(cardSlides.some(state=>state.visible)&&!document.hidden&&!slideMotion?.matches)slideTimer=setTimeout(advanceSlides,4200)}
async function advanceSlides(){
 const ticket=++slideVersion;
 const next=cardSlides.map(state=>(state.position+1)%state.collection.items.length);
 try{
  await Promise.all(cardSlides.map((state,i)=>preload(state.collection.items[next[i]].src)));
  if(ticket!==slideVersion||document.hidden||slideMotion?.matches||!cardSlides.some(state=>state.visible))return;
  cardSlides.forEach((state,i)=>{const back=1-state.front;state.layers.forEach(layer=>layer.classList.remove('is-entering','is-leaving'));state.layers[back].classList.remove('is-visible');state.layers[back].src=state.collection.items[next[i]].src});
  if(cardSlides.length)void cardSlides[0].card.offsetWidth;
  cardSlides.forEach((state,i)=>{const back=1-state.front;state.layers[back].classList.add('is-visible','is-entering');state.layers[state.front].classList.remove('is-visible');state.layers[state.front].classList.add('is-leaving');state.front=back;state.position=next[i];preload(state.collection.items[(state.position+1)%state.collection.items.length].src).catch(()=>{})});
  scheduleSlides();
 }catch{if(ticket===slideVersion)scheduleSlides()}
}
if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{const state=cardSlides.find(state=>state.card===entry.target);if(state)state.visible=entry.isIntersecting});stopSlides();scheduleSlides()},{threshold:.15});cardSlides.forEach(state=>observer.observe(state.card))}
else scheduleSlides();
document.addEventListener('visibilitychange',()=>{stopSlides();scheduleSlides()});
slideMotion?.addEventListener?.('change',()=>{stopSlides();scheduleSlides()});
window.addEventListener('pagehide',stopSlides);
window.addEventListener('pageshow',()=>{stopSlides();scheduleSlides()});

})();
