/* Vista pública de una imagen y otras imágenes debajo. */
(() => {
  const home = document.querySelector('.phone-mockup');
  const photos = [...document.querySelectorAll('.feed-grid .card-image')].map(image => ({src:image.getAttribute('src'),alt:image.alt}));
  if (!home || !photos.length) return;
  const theme = getComputedStyle(document.body);
  const background = theme.backgroundColor;
  const foreground = theme.color;
  const style = document.createElement('style');
  style.textContent = `
    .gallery-detail[hidden],.phone-mockup[hidden]{display:none!important}
    .gallery-open{display:block;cursor:zoom-in}.gallery-open:focus-visible{outline:3px solid #e60023;outline-offset:3px;border-radius:16px}
    .gallery-detail{width:100%;min-height:100vh;background:var(--gallery-background,#000);color:var(--gallery-foreground,#fff);padding:16px clamp(12px,4vw,48px) 40px;box-sizing:border-box}
    .gallery-detail nav{display:flex;justify-content:space-between;gap:16px;align-items:center;margin-bottom:20px}
    .gallery-back,.gallery-live{border:0;border-radius:24px;padding:12px 18px;font:inherit;font-weight:700;cursor:pointer;text-decoration:none}
    .gallery-back{background:var(--gallery-button-background,#242424);color:inherit}.gallery-live{background:#e60023;color:#fff}
    .gallery-main{margin:0 auto 28px;max-width:860px;text-align:center}
    .gallery-main img{display:block;max-width:100%;width:auto;height:auto;max-height:76vh;object-fit:contain;margin:auto;border-radius:20px;box-shadow:0 6px 24px #0002}
    .gallery-detail h2{text-align:center;font-size:20px;margin:24px 0}
    .gallery-related{columns:2;column-gap:12px;max-width:1600px;margin:auto}
    .gallery-related a{display:block;break-inside:avoid;margin:0 0 12px;border-radius:16px;overflow:hidden;cursor:zoom-in}
    .gallery-related img{display:block;width:100%;height:auto;border-radius:16px}
    @media(min-width:768px){.gallery-related{columns:4;column-gap:20px}.gallery-related a{margin-bottom:20px}}
    @media(min-width:1200px){.gallery-related{columns:6}}
    @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
  `;
  document.head.appendChild(style);
  const detail = document.createElement('main');
  detail.className = 'gallery-detail';
  detail.style.setProperty('--gallery-background', background);
  detail.style.setProperty('--gallery-foreground', foreground);
  detail.style.setProperty('--gallery-button-background', 'color-mix(in srgb, ' + foreground + ' 12%, ' + background + ')');
  detail.hidden = true;
  detail.innerHTML = `<nav aria-label="Navegación de imagen"><button type="button" class="gallery-back">← Volver</button><a class="gallery-live" href="login.html?next=plataforma.html">Ver en vivo</a></nav><figure class="gallery-main"><img alt=""><p role="status" hidden>No se pudo cargar esta imagen.</p></figure><h2>Más imágenes</h2><div class="gallery-related"></div>`;
  document.body.appendChild(detail);
  const selected = detail.querySelector('.gallery-main img');
  const error = detail.querySelector('[role="status"]');
  const related = detail.querySelector('.gallery-related');
  const back = detail.querySelector('.gallery-back');
  let homeScroll = 0;
  let fromHome = false;
  let previousPhoto = 0;
  let showing = false;
  document.querySelectorAll('.feed-grid .card-image').forEach((image,index) => {
    const link = document.createElement('a');
    link.className = 'gallery-open';
    link.href = '#foto-' + (index + 1);
    link.setAttribute('aria-label', 'Abrir imagen: ' + image.alt);
    image.before(link);
    link.appendChild(image);
    link.addEventListener('click', () => { if (!showing) { homeScroll = window.scrollY; fromHome = true; } });
  });
  detail.querySelector('.gallery-live').addEventListener('click', event => {
    if (!window.gcAuth?.openLive) return;
    event.preventDefault(); window.gcAuth.openLive();
  });
  selected.addEventListener('error', () => { error.hidden = false; });
  selected.addEventListener('load', () => { error.hidden = true; });
  back.addEventListener('click', () => {
    // Volver directamente a la galería, incluso tras abrir varias recomendaciones.
    history.pushState(null, '', location.pathname + location.search);
    render();
  });
  function render() {
    const match = /^#foto-(\d+)$/.exec(location.hash);
    const index = match ? Number(match[1]) - 1 : -1;
    const photo = photos[index];
    if (!photo) {
      const wasShowing = showing;
      showing = false; detail.hidden = true; home.hidden = false;
      document.title = 'Inicio | Tu Norte';
      if (wasShowing) {
        window.scrollTo(0, homeScroll);
        if (fromHome) document.querySelectorAll('.gallery-open')[previousPhoto]?.focus({preventScroll:true});
      }
      return;
    }
    previousPhoto = index;
    showing = true; home.hidden = true; detail.hidden = false;
    document.title = 'Imagen | Tu Norte';
    error.hidden = true;
    selected.alt = photo.alt;
    // Ampliar la solicitud de Unsplash sin recortar la foto en la vista de detalle.
    const url = new URL(photo.src, location.href);
    if (url.hostname === 'images.unsplash.com') url.searchParams.set('w', '1200');
    selected.src = url.href;
    related.replaceChildren();
    photos.forEach((other,i) => {
      if (i === index) return;
      const link = document.createElement('a');
      link.href = '#foto-' + (i + 1);
      link.setAttribute('aria-label', 'Abrir imagen: ' + other.alt);
      const image = document.createElement('img');
      image.src = other.src; image.alt = other.alt; image.loading = 'lazy';
      link.appendChild(image); related.appendChild(link);
    });
    window.scrollTo(0,0);
    back.focus({preventScroll:true});
  }
  window.addEventListener('hashchange', render);
  window.addEventListener('popstate', render);
  render();
})();
