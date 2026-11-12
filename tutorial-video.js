/* Tutorial de registro. Carga únicamente al abrirlo. */
(()=>{
'use strict';
const opener=document.querySelector('.category-card.tutorials');
const dialog=document.getElementById('registration-tutorial');
if(!opener||!dialog)return;
const video=dialog.querySelector('video'),status=dialog.querySelector('[role="status"]');
let oldOverflow='';
function openTutorial(){
 if(dialog.open)return;
 oldOverflow=document.body.style.overflow;
 if(!video.getAttribute('src'))video.src='assets/tutoriales/registro-tutorial.mp4';
 status.textContent='';
 document.querySelectorAll('video').forEach(other=>{if(other!==video)other.pause()});
 dialog.showModal();document.body.style.overflow='hidden';
 video.currentTime=0;video.muted=false;
 video.play().catch(()=>{status.textContent='Pulsa reproducir para ver el tutorial.'});
 dialog.querySelector('button').focus();
}
opener.addEventListener('click',openTutorial);
opener.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openTutorial()}});
dialog.querySelector('button').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close()});
dialog.addEventListener('close',()=>{video.pause();document.body.style.overflow=oldOverflow;opener.focus({preventScroll:true})});
video.addEventListener('playing',()=>{status.textContent=''});
video.addEventListener('error',()=>{status.textContent='No se pudo cargar el video. Cierra el tutorial y vuelve a intentarlo.'});
window.addEventListener('pagehide',()=>{video.pause();if(dialog.open)dialog.close()});
})();
