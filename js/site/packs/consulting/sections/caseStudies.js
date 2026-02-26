// Sección: caseStudies
export function render(SITE) {
  const cfg = (SITE.sections && SITE.sections.caseStudies) || {};
  const enabled = cfg.enabled !== false;
  if (!enabled) return document.createElement('div');

  const section = document.createElement('section');
  section.className = 'section fade-in';
  section.id = cfg.id || 'caseStudies';

  const container = document.createElement('div');
  container.className = 'container';

  const h2 = document.createElement('h2');
  h2.textContent = cfg.title || 'caseStudies';
  container.appendChild(h2);

  const p = document.createElement('p');
  p.textContent = cfg.subtitle || '';
  container.appendChild(p);

  
  const list = document.createElement('div');
  list.className = 'grid';
  (cfg.items || []).forEach(it => {
    const card = document.createElement('div');
    card.className = 'card';
    const t = document.createElement('h3'); t.textContent = it.title || '';
    const d = document.createElement('p'); d.textContent = it.summary || '';
    card.appendChild(t); card.appendChild(d);
    if (it.metrics && it.metrics.length) {
      const metrics = document.createElement('div');
      metrics.className = 'badges';
      it.metrics.forEach(m => { const b=document.createElement('span'); b.className='badge'; b.textContent=m; metrics.appendChild(b); });
      card.appendChild(metrics);
    }
    list.appendChild(card);
  });
  container.appendChild(list);


  section.appendChild(container);
  return section;
}
