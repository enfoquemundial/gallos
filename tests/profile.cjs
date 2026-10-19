const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const code = fs.readFileSync(__dirname + '/../profile.js', 'utf8').replace(/^import .*;\n/, '').replaceAll('export function', 'function');
const tick = () => new Promise(resolve => setImmediate(resolve));
function setup({saved=null,readError=false,writeError=false}={}) {
  const writes=[], nodes={}; let removed=0;
  for(const key of ['#whatsapp-status','form','#whatsapp-retry','#whatsapp-name','#whatsapp-number','#whatsapp-consent','#whatsapp-logout','button']) {
    nodes[key]={value:'',checked:false,hidden:true,disabled:false,events:{},focus(){},reportValidity(){return nodes['#whatsapp-consent'].checked;},addEventListener(type,fn){this.events[type]=fn;}};
  }
  nodes.form.querySelector=()=>nodes.button;
  const dialog={style:{},setAttribute(){},showModal(){},close(){},remove(){removed++;},addEventListener(){},querySelector:key=>nodes[key]};
  const sandbox={document:{createElement:()=>dialog,body:{appendChild(){}}},getFirestore:()=>({}),doc:(_,collection,uid)=>({collection,uid}),
    getDocFromServer:async()=>{if(readError) throw Error('denied'); return {data:()=>saved};},
    serverTimestamp:()=> 'SERVER_TIME',runTransaction:async(_,fn)=>{if(writeError)throw Error('denied'); await fn({get:async()=>({exists:()=>!!saved}),set:(ref,data,options)=>writes.push({ref,data,options})});}};
  vm.createContext(sandbox); vm.runInContext(code,sandbox);
  return {gate:sandbox.createProfileGate({},async()=>{}),nodes,writes,removed:()=>removed,normalize:sandbox.normalizeWhatsapp,complete:sandbox.isCompleteProfile};
}
const user={uid:'alice',displayName:'Alice',email:'alice@example.com'};
const full={whatsapp:'+18095550123',notificationsConsent:true,consentVersion:'live-notifications-v1'};
(async()=>{
  let s=setup(); assert.equal(s.normalize(' +1 (809) 555-0123 '),'+18095550123');
  for(const invalid of ['8095550123','+0123456789','+123','+1234567890123456','+1809abc0123']) assert.equal(s.normalize(invalid),null);
  assert.equal(s.complete(full),true); assert.equal(s.complete({...full,notificationsConsent:false}),false);
  s=setup({saved:full}); assert.equal(await s.gate.ensure(user),true); assert.equal(s.writes.length,0);
  s=setup(); let done=false; const promise=s.gate.ensure(user).then(value=>{done=value;return value;}); await tick();
  assert.equal(done,false); assert.equal(s.nodes.form.hidden,false); assert.equal(s.nodes['#whatsapp-name'].value,'Alice'); assert.equal(s.nodes['#whatsapp-consent'].checked,false);
  s.nodes['#whatsapp-number'].value='+1 809 555 0123'; await s.nodes.form.events.submit({preventDefault(){}}); assert.equal(s.writes.length,0);
  s.nodes['#whatsapp-consent'].checked=true; await s.nodes.form.events.submit({preventDefault(){}}); assert.equal(await promise,true);
  assert.equal(s.writes[0].ref.uid,'alice'); assert.equal(s.writes[0].data.whatsapp,'+18095550123'); assert.equal(s.writes[0].data.consentAt,'SERVER_TIME'); assert.equal(s.writes[0].data.createdAt,'SERVER_TIME');
  s=setup({saved:{createdAt:'ORIGINAL',displayName:'Alice'}}); const pending=s.gate.ensure(user); await tick();
  s.nodes['#whatsapp-number'].value='+18095550123'; s.nodes['#whatsapp-consent'].checked=true; await s.nodes.form.events.submit({preventDefault(){}}); assert.equal(await pending,true); assert.equal('createdAt' in s.writes[0].data,false);
  s=setup({readError:true}); const failed=s.gate.ensure(user); await tick(); assert.equal(s.nodes.form.hidden,true); assert.equal(s.nodes['#whatsapp-retry'].hidden,false); s.gate.cancel(); assert.equal(await failed,false);
  s=setup({writeError:true}); const failedWrite=s.gate.ensure(user); await tick(); s.nodes['#whatsapp-number'].value='+18095550123'; s.nodes['#whatsapp-consent'].checked=true;
  await s.nodes.form.events.submit({preventDefault(){}}); assert.match(s.nodes['#whatsapp-status'].textContent,/No se pudo guardar/); assert.equal(s.nodes.button.disabled,false); s.gate.cancel(); assert.equal(await failedWrite,false);
  s=setup(); const cancelled=s.gate.ensure(user); assert.equal(s.gate.ensure(user),cancelled); s.gate.cancel(); assert.equal(await cancelled,false);
  console.log('Perfil: formato, consentimiento, primer guardado, perfil existente, errores y cierre de sesión: OK (Firestore simulado).');
})().catch(error=>{console.error(error);process.exitCode=1;});
