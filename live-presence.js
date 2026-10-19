/* Solo presencia de cuentas registradas; no contiene nombres, correos ni WhatsApp. */
(async () => {
  const counters = [...document.querySelectorAll('[data-live-count]')];
  if (!counters.length) return;
  function display(value, title) {
    counters.forEach(el => { el.textContent = value; el.title = title || 'Cuentas registradas conectadas a la página del directo'; });
  }
  display('—');
  if (!await window.gcAuth?.ready) return;
  const [appSdk, authSdk, databaseSdk] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js')
  ]);
  const app = appSdk.getApp();
  const auth = authSdk.getAuth(app);
  const db = databaseSdk.getDatabase(app, 'https://tu-norte-default-rtdb.firebaseio.com');
  const room = 'livePresence/main';
  let generation = 0;
  let subscriptions = [];
  let currentConnection = null;
  let connected = false;
  function stop() {
    generation++;
    subscriptions.forEach(unsubscribe => unsubscribe());
    subscriptions = [];
    currentConnection = null;
    connected = false;
    // Cerrar el socket ejecuta la eliminación registrada en el servidor.
    databaseSdk.goOffline(db);
    display('—');
  }
  window.gcPresenceStop = stop;
  async function start(user) {
    stop();
    const version = generation;
    if (!user || !await window.gcAuth.profileReady || version !== generation) return;
    const current = () => version === generation && window.gcAuth.user?.uid === user.uid;
    databaseSdk.goOnline(db);
    const error = () => {
      if (current()) display('—', 'Contador no disponible. Comprueba la conexión o las reglas de Realtime Database.');
    };
    subscriptions.push(databaseSdk.onValue(databaseSdk.ref(db, room), snapshot => {
      if (!current() || !connected) return;
      const users = snapshot.val() || {};
      const count = Object.values(users).filter(tabs => tabs && Object.values(tabs).some(value => value === true)).length;
      display(count.toLocaleString('es'));
    }, error));
    subscriptions.push(databaseSdk.onValue(databaseSdk.ref(db, '.info/connected'), async snapshot => {
      if (!current()) return;
      connected = snapshot.val() === true;
      if (!connected) { display('—', 'Reconectando contador…'); return; }
      const connection = databaseSdk.push(databaseSdk.ref(db, room + '/' + user.uid));
      currentConnection = connection;
      try {
        const cleanup = databaseSdk.onDisconnect(connection);
        await cleanup.remove();
        if (!current() || currentConnection !== connection) { await cleanup.cancel(); return; }
        await databaseSdk.set(connection, true);
      } catch { error(); }
    }, error));
  }
  authSdk.onAuthStateChanged(auth, user => { start(user).catch(() => display('—', 'Contador no disponible')); });
  window.addEventListener('pagehide', stop);
  window.addEventListener('pageshow', event => {
    if (event.persisted) start(auth.currentUser).catch(() => display('—', 'Contador no disponible'));
  });
})().catch(() => {
  document.querySelectorAll('[data-live-count]').forEach(el => { el.textContent = '—'; el.title = 'Contador no disponible'; });
});
