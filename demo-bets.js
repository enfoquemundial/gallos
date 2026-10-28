import{getApps}from'https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js';
import{getFirestore,collection,doc,query,orderBy,limit,onSnapshot,runTransaction,serverTimestamp,Timestamp}from'https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js';
import{offerTerms,opposite,canAccept,roomFromSearch}from'./demo-bets-core.js?v=1';
const board=document.getElementById('bet-offers'),list=document.getElementById('demo-offers'),status=document.getElementById('demo-status'),roomLabel=document.getElementById('demo-room');
const buttons=[...document.querySelectorAll('[data-demo-publish]')];let stop=null,clock=null,user=null,offers=[],busy=false,connected=false,leaving=false;
const color=side=>side==='white'?'BLANCO':'AZUL',amount=value=>'USD '+Number(value).toLocaleString('en-US');
function node(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n}
function tell(text){status.textContent=text}
function updateButtons(){buttons.forEach(b=>{b.disabled=!connected||busy||leaving;b.textContent=busy?'Guardando…':'Publicar demo'})}
function shutdown(){leaving=true;connected=false;stop?.();stop=null;clearInterval(clock);clock=null;offers=[];list.replaceChildren();updateButtons()}
function errorMessage(error){if(error.code==='permission-denied')return 'No se pudo acceder a la demo. Revisa los permisos de demostración en Firebase.';if(error.code==='unavailable'||!navigator.onLine)return 'No hay conexión. Vuelve a intentarlo cuando tengas internet.';return error.message||'No se pudo guardar. Inténtalo de nuevo.'}
async function action(fn){if(busy||!connected||!user||leaving)return;busy=true;updateButtons();render();try{await fn()}catch(error){tell(errorMessage(error))}finally{busy=false;updateButtons();render()}}
let db,offersRef;
function render(){
 list.replaceChildren();if(!user||leaving)return;
 const now=Date.now(),visible=offers.filter(offer=>(offer.status==='open'&&offer.expiresAt?.toMillis()>now)||((offer.makerUid===user.uid||offer.takerUid===user.uid)&&offer.status==='matched'));
 if(!visible.length){list.append(node('p',connected?'No hay apuestas demo pendientes en esta gallera.':'Conectando la demo…','demo-empty'));return}
 visible.forEach(offer=>{
  const mine=offer.makerUid===user.uid,joined=offer.takerUid===user.uid,row=node('article',undefined,'demo-offer'),info=node('div',undefined,'demo-offer-info');
  const badge=node('span',offer.status==='matched'?'EMPAREJADA':mine?'TU APUESTA':'ABIERTA','demo-offer-badge');info.append(badge,node('strong',color(offer.side)+' '+amount(offer.stake)+' · '+color(opposite(offer.side))+' '+amount(offer.opponentStake)));
  if(offer.status==='matched'){info.append(node('small',mine||joined?'Otro usuario y tú aceptaron este encuentro de demostración.':'Demostración emparejada.'))}
  else if(mine){info.append(node('small','Esperando un contrincante del lado '+color(opposite(offer.side))+'.'))}
  else{info.append(node('small','Aceptas '+color(opposite(offer.side))+' por '+amount(offer.opponentStake)+'. Sin dinero real.'))}
  row.append(info);
  if(offer.status==='open'){
   const button=node('button',mine?'Cancelar':'Aceptar demo','demo-offer-action');button.type='button';button.disabled=busy;
   button.addEventListener('click',()=>action(async()=>{
    const target=doc(offersRef,offer.id);
    await runTransaction(db,async tx=>{const snap=await tx.get(target),current=snap.data();if(!current||current.mode!=='demo'||current.status!=='open')throw Error('Otro usuario ya aceptó o canceló esa apuesta.');
     if(mine){if(current.makerUid!==user.uid)throw Error('Solo el autor puede cancelar.');tx.update(target,{status:'cancelled',updatedAt:serverTimestamp()})}
     else{if(!canAccept(current,user.uid))throw Error('La apuesta venció o no puedes aceptarla.');tx.update(target,{status:'matched',takerUid:user.uid,updatedAt:serverTimestamp()})}
    });
    tell(mine?'Apuesta demo cancelada.':'Apuesta demo emparejada con el otro usuario. No se movió dinero.');
   }));row.append(button);
  }
  list.append(row);
 });
}
if(board&&list&&status){
 await window.gcAuth?.ready;
 if(window.gcAuth?.user&&await window.gcAuth.profileReady&&!window.gcAuth.accessSuspended){
  user=window.gcAuth.user;db=getFirestore(getApps().find(app=>app.name==='[DEFAULT]'));const room=roomFromSearch(location.search);offersRef=collection(db,'demoRooms',room,'offers');roomLabel.textContent=room==='demo-general'?'Sala general de demostración':room.replaceAll('-',' ');
  stop=onSnapshot(query(offersRef,orderBy('createdAt','desc'),limit(30)),snapshot=>{if(leaving)return;connected=true;offers=snapshot.docs.map(s=>({id:s.id,...s.data()}));updateButtons();render()},error=>{connected=false;updateButtons();tell(errorMessage(error))});
  clock=setInterval(render,15000);
  buttons.forEach(button=>button.addEventListener('click',()=>action(async()=>{
   const choice=window.tnBetSelection?.();if(!choice||choice.side!==button.dataset.demoPublish)throw Error('Selecciona primero un monto normal o con ventaja de este lado.');
   const terms=offerTerms(choice.side,choice.stake,choice.advantage),target=doc(offersRef);
   await runTransaction(db,async tx=>{if((await tx.get(target)).exists())throw Error('Esta apuesta ya fue publicada.');tx.set(target,{mode:'demo',makerUid:user.uid,takerUid:'',...terms,status:'open',createdAt:serverTimestamp(),updatedAt:serverTimestamp(),expiresAt:Timestamp.fromMillis(Date.now()+10*60*1000)})});
   tell('Apuesta demo publicada. Otro usuario de esta misma gallera ya puede aceptarla.');window.tnClearBetSelection?.();
  })));
 }else{tell('Inicia sesión para probar la demo.');updateButtons()}
 window.addEventListener('pagehide',shutdown);
 new MutationObserver(()=>{if(document.documentElement.hasAttribute('data-auth-pending'))shutdown()}).observe(document.documentElement,{attributes:true,attributeFilter:['data-auth-pending']});
}
