(function () {
  'use strict';
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
  if (soundButton) {
    soundButton.addEventListener('click', function () {
      // Cloudflare Stream incorpora su propio control de sonido en el reproductor.
      const iframe = document.getElementById('live-iframe');
      if (iframe && iframe.src) iframe.focus();
      soundButton.title = 'Utiliza el control de volumen dentro del reproductor';
    });
  }
})();
