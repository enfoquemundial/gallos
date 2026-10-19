import { getFirestore, doc, getDocFromServer, runTransaction, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js';

export function normalizeWhatsapp(value) {
  const phone = value.trim().replace(/[\s().-]/g, '');
  return /^(?:[0-9]{7,15}|\+[1-9][0-9]{7,14})$/.test(phone) ? phone : null;
}
export function isCompleteProfile(data) {
  return !!data && typeof data.whatsapp === 'string' && !!normalizeWhatsapp(data.whatsapp)
    && data.notificationsConsent === true && data.consentVersion === 'live-notifications-v1';
}

export function createProfileGate(app, signOut) {
  const db = getFirestore(app);
  let active = null;
  function cancel() {
    if (!active) return;
    const previous = active;
    active = null;
    previous.dialog.close();
    previous.dialog.remove();
    previous.resolve(false);
  }
  function ensure(user) {
    if (!user) { cancel(); return Promise.resolve(false); }
    if (active?.uid === user.uid) return active.promise;
    cancel();
    const dialog = document.createElement('dialog');
    dialog.hidden = true;
    dialog.setAttribute('aria-labelledby', 'whatsapp-title');
    dialog.style.cssText = 'visibility:visible;position:fixed;inset:0;margin:auto;width:min(440px,calc(100% - 32px));max-height:90dvh;overflow:auto;border:1px solid #30394b;border-radius:18px;padding:28px;background:#111827;color:#e5e7eb;font-family:inherit;box-sizing:border-box;';
    dialog.innerHTML = `
      <style>dialog::backdrop{background:rgba(5,9,16,.94)}#whatsapp-form input[type=text],#whatsapp-form input[type=tel]{display:block;width:100%;box-sizing:border-box;padding:12px;margin:8px 0 16px;border:1px solid #374151;border-radius:8px;background:#182030;color:#fff;font:inherit}#whatsapp-form button,#whatsapp-retry,#whatsapp-logout{padding:12px 16px;border:1px solid #475569;border-radius:8px;font:inherit;cursor:pointer}#whatsapp-form button{width:100%;background:#00d780;color:#07140e;font-weight:600}#whatsapp-form button:disabled{opacity:.6;cursor:wait}</style>
      <h1 id="whatsapp-title" style="font-size:25px;margin:0 0 12px">Completa tu registro</h1>
      <p>Tu WhatsApp se usará únicamente para enviarte notificaciones sobre próximos en vivo de Tu Norte.</p>
      <p>Podrás solicitar dejar de recibir estos avisos cuando quieras. Guardar el número no envía mensajes automáticamente.</p>
      <p id="whatsapp-status" role="status" aria-live="polite"></p>
      <form id="whatsapp-form" hidden>
        <label for="whatsapp-name">Nombre</label>
        <input id="whatsapp-name" type="text" autocomplete="name" maxlength="100" required>
        <label for="whatsapp-number">Número de WhatsApp</label>
        <input id="whatsapp-number" type="tel" autocomplete="tel" inputmode="tel" maxlength="32" placeholder="Tu número de WhatsApp" aria-describedby="whatsapp-hint" required>
        <p id="whatsapp-hint">Escribe tu número como lo usas habitualmente.</p>
        <label style="display:flex;gap:10px;align-items:flex-start;margin:20px 0"><input id="whatsapp-consent" type="checkbox" required> <span>Acepto recibir únicamente notificaciones de próximos en vivo de Tu Norte en este WhatsApp.</span></label>
        <button type="submit">Guardar y continuar</button>
      </form>
      <button type="button" id="whatsapp-retry" hidden>Volver a intentar</button>
      <button type="button" id="whatsapp-logout" style="margin-top:16px;background:transparent;color:inherit">Cerrar sesión</button>`;
    document.body.appendChild(dialog);
    dialog.addEventListener('cancel', event => event.preventDefault());
    const state = { uid: user.uid, dialog };
    state.promise = new Promise(resolve => { state.resolve = resolve; });
    active = state;
    const current = () => active === state;
    const status = dialog.querySelector('#whatsapp-status');
    const form = dialog.querySelector('form');
    const retry = dialog.querySelector('#whatsapp-retry');
    const name = dialog.querySelector('#whatsapp-name');
    const number = dialog.querySelector('#whatsapp-number');
    const consent = dialog.querySelector('#whatsapp-consent');
    const reference = doc(db, 'users', user.uid);
    function complete() {
      if (!current()) return;
      active = null;
      dialog.close(); dialog.remove(); state.resolve(true);
    }
    async function load() {
      retry.hidden = true;
      status.textContent = '';
      try {
        const snapshot = await getDocFromServer(reference);
        if (!current()) return;
        const data = snapshot.data();
        if (isCompleteProfile(data)) { complete(); return; }
        name.value = data?.displayName || user.displayName || '';
        number.value = data?.whatsapp || '';
        form.hidden = false;
        status.textContent = '';
        dialog.hidden = false;
        if (!dialog.open) dialog.showModal();
        (name.value ? number : name).focus();
      } catch {
        if (!current()) return;
        status.textContent = 'No se pudo consultar tu perfil. Revisa tu conexión y vuelve a intentar. Si continúa, contacta con Tu Norte.';
        retry.hidden = false;
        dialog.hidden = false;
        if (!dialog.open) dialog.showModal();
      }
    }
    retry.addEventListener('click', load);
    dialog.querySelector('#whatsapp-logout').addEventListener('click', async () => {
      try { await signOut(); }
      catch { status.textContent = 'No se pudo cerrar sesión. Inténtalo otra vez.'; }
    });
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const whatsapp = normalizeWhatsapp(number.value);
      if (!whatsapp) { status.textContent = 'Ingresa un número válido de entre 7 y 15 dígitos.'; number.focus(); return; }
      const displayName = name.value.trim();
      if (!displayName) { status.textContent = 'Ingresa tu nombre.'; name.focus(); return; }
      const button = form.querySelector('button');
      if (button.disabled) return;
      button.disabled = true;
      status.textContent = 'Guardando…';
      try {
        await runTransaction(db, async transaction => {
          const existing = await transaction.get(reference);
          if (!current()) throw new Error('session-changed');
          const data = {
            uid: user.uid, displayName, email: user.email || '', whatsapp,
            notificationsConsent: consent.checked, consentVersion: 'live-notifications-v1',
            consentAt: serverTimestamp(), updatedAt: serverTimestamp()
          };
          if (!existing.exists()) data.createdAt = serverTimestamp();
          transaction.set(reference, data, { merge: true });
        });
        complete();
      } catch {
        if (current()) status.textContent = 'No se pudo guardar tu WhatsApp. Revisa tu conexión e inténtalo otra vez.';
      } finally { button.disabled = false; }
    });
    load();
    return state.promise;
  }
  return { ensure, cancel };
}
