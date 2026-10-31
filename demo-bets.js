import{getApps}from'https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js';
import{getFirestore,collection,doc,query,orderBy,limit,onSnapshot,getDoc,deleteDoc,runTransaction,serverTimestamp,Timestamp}from'https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js';
import{DEMO_LIFETIME_MS,activeOffer,offerTerms,opposite,canAccept,compatible,roomFromSearch}from'./demo-bets-core.js?v=4';
const board=document.getElementById('bet-offers'),list=document.getElementById('demo-offers'),status=document.getElementById('demo-status'),roomLabel=document.getElementById('demo-room');
const buttons=[...document.querySelectorAll('[data-demo-publish]')];let stop=null,clock=null,user=null,offers=[],busy=false,matching=false,cleaning=false,connected=false,leaving=false,db,offersRef,displayName='';
const color=side=>side==='white'?'BLANCO':'AZUL',amount=value=>'USD '+Number(value).toLocaleString('en-US');
function node(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n}
let hasError=false;
function tell(text,isError=false){hasError=isError;status.textContent=text;if(isError)board.hidden=false}
function updateButtons(){buttons.forEach(b=>{b.classList.remove('demo-paired');b.disabled=!connected||busy||matching||leaving;b.textContent=busy?'Guardando…':'Publicar demo'});document.querySelectorAll('.quick-chip[data-val]').forEach(chip=>{const side=chip.closest('.side-card')?.classList.contains('white')?'white':'blue',stake=Number(chip.dataset.val),opponentStake=chip.dataset.advantage==='true'?stake/2:stake;const paired=connected&&!leaving&&!!user&&offers.some(o=>o.makerUid===user.uid&&o.side===side&&o.stake===stake&&o.opponentStake===opponentStake&&o.status==='matched'&&activeOffer(o));chip.classList.toggle('demo-amount-matched',paired);chip.title=paired?'Apuesta emparejada':'Sin emparejar'})}

const matchPreload=new Image();matchPreload.src='assets/contrincantes-v2.png';
const seenMatches=new Set();let matchOverlay=null,matchTimer=null;
function closeMatch(){clearTimeout(matchTimer);matchOverlay?.remove();matchOverlay=null}
function announceMatches(){if(!user||leaving)return;for(const o of offers){if(o.makerUid!==user.uid||o.status!=='matched'||!o.pairedWith||!activeOffer(o))continue;const key='tn-match:'+user.uid+':'+[o.id,o.pairedWith].sort().join(':');if(seenMatches.has(key))continue;seenMatches.add(key);try{if(sessionStorage.getItem(key))continue;sessionStorage.setItem(key,'1')}catch{}closeMatch();const overlay=node('div',undefined,'match-celebration');overlay.setAttribute('role','status');const stage=node('div',undefined,'match-birds');for(const side of ['left','right']){const frame=node('div',undefined,'match-bird '+side),img=document.createElement('img');img.src='assets/contrincantes-v2.png';img.alt='';frame.append(img);stage.append(frame)}const title=node('strong','¡YA TIENES CONTRINCANTE!'),names=node('p',o.makerName+' vs '+o.opponentName),close=node('button','Continuar');close.type='button';close.addEventListener('click',closeMatch);overlay.append(stage,title,names,close);document.getElementById('live-view').append(overlay);matchOverlay=overlay;matchTimer=setTimeout(closeMatch,4000)}}

function shutdown(){closeMatch();leaving=true;connected=false;stop?.();stop=null;clearInterval(clock);clock=null;offers=[];list.replaceChildren();updateButtons()}
function errorMessage(error){if(error.code==='permission-denied')return 'No se pudo acceder a la demo. Revisa sus permisos en Firebase.';if(error.code==='unavailable'||!navigator.onLine)return 'No hay conexión. Vuelve a intentarlo cuando tengas internet.';return error.message||'No se pudo guardar. Inténtalo de nuevo.'}
function matchPatch(takerUid,pairedWith,opponentName){return {status:'matched',takerUid,pairedWith,opponentName,updatedAt:serverTimestamp()}}
async function pairExisting(mine,peer){
 return runTransaction(db,async tx=>{
  const ownRef=doc(offersRef,mine.id),peerRef=doc(offersRef,peer.id),[a,b]=await Promise.all([tx.get(ownRef),tx.get(peerRef)]);
  const own=a.data(),other=b.data();if(!own||!other||own.makerUid!==user.uid||!compatible(own,other))return false;
  tx.update(ownRef,matchPatch(other.makerUid,peer.id,other.makerName));tx.update(peerRef,matchPatch(own.makerUid,mine.id,own.makerName));return true;
 });
}
async function publish(terms,requiredPeer=null){
 const target=doc(offersRef),proposal={mode:'demo',makerUid:user.uid,makerName:displayName,...terms,status:'open',expiresAt:Timestamp.fromMillis(Date.now()+DEMO_LIFETIME_MS)};
 const candidate=requiredPeer||offers.find(offer=>compatible(proposal,offer));
 return runTransaction(db,async tx=>{
  const existing=await tx.get(target);if(existing.exists())throw Error('Esta apuesta ya fue publicada.');
  let peer=null,peerRef=null;
  if(candidate){peerRef=doc(offersRef,candidate.id);peer=(await tx.get(peerRef)).data();if(!peer||!compatible(proposal,peer)){if(requiredPeer)throw Error('Otro usuario ya aceptó esa apuesta o ha vencido.');peer=null}}
  const data={...proposal,takerUid:'',pairedWith:'',opponentName:'',createdAt:serverTimestamp(),updatedAt:serverTimestamp()};
  if(peer){Object.assign(data,matchPatch(peer.makerUid,candidate.id,peer.makerName));tx.update(peerRef,matchPatch(user.uid,target.id,displayName))}
  tx.set(target,data);return !!peer;
 });
}
async function matchAutomatically(){
 if(matching||busy||!connected||!user||leaving)return;
 const mine=offers.filter(o=>o.makerUid===user.uid&&o.status==='open'&&activeOffer(o));
 if(!mine.length)return;
 matching=true;updateButtons();
 try{for(const own of mine){if(leaving)break;const peer=offers.find(o=>compatible(own,o));if(peer&&await pairExisting(own,peer))tell('Contrincante encontrado automáticamente. Apuesta demo emparejada, sin mover dinero.')}}
 catch(error){tell(errorMessage(error),true)}
 finally{matching=false;updateButtons();render()}
}
async function cleanupExpired(){
 if(cleaning||!connected||!user||leaving)return;
 const expired=offers.filter(o=>o.mode==='demo'&&Number.isFinite(o.createdAt?.toMillis())&&o.createdAt.toMillis()+DEMO_LIFETIME_MS+2000<=Date.now());
 if(!expired.length)return;
 cleaning=true;
 try{await Promise.all(expired.map(async o=>{try{await deleteDoc(doc(offersRef,o.id))}catch(error){if(error.code!=='permission-denied'&&error.code!=='unavailable')console.warn('No se pudo limpiar la oferta demo',error.code)}}))}
 finally{cleaning=false}
}
async function action(fn){if(busy||matching||!connected||!user||leaving)return;busy=true;updateButtons();render();try{await fn()}catch(error){tell(errorMessage(error),true)}finally{busy=false;updateButtons();render();matchAutomatically()}}
function render(){
 list.replaceChildren();if(!user||leaving){board.hidden=true;return}
 const now=Date.now(),visible=offers.filter(o=>Boolean(o.makerName)&&activeOffer(o,now)&&(o.status==='open'||o.status==='matched'&&o.makerUid===user.uid));
 board.hidden=!visible.length&&!hasError;
 if(!visible.length)return;
 visible.forEach(offer=>{
  const mine=offer.makerUid===user.uid,row=node('article',undefined,'demo-offer'),info=node('div',undefined,'demo-offer-info');
  info.append(node('span',offer.status==='matched'?'EMPAREJADA':mine?'TU APUESTA':'ABIERTA','demo-offer-badge'),node('strong',color(offer.side)+' '+amount(offer.stake)+' · '+color(opposite(offer.side))+' '+amount(offer.opponentStake)));
  if(offer.status==='matched')info.append(node('small','Ya tienes contrincante. Encuentro de demostración, sin dinero real.'));
  else if(mine)info.append(node('small','Se emparejará automáticamente con un usuario del lado '+color(opposite(offer.side))+' y montos compatibles.'));
  else info.append(node('small','Aceptas '+color(opposite(offer.side))+' por '+amount(offer.opponentStake)+'. Sin dinero real.'));
  info.append(node('small','Publicado por '+offer.makerName,'demo-player-name'));if(offer.status==='matched'&&offer.opponentName)info.append(node('small','Contrincante: '+offer.opponentName,'demo-player-name'));row.append(info);
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
 try{
 await window.gcAuth?.ready;
 if(window.gcAuth?.user&&await window.gcAuth.profileReady&&!window.gcAuth.accessSuspended){
  user=window.gcAuth.user;db=getFirestore(getApps().find(app=>app.name==='[DEFAULT]'));const profile=(await getDoc(doc(db,'users',user.uid))).data();displayName=profile?.displayName||'';if(!displayName.trim()||displayName.length>100)throw Error('Completa el nombre de tu perfil para publicar apuestas demo.');const room=roomFromSearch(location.search);offersRef=collection(db,'demoRooms',room,'offers');roomLabel.textContent=room==='demo-general'?'Sala general de demostración':room.replaceAll('-',' ');
  stop=onSnapshot(query(offersRef,orderBy('createdAt','desc'),limit(30)),snapshot=>{if(leaving)return;connected=true;offers=snapshot.docs.map(s=>({id:s.id,...s.data()}));updateButtons();render();announceMatches();matchAutomatically();cleanupExpired()},error=>{connected=false;updateButtons();tell(errorMessage(error),true)});
  clock=setInterval(()=>{updateButtons();render();cleanupExpired()},2000);
  buttons.forEach(button=>button.addEventListener('click',()=>action(async()=>{
   const choice=window.tnBetSelection?.();if(!choice||choice.side!==button.dataset.demoPublish)throw Error('Selecciona primero un monto normal o con ventaja de este lado.');
   const terms=offerTerms(choice.side,choice.stake,choice.advantage),paired=await publish(terms);
   tell(paired?'Contrincante encontrado automáticamente. Apuesta demo emparejada.':'Apuesta demo publicada. Esperando un contrincante compatible en esta gallera.');window.tnClearBetSelection?.();
  })));
 }else{tell('Inicia sesión para probar la demo.');updateButtons()}
 window.addEventListener('pagehide',shutdown);
 new MutationObserver(()=>{if(document.documentElement.hasAttribute('data-auth-pending'))shutdown()}).observe(document.documentElement,{attributes:true,attributeFilter:['data-auth-pending']});
 }catch(error){connected=false;updateButtons();tell(errorMessage(error),true)}
}
