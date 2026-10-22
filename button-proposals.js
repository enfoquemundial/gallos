(()=>{'use strict';
const shell=document.querySelector('.proposal-shell');if(!shell)return;
const names=['Actual','Pista','Editorial','Azul club','Metal','Marcador','Cristal','Competición','Universitario','Compacto','Cobre','Señalética','Lavanda','Canto azul','Circular','Magenta','Líneas','Arcilla','Eléctrico','Oro mate'];
const label=shell.querySelector('.proposal-label'),buttons=[...shell.querySelectorAll('.action-row button')];
let current=1;
function render(n){current=(n+19)%20+1;shell.dataset.design=String(current);label.querySelector('b').textContent=String(current).padStart(2,'0');label.querySelector('.proposal-name').textContent=names[current-1];label.querySelector('small').textContent=current===1?'ACTUAL':'MAQUETA';buttons.forEach(b=>{if(current===1){b.removeAttribute('aria-disabled');b.removeAttribute('title')}else{b.setAttribute('aria-disabled','true');b.title='Propuesta '+current+' · Maqueta sin redirección'}});const url=new URL(location.href);if(current===1)url.searchParams.delete('diseno');else url.searchParams.set('diseno',String(current));history.replaceState(null,'',url.pathname+url.search+url.hash)}
shell.querySelector('.proposal-prev').addEventListener('click',()=>render(current-1));
shell.querySelector('.proposal-next').addEventListener('click',()=>render(current+1));
shell.addEventListener('click',event=>{if(current!==1&&event.target.closest('.action-row button')){event.preventDefault();event.stopImmediatePropagation()}},true);
shell.addEventListener('keydown',event=>{if(event.target.closest('.action-row button'))return;if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();render(current+(event.key==='ArrowRight'?1:-1))}});
const requested=Number(new URL(location.href).searchParams.get('diseno'));render(Number.isInteger(requested)&&requested>=1&&requested<=20?requested:1);
})();