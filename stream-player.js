(async function () {
  'use strict';
  if (['plataforma.html', 'en-vivo.html', 'evento.html'].includes(location.pathname.split('/').pop())) {
    if (!await window.gcAuth?.ready || !window.gcAuth.user) return;
    if (!await window.gcAuth.profileReady || !window.gcAuth.user || window.gcAuth.accessSuspended) return;
  }
  const config = window.TU_NORTE_STREAM || {};
  const uid = (config.liveInputUid || '').trim();
  const valid = /^[a-zA-Z0-9_-]{12,128}$/.test(uid);
  function setup(container) {
    const frame = container.querySelector('iframe[data-tu-norte-live]');
    if (!frame) return;
    const placeholder = container.querySelector('[data-stream-placeholder]');
    if (!valid) {
      frame.removeAttribute('src');
      frame.style.display = 'none';
      if (placeholder) placeholder.hidden = false;
      container.classList.add('stream-not-configured');
      return;
    }
    // iframe público oficial para Live Input UID; nunca usar RTSP ni claves privadas en el navegador.
    frame.src = 'https://iframe.videodelivery.net/' + encodeURIComponent(uid) + '?autoplay=true&muted=true&preload=auto';
    frame.style.display = 'block';
    if (placeholder) placeholder.hidden = true;
    container.classList.remove('stream-not-configured');
  }
  document.querySelectorAll('[data-stream-container]').forEach(setup);
  const soundButton = document.getElementById('mute-btn');
  if (!soundButton || !valid) {
    if (soundButton) soundButton.disabled = true;
    return;
  }
  const iframe = document.getElementById('live-iframe');
  if (!iframe) { soundButton.disabled = true; return; }
  soundButton.disabled = true;
  soundButton.title = 'Cargando controles de sonido…';
  function loadPlayerSDK() {
    if (typeof window.Stream === 'function') return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://embed.cloudflarestream.com/embed/sdk.latest.js';
      script.async = true;
      script.onload = () => typeof window.Stream === 'function' ? resolve() : reject(new Error('SDK unavailable'));
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  loadPlayerSDK().then(() => {
    if (!window.gcAuth?.user || window.gcAuth.accessSuspended) return;
    const player = window.Stream(iframe);
    const poster = iframe.closest('[data-stream-container]')?.querySelector('[data-stream-poster]');
    player.addEventListener('playing', () => { if (poster) poster.hidden = true; });
    player.addEventListener('error', () => {
      if (poster && window.gcAuth?.user && !window.gcAuth.accessSuspended) {
        poster.hidden = false;
        const label = poster.querySelector('span');
        if (label) label.textContent = 'La transmisión se está preparando. Vuelve pronto.';
      }
    });
    let muted = true;
    const speaker = '<path d="M4 9v6h4l5 4V5L8 9H4z"/>';
    function renderSound() {
      soundButton.setAttribute('aria-label', muted ? 'Activar sonido' : 'Silenciar');
      soundButton.setAttribute('aria-pressed', String(!muted));
      soundButton.title = muted ? 'Activar sonido' : 'Silenciar';
      soundButton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + speaker +
        (muted ? '<path d="m17 9 5 6m0-6-5 6"/>' : '<path d="M16 9a4 4 0 0 1 0 6m3-9a8 8 0 0 1 0 12"/>') + '</svg>';
    }
    player.muted = true;
    renderSound();
    soundButton.disabled = false;
    player.addEventListener('volumechange', () => {
      muted = !!player.muted;
      renderSound();
    });
    soundButton.addEventListener('click', () => {
      try {
        muted = !muted;
        if (!muted && player.volume === 0) player.volume = 1;
        player.muted = muted;
        renderSound();
      } catch {
        soundButton.title = 'No se pudo cambiar el sonido. Usa el control dentro del video.';
        window.showToast?.('No se pudo cambiar el sonido. Usa el control dentro del video.');
      }
    });
  }).catch(() => {
    soundButton.disabled = true;
    soundButton.title = 'Usa el control de sonido dentro del reproductor';
    soundButton.setAttribute('aria-label', soundButton.title);
  });
})();
