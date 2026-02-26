// Sección: bookCall
export function render(SITE) {
  const cfg = (SITE.sections && SITE.sections.bookCall) || {};
  const enabled = cfg.enabled !== false;
  if (!enabled) return document.createElement('div');

  const section = document.createElement('section');
  section.className = 'section fade-in';
  section.id = cfg.id || 'bookCall';

  const container = document.createElement('div');
  container.className = 'container';

  const h2 = document.createElement('h2');
  h2.textContent = cfg.title || 'bookCall';
  container.appendChild(h2);

  const p = document.createElement('p');
  p.textContent = cfg.subtitle || '';
  container.appendChild(p);

  
  const box = document.createElement('div');
  box.className = 'card';
  const btn = document.createElement('a');
  btn.className = 'btn btn-primary';
  btn.href = cfg.link || '#contacto';
  btn.textContent = cfg.buttonText || 'Agendar una llamada';
  box.appendChild(btn);

  if (cfg.embed && cfg.embed.html) {
    const iframeWrap = document.createElement('div');
    iframeWrap.className = 'embed';
    iframeWrap.innerHTML = cfg.embed.html; // controlled by you
    box.appendChild(iframeWrap);
  }
  container.appendChild(box);


  section.appendChild(container);
  return section;
}
