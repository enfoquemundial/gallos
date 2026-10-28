import{getApps}from'https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js';
import{getFirestore,collection,doc,query,orderBy,limit,onSnapshot,runTransaction,serverTimestamp,Timestamp}from'https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js';
import{offerTerms,opposite,canAccept,compatible,roomFromSearch}from'./demo-bets-core.js?v=2';
const board=document.getElementById('bet-offers'),list=document.getElementById('demo-offers'),status=document.getElementById('demo-status'),roomLabel=document.getElementById('demo-room');
const buttons=[...document.querySelectorAll('[data-demo-publish]')];let stop=null,clock=null,user=null,offers=[],busy=false,matching=false,connected=false,leaving=false,db,offersRef;
const color=side=>side==='white'?'BLANCO':'AZUL',amount=value=>'USD '+Number(value).toLocaleString('en-US');
function node(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n}
function tell(text){status.textContent=text}
function updateButtons(){buttons.forEach(b=>{b.disabled=!connected||busy||matching||leaving;b.textContent=busy?'Guardando…':'Publicar demo'})}
function shutdown(){leaving=true;connected=false;stop?.();stop=null;clearInterval(clock);clock=null;offers=[];list.replaceChildren();updateButtons()}
function errorMessage(error){if(error.code==='permission-denied')return 'No se pudo acceder a la demo. Revisa sus permisos en Firebase.';if(error.code==='unavailable'||!navigator.onLine)return 'No hay conexión. Vuelve a intentarlo cuando tengas internet.';return error.message||'No se pudo guardar. Inténtalo de nuevo.'}
function matchPatch(takerUid,pairedWith){return {status:'matched',takerUid,pairedWith,updatedAt:serverTimestamp()}}
async function pairExisting(mine,peer){
 return runTransaction(db,async tx=>{
  const ownRef=doc(offersRef,mine.id),peerRef=doc(offersRef,peer.id),[a,b]=await Promise.all([tx.get(ownRef),tx.get(peerRef)]);
  const own=a.data(),other=b.data();if(!own||!other||own.makerUid!==user.uid||!compatible(own,other))return false;
  tx.update(ownRef,matchPatch(other.makerUid,peer.id));tx.update(peerRef,matchPatch(own.makerUid,mine.id));return true;
 });
}
async function publish(terms,requiredPeer=null){
 const target=doc(offersRef),proposal={mode:'demo',makerUid:user.uid,...terms,status:'open',expiresAt:Timestamp.fromMillis(Date.now()+10*60*1000)};
 const candidate=requiredPeer||offers.find(offer=>compatible(proposal,offer));
 return runTransaction(db,async tx=>{
  const existing=await tx.get(target);if(existing.exists())throw Error('Esta apuesta ya fue publicada.');
  let peer=null,peerRef=null;
  if(candidate){peerRef=doc(offersRef,candidate.id);peer=(await tx.get(peerRef)).data();if(!peer||!compatible(proposal,peer)){if(requiredPeer)throw Error('Otro usuario ya aceptó esa apuesta o ha vencido.');peer=null}}
  const data={...proposal,takerUid:'',pairedWith:'',createdAt:serverTimestamp(),updatedAt:serverTimestamp()};
  if(peer){Object.assign(data,matchPatch(peer.makerUid,candidate.id));tx.update(peerRef,matchPatch(user.uid,target.id))}
  tx.set(target,data);return !!peer;
 });
}
async function matchAutomatically(){
 if(matching||busy||!connected||!user||leaving)return;
 const mine=offers.filter(o=>o.makerUid===user.uid&&o.status==='open'&&o.expiresAt?.toMillis()>Date.now());
 if(!mine.length)return;
 matching=true;updateButtons();
 try{for(const own of mine){if(leaving)break;const peer=offers.find(o=>compatible(own,o));if(peer&&await pairExisting(own,peer))tell('Contrincante encontrado automáticamente. Apuesta demo emparejada, sin mover dinero.')}}
 catch(error){tell(errorMessage(error))}
 finally{matching=false;updateButtons();render()}
}
async function action(fn){if(busy||matching||!connected||!user||leaving)return;busy=true;updateButtons();render();try{await fn()}catch(error){tell(errorMessage(error))}finally{busy=false;updateButtons();render();matchAutomatically()}}
function render(){
 list.replaceChildren();if(!user||leaving)return;
 const now=Date.now(),visible=offers.filter(o=>(o.status==='open'&&o.expiresAt?.toMillis()>now)||(o.status==='matched'&&(o.makerUid===user.uid||(!o.pairedWith&&o.takerUid===user.uid))));
 if(!visible.length){list.append(node('p',connected?'No hay apuestas demo pendientes en esta gallera.':'Conectando la demo…','demo-empty'));return}
 visible.forEach(offer=>{
  const mine=offer.makerUid===user.uid,row=node('article',undefined,'demo-offer'),info=node('div',undefined,'demo-offer-info');
  info.append(node('span',offer.status==='matched'?'EMPAREJADA':mine?'TU APUESTA':'ABIERTA','demo-offer-badge'),node('strong',color(offer.side)+' '+amount(offer.stake)+' · '+color(opposite(offer.side))+' '+amount(offer.opponentStake)));
  if(offer.status==='matched')info.append(node('small','Ya tienes contrincante. Encuentro de demostración, sin dinero real.'));
  else if(mine)info.append(node('small','Se emparejará automáticamente con un usuario del lado '+color(opposite(offer.side))+' y montos compatibles.'));
  else info.append(node('small','Aceptas '+color(opposite(offer.side))+' por '+amount(offer.opponentStake)+'. Sin dinero real.'));
  row.append(info);
  if(offer.status==='open'){
   const button=node('button',mine?'Cancelar':'Aceptar demo','demo-offer-action');button.type='button';button.disabled=busy||matching;
   button.addEventListener('click',()=>action(async()=>{
    if(mine){
     await runTransaction(db,async tx=>{const target=doc(offersRef,offer.id),current=(await tx.get(target)).data();if(!current||current.makerUid!==user.uid||current.status!=='open')throw Error('La apuesta ya está emparejada o cancelada.');tx.update(target,{status:'cancelled',updatedAt:serverTimestamp()})});
     tell('Apuesta demo cancelada.');
    }else{
     if(!canAccept(offer,user.uid))throw Error('La apuesta venció o no puedes aceptarla.');
     const own=offers.find(o=>o.makerUid===user.uid&&compatible(o,offer));
     if(own){if(!await pairExisting(own,offer))throw Error('Otro usuario ya aceptó esa apuesta.')}
     else await publish({side:opposite(offer.side),stake:offer.opponentStake,opponentStake:offer.stake},offer);
     tell('Apuesta demo emparejada con el otro usuario. No se movió dinero.');
    }
   }));row.append(button);
  }
  list.append(row);
 });
}
if(board&&list&&status){
 await window.gcAuth?.ready;
 if(window.gcAuth?.user&&await window.gcAuth.profileReady&&!window.gcAuth.accessSuspended){
  user=window.gcAuth.user;db=getFirestore(getApps().find(app=>app.name==='[DEFAULT]'));const room=roomFromSearch(location.search);offersRef=collection(db,'demoRooms',room,'offers');roomLabel.textContent=room==='demo-general'?'Sala general de demostración':room.replaceAll('-',' ');
  stop=onSnapshot(query(offersRef,orderBy('createdAt','desc'),limit(30)),snapshot=>{if(leaving)return;connected=true;offers=snapshot.docs.map(s=>({id:s.id,...s.data()}));updateButtons();render();matchAutomatically()},error=>{connected=false;updateButtons();tell(errorMessage(error))});
  clock=setInterval(render,15000);
  buttons.forEach(button=>button.addEventListener('click',()=>action(async()=>{
   const choice=window.tnBetSelection?.();if(!choice||choice.side!==button.dataset.demoPublish)throw Error('Selecciona primero un monto normal o con ventaja de este lado.');
   const terms=offerTerms(choice.side,choice.stake,choice.advantage),paired=await publish(terms);
   tell(paired?'Contrincante encontrado automáticamente. Apuesta demo emparejada.':'Apuesta demo publicada. Esperando un contrincante compatible en esta gallera.');window.tnClearBetSelection?.();
  })));
 }else{tell('Inicia sesión para probar la demo.');updateButtons()}
 window.addEventListener('pagehide',shutdown);
 new MutationObserver(()=>{if(document.documentElement.hasAttribute('data-auth-pending'))shutdown()}).observe(document.documentElement,{attributes:true,attributeFilter:['data-auth-pending']});
}
