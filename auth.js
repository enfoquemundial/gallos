/* Firebase Authentication. No se confía en marcas de localStorage. */
(() => {
  'use strict';
  const protectedPage = ['plataforma.html', 'en-vivo.html', 'evento.html', 'billetera.html'].includes(location.pathname.split('/').pop());
  const status = document.getElementById('auth-status');
  let auth, sdk, profileGate;
  const api = window.gcAuth = { user: null, error: null };
  const message = (text) => {
    if (status) status.textContent = text;
    else if (window.showToast) window.showToast(text);
  };
  function errorMessage(error) {
    return ({
      'auth/invalid-credential': 'Correo o contraseña incorrecta.',
      'auth/user-not-found': 'Correo o contraseña incorrecta.',
      'auth/wrong-password': 'Correo o contraseña incorrecta.',
      'auth/email-already-in-use': 'Este correo ya tiene una cuenta. Inicia sesión o recupera tu contraseña.',
      'auth/weak-password': 'Elige una contraseña más segura, de al menos 6 caracteres.',
      'auth/invalid-email': 'Ingresa un correo válido.',
      'auth/popup-blocked': 'Permite las ventanas emergentes para continuar con Google.',
      'auth/popup-closed-by-user': 'Se cerró la ventana de Google. Puedes volver a intentarlo.',
      'auth/cancelled-popup-request': 'Ya hay una ventana de Google abierta.',
      'auth/unauthorized-domain': 'Este dominio aún no está autorizado en Firebase.',
      'auth/operation-not-allowed': 'Este método de acceso aún no está habilitado.',
      'auth/network-request-failed': 'No se pudo conectar. Revisa tu conexión e inténtalo otra vez.',
      'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos.',
      'auth/account-exists-with-different-credential': 'Este correo usa otro método de acceso. Inicia sesión con ese método.',
      'auth/user-disabled': 'Esta cuenta está deshabilitada.'
    })[error?.code] || 'No se pudo completar la operación. Inténtalo de nuevo.';
  }
  function render() {
    window.renderNavAuth?.();
    document.querySelectorAll('[data-auth-name]').forEach(el => {
      el.textContent = api.user?.displayName || api.user?.email || '';
    });
    document.querySelectorAll('[data-auth-logout]').forEach(el => { el.hidden = !api.user; });
    document.querySelectorAll('[data-auth-login]').forEach(el => { el.hidden = !!api.user; });
    if (protectedPage && !api.user) {
      location.replace('login.html?next=' + encodeURIComponent(location.pathname.split('/').pop()));
    } else document.documentElement.removeAttribute('data-auth-pending');
  }
  api.ready = (async () => {
    const config = window.TU_NORTE_FIREBASE_CONFIG;
    if (!config?.apiKey || !config?.authDomain || !config?.projectId || !config?.appId) {
      throw new Error('missing-config');
    }
    const [appSdk, authSdk, profileSdk] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js'),
      import('./profile.js?v=2')
    ]);
    sdk = authSdk;
    const app = appSdk.initializeApp(config);
    auth = sdk.getAuth(app);
    profileGate = profileSdk.createProfileGate(app, () => api.logout());
    auth.languageCode = 'es';
    await sdk.setPersistence(auth, sdk.browserLocalPersistence);
    await new Promise((resolve, reject) => {
      let first = true;
      sdk.onAuthStateChanged(auth, user => {
        api.user = user;
        if (user) {
          api.profileReady = profileGate.ensure(user);
          api.profileReady.then(complete => {
            if (complete && api.user?.uid === user.uid) render();
          });
        } else {
          profileGate.cancel();
          api.profileReady = Promise.resolve(false);
          render();
        }
        if (first) { first = false; resolve(); }
      }, reject);
    });
    return true;
  })().catch(error => {
    api.error = error;
    message(error.message === 'missing-config'
      ? 'El acceso está en preparación. Vuelve pronto.'
      : 'No se pudo cargar el acceso. Revisa tu conexión y recarga la página.');
    if (protectedPage) location.replace('login.html?next=' + encodeURIComponent(location.pathname.split('/').pop()));
    return false;
  });
  function destination() {
    const next = new URLSearchParams(location.search).get('next');
    return ['plataforma.html', 'evento.html', 'billetera.html', 'en-vivo.html', 'index.html'].includes(next) ? next : 'index.html';
  }
  api.logout = async () => {
    if (!await api.ready) return;
    try { window.gcPresenceStop?.(); await sdk.signOut(auth); location.assign('login.html'); }
    catch (error) { message(errorMessage(error)); }
  };
  api.openLive = async () => {
    if (!await api.ready || !api.user) {
      location.assign('login.html?next=plataforma.html');
      return;
    }
    if (await api.profileReady) location.assign('plataforma.html');
  };
  let busy = false;
  async function run(operation, navigate = true) {
    if (busy || !await api.ready || busy) return;
    busy = true;
    const controls = [...document.querySelectorAll('form button, [data-google], #reset-password')];
    controls.forEach(el => { el.disabled = true; });
    const loginError = document.getElementById('login-error');
    if (loginError) loginError.textContent = '';
    if (status) status.textContent = 'Procesando…';
    try {
      await operation();
      if (navigate && await api.profileReady) location.assign(destination());
    } catch (error) {
      if (loginError && ['auth/invalid-credential', 'auth/user-not-found', 'auth/wrong-password'].includes(error.code)) {
        loginError.textContent = 'Correo o contraseña incorrecta.';
        if (status) status.textContent = '';
      } else message(errorMessage(error));
    }
    finally { busy = false; controls.forEach(el => { el.disabled = false; }); }
  }
  document.getElementById('login-form')?.addEventListener('submit', event => {
    event.preventDefault();
    run(() => sdk.signInWithEmailAndPassword(auth, document.getElementById('email').value.trim(), document.getElementById('password').value));
  });
  const signup = document.getElementById('signup-form');
  function confirmationsValid() {
    return ['age-confirm', 'terms-confirm'].every(id => document.getElementById(id).reportValidity());
  }
  signup?.addEventListener('submit', event => {
    event.preventDefault();
    run(async () => {
      const result = await sdk.createUserWithEmailAndPassword(auth, document.getElementById('email').value.trim(), document.getElementById('password').value);
      try { await sdk.updateProfile(result.user, { displayName: document.getElementById('fullname').value.trim() }); }
      catch { /* La cuenta ya fue creada; no repetir el registro. */ }
    });
  });
  document.querySelectorAll('[data-google]').forEach(button => button.addEventListener('click', () => {
    if (signup && !confirmationsValid()) return;
    run(() => {
      const provider = new sdk.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      return sdk.signInWithPopup(auth, provider);
    });
  }));
  document.getElementById('reset-password')?.addEventListener('click', () => {
    const email = document.getElementById('email');
    if (!email.reportValidity() || !email.value.trim()) { message('Ingresa tu correo para recuperar la contraseña.'); return; }
    run(async () => {
      try { await sdk.sendPasswordResetEmail(auth, email.value.trim(), { url: new URL('login.html', location.href).href.split('?')[0] }); }
      catch (error) { if (error.code !== 'auth/user-not-found') throw error; }
      message('Si existe una cuenta con ese correo, recibirás un enlace para restablecer la contraseña. Revisa también spam.');
    }, false);
  });
  document.querySelectorAll('[data-auth-logout]').forEach(button => button.addEventListener('click', api.logout));
})();
