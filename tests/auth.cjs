const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(__dirname + '/../auth.js', 'utf8')
  .replace(/import\('https:\/\/www.gstatic.com\/firebasejs\/12.7.0\/firebase-app.js'\)/, 'Promise.resolve(mockApp)')
  .replace(/import\('https:\/\/www.gstatic.com\/firebasejs\/12.7.0\/firebase-auth.js'\)/, 'Promise.resolve(mockAuth)')
  .replace("import('./profile.js?v=2')", 'Promise.resolve(mockProfile)');
function setup({page='login.html', search='', config=true, user=null, fail=null, profileReady=Promise.resolve(true)}={}) {
  const events = {}, calls = [], moves = [];
  const elements = {};
  for (const id of ['auth-status','login-form','email','password','reset-password','fullname','age-confirm','terms-confirm']) {
    elements[id] = {value:id==='email'?'test@example.com':'password123', textContent:'', reportValidity:()=>true, addEventListener:(event,fn)=>{events[id+':'+event]=fn;}};
  }
  if (page==='registro.html') { delete elements['login-form']; elements['signup-form']={addEventListener:(event,fn)=>{events['signup-form:'+event]=fn;}}; }
  const google = {addEventListener:(_,fn)=>{events.google=fn;}};
  let observer;
  const authSdk = {
    browserLocalPersistence:'local', getAuth:()=>({}), setPersistence:async (_,mode)=>calls.push(['persistence',mode]),
    onAuthStateChanged:(_,fn)=>{observer=fn; fn(user);},
    signInWithEmailAndPassword:async (_,email,password)=>{calls.push(['login',email,password]); if(fail) throw {code:fail}; observer({uid:'test'});},
    createUserWithEmailAndPassword:async()=>{calls.push(['signup']); const user={uid:'test'}; observer(user); return {user};},
    updateProfile:async (_,profile)=>calls.push(['profile',profile]),
    GoogleAuthProvider:class {setCustomParameters(){}},
    signInWithPopup:async()=>{calls.push(['google']); if(fail)throw {code:fail}; observer({uid:'test'});},
    signOut:async()=>{calls.push(['logout']); observer(null);},
    sendPasswordResetEmail:async (_,email,options)=>calls.push(['reset',email,options.url])
  };
  const document = {getElementById:id=>elements[id]||null, querySelectorAll:selector=>selector==='[data-google]'?[google]:[], documentElement:{removeAttribute:()=>calls.push(['revealed'])}};
  const location={pathname:'/gallos/'+page, search, href:'https://enfoquemundial.github.io/gallos/'+page+search, assign:url=>moves.push(url), replace:url=>moves.push(url)};
  const window={TU_NORTE_FIREBASE_CONFIG:config?{apiKey:'public',projectId:'test',authDomain:'test.firebaseapp.com',appId:'test'}:null};
  vm.runInNewContext(source, {window, document, location, URL, URLSearchParams, mockApp:{initializeApp:()=>({})}, mockAuth:authSdk,
    mockProfile:{createProfileGate:()=>({ensure:()=>profileReady,cancel:()=>{}})}});
  return {window,events,calls,moves,elements,observer:()=>observer};
}
const tick = () => new Promise(resolve=>setImmediate(resolve));
(async()=>{
  let s=setup({config:false}); assert.equal(await s.window.gcAuth.ready,false); assert.match(s.elements['auth-status'].textContent,/preparación/);
  s=setup({page:'evento.html'}); await s.window.gcAuth.ready; assert.deepEqual(s.moves,['login.html?next=evento.html']);
  s=setup({page:'evento.html',user:{uid:'real'}}); await s.window.gcAuth.ready; assert.equal(s.window.gcAuth.user.uid,'real'); assert.equal(s.moves.length,0); assert(s.calls.some(x=>x[0]==='revealed'));
  s=setup({search:'?next=https://evil.example'}); await s.window.gcAuth.ready; s.events['login-form:submit']({preventDefault(){}}); await tick(); assert.deepEqual(s.moves,['index.html']);
  s=setup({search:'?next=billetera.html'}); await s.window.gcAuth.ready; s.events['login-form:submit']({preventDefault(){}}); await tick(); assert.deepEqual(s.moves,['billetera.html']); assert(s.calls.some(x=>x[0]==='persistence'&&x[1]==='local'));
  s=setup({fail:'auth/invalid-credential'}); await s.window.gcAuth.ready; s.events['login-form:submit']({preventDefault(){}}); await tick(); assert.match(s.elements['auth-status'].textContent,/incorrectos/); assert.equal(s.moves.length,0);
  s=setup({page:'registro.html'}); await s.window.gcAuth.ready; s.events['signup-form:submit']({preventDefault(){}}); await tick(); assert(s.calls.some(x=>x[0]==='signup')); assert(s.calls.some(x=>x[0]==='profile'));
  s=setup(); await s.window.gcAuth.ready; s.events.google(); await tick(); assert(s.calls.some(x=>x[0]==='google'));
  s=setup({fail:'auth/popup-closed-by-user'}); await s.window.gcAuth.ready; s.events.google(); await tick(); assert.match(s.elements['auth-status'].textContent,/cerró/); assert.equal(s.moves.length,0);
  s=setup(); await s.window.gcAuth.ready; s.events['reset-password:click'](); await tick(); assert(s.calls.some(x=>x[0]==='reset'&&x[2]==='https://enfoquemundial.github.io/gallos/login.html')); assert.match(s.elements['auth-status'].textContent,/Si existe/);
  s=setup({user:{uid:'test'}}); await s.window.gcAuth.ready; await s.window.gcAuth.logout(); assert.equal(s.window.gcAuth.user,null); assert.deepEqual(s.moves,['login.html']);
  for (const page of ['plataforma.html', 'en-vivo.html']) {
    s=setup({page}); await s.window.gcAuth.ready;
    assert.deepEqual(s.moves,['login.html?next='+page]);
  }
  s=setup(); await s.window.gcAuth.ready; await s.window.gcAuth.openLive();
  assert.deepEqual(s.moves,['login.html?next=plataforma.html']);
  s=setup({user:{uid:'real'}}); await s.window.gcAuth.ready; await s.window.gcAuth.openLive();
  assert.deepEqual(s.moves,['plataforma.html']);
  let finishProfile;
  s=setup({profileReady:new Promise(resolve=>{finishProfile=resolve;})});
  await s.window.gcAuth.ready;
  s.events['login-form:submit']({preventDefault(){}}); await tick(); assert.equal(s.moves.length,0);
  finishProfile(true); await tick(); assert.deepEqual(s.moves,['index.html']);
  s=setup({profileReady:Promise.resolve(false)}); await s.window.gcAuth.ready;
  s.events['login-form:submit']({preventDefault(){}}); await tick(); assert.equal(s.moves.length,0);
  console.log('17 comprobaciones de autenticación y espera de perfil: OK (SDK simulado).');
})().catch(error=>{console.error(error);process.exitCode=1;});



