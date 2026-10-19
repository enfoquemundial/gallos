/* Consulta privada del perfil de la cuenta actual. */
(() => {
  const button = document.querySelector('[data-account-open]');
  if (!button) return;
  let dialog;
  button.addEventListener('click', async () => {
    if (!await window.gcAuth?.ready || !window.gcAuth.user) return;
    if (!await window.gcAuth.profileReady) return;
    const user = window.gcAuth.user;
    if (!user) return;
    if (dialog?.open) { dialog.focus(); return; }
    dialog = document.createElement('dialog');
    dialog.setAttribute('aria-labelledby', 'account-title');
    dialog.style.cssText = 'position:fixed;inset:0;margin:auto;width:min(440px,calc(100% - 32px));max-height:90dvh;overflow:auto;box-sizing:border-box;padding:28px;border:1px solid #30394b;border-radius:18px;background:#111827;color:#e5e7eb;font-family:inherit;';
    dialog.innerHTML = `
      <style>#account-dialog::backdrop{background:rgba(5,9,16,.8)}#account-dialog dd{margin:6px 0 18px;overflow-wrap:anywhere}#account-dialog dt{color:#aeb8c8}#account-dialog button{padding:10px 16px;border:1px solid #475569;border-radius:8px;background:transparent;color:inherit;font:inherit;cursor:pointer}</style>
      <h1 id="account-title" style="margin-top:0;font-size:25px">Mi cuenta</h1>
      <p data-account-status role="status">Cargando perfil…</p>
      <dl><dt>Nombre</dt><dd data-account-name></dd><dt>Correo electrónico</dt><dd data-account-email></dd><dt>WhatsApp</dt><dd data-account-phone>—</dd></dl>
      <p>Tu WhatsApp se usa únicamente para notificaciones sobre próximos en vivo de Tu Norte.</p>
      <div style="display:flex;gap:12px;flex-wrap:wrap"><button type="button" data-account-close autofocus>Cerrar</button><button type="button" data-account-signout>Cerrar sesión</button></div>`;
    dialog.id = 'account-dialog';
    const currentDialog = dialog;
    const ownsSession = () => window.gcAuth.user?.uid === user.uid && currentDialog.open;
    const close = () => { currentDialog.close(); currentDialog.remove(); };
    currentDialog.querySelector('[data-account-name]').textContent = user.displayName || '—';
    currentDialog.querySelector('[data-account-email]').textContent = user.email || '—';
    currentDialog.querySelector('[data-account-close]').addEventListener('click', close);
    currentDialog.querySelector('[data-account-signout]').addEventListener('click', () => window.gcAuth.logout());
    document.body.appendChild(currentDialog);
    currentDialog.showModal();
    let unsubscribe;
    currentDialog.addEventListener('close', () => { unsubscribe?.(); currentDialog.remove(); }, { once: true });
    try {
      const [appSdk, authSdk, firestore] = await Promise.all([
        import('https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js'),
        import('https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js')
      ]);
      if (!ownsSession()) { close(); return; }
      const app = appSdk.getApp();
      unsubscribe = authSdk.onAuthStateChanged(authSdk.getAuth(app), next => {
        if (next?.uid !== user.uid) close();
      });
      const snapshot = await firestore.getDocFromServer(firestore.doc(firestore.getFirestore(app), 'users', user.uid));
      if (!ownsSession()) return;
      const data = snapshot.data();
      currentDialog.querySelector('[data-account-name]').textContent = data?.displayName || user.displayName || '—';
      currentDialog.querySelector('[data-account-phone]').textContent = data?.whatsapp || 'No registrado';
      currentDialog.querySelector('[data-account-status]').textContent = '';
    } catch {
      if (ownsSession()) currentDialog.querySelector('[data-account-status]').textContent = 'No se pudo cargar el perfil. Cierra esta ventana y vuelve a intentarlo.';
    }
  });
})();
