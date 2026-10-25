/* Contenido editorial. Nunca concede permisos ni controla saldos. */
window.tnContentReady=(async()=>{
  const page=location.pathname.split('/').pop()||'index.html';
  if(window.gcAuth){await window.gcAuth.ready;if(['plataforma.html','en-vivo.html','evento.html','ciudades.html','deportes.html','billetera.html'].includes(page)&&(!window.gcAuth.user||!await window.gcAuth.profileReady))return {};}
  try{
    const [{getApps,initializeApp},fs,{safeMedia}]=await Promise.all([import('https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js'),import('https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js'),import('./admin-core.js?v=1')]);
    const db=fs.getFirestore(getApps()[0]||initializeApp(window.TU_NORTE_FIREBASE_CONFIG));
    let current={};const originals=new WeakMap();const catalog=await fetch('content-catalog.json?v=2').then(r=>r.ok?r.json():[]).catch(()=>[]);
    function apply(){
      document.querySelectorAll('[data-cms-key]').forEach(img=>{if(!originals.has(img))originals.set(img,{src:img.getAttribute('src'),alt:img.alt});const original=originals.get(img),item=current.media?.[img.dataset.cmsKey],url=safeMedia(item?.src);img.src=url||original.src;img.alt=typeof item?.alt==='string'?item.alt:original.alt});
      const sport=document.getElementById('sport-image');if(sport){const key=['futbol','beisbol','baloncesto','boxeo'].includes(location.hash.slice(1))?location.hash.slice(1):'futbol',item=current.media?.['sport-'+key],original=catalog.find(x=>x.id==='sport-'+key),url=safeMedia(item?.src||original?.src);if(url){sport.src=url;sport.alt=item?.alt||original?.alt||key;const credit=document.getElementById('photo-credit');if(credit){if(!originals.has(credit))originals.set(credit,{text:credit.textContent,href:credit.getAttribute('href')});if(item){credit.textContent='Imagen administrada por Tu Norte';credit.removeAttribute('href')}else{credit.textContent=originals.get(credit).text;credit.setAttribute('href',originals.get(credit).href||'https://unsplash.com')}}}}
      const hero=safeMedia(current.media?.['hero-extension']?.src),heroElement=document.querySelector('.home-hero');if(heroElement){if(hero&&matchMedia('(max-width:767px)').matches)heroElement.style.backgroundImage='url("'+hero.replaceAll('"','%22')+'")';else heroElement.style.removeProperty('background-image')}
      window.tnSiteContent=current;window.dispatchEvent(new CustomEvent('tn-content-change',{detail:current}));
    }
    window.addEventListener('tn-media-render',apply);
    window.addEventListener('hashchange',()=>setTimeout(apply,0));window.addEventListener('resize',apply);
    return await new Promise(resolve=>{let first=true;fs.onSnapshot(fs.doc(db,'siteContent','main'),snap=>{current=snap.data()||{};apply();if(first){first=false;resolve(current)}},()=>{if(first){first=false;resolve({})}});setTimeout(()=>{if(first){first=false;resolve({})}},5000)});
  }catch{return {}}
})();
