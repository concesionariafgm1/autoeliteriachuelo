// Sección: industries
export function render(SITE) {
  const cfg = (SITE.sections && SITE.sections.industries) || {};
  const enabled = cfg.enabled !== false;
  if (!enabled) return document.createElement('div');

  const section = document.createElement('section');
  section.className = 'section fade-in';
  section.id = cfg.id || 'industries';

  const container = document.createElement('div');
  container.className = 'container';

  const h2 = document.createElement('h2');
  h2.textContent = cfg.title || 'industries';
  container.appendChild(h2);

  const p = document.createElement('p');
  p.textContent = cfg.subtitle || '';
  container.appendChild(p);

  
  const wrap = document.createElement('div');
  wrap.className = 'badges';
  (cfg.items || []).forEach(it => {
    const b = document.createElement('span');
    b.className = 'badge';
    b.textContent = it;
    wrap.appendChild(b);
  });
  container.appendChild(wrap);


  section.appendChild(container);
  return section;
}
