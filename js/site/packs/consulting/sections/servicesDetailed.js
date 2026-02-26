// Sección: servicesDetailed
export function render(SITE) {
  const cfg = (SITE.sections && SITE.sections.servicesDetailed) || {};
  const enabled = cfg.enabled !== false;
  if (!enabled) return document.createElement('div');

  const section = document.createElement('section');
  section.className = 'section fade-in';
  section.id = cfg.id || 'servicesDetailed';

  const container = document.createElement('div');
  container.className = 'container';

  const h2 = document.createElement('h2');
  h2.textContent = cfg.title || 'servicesDetailed';
  container.appendChild(h2);

  const p = document.createElement('p');
  p.textContent = cfg.subtitle || '';
  container.appendChild(p);

  
  const list = document.createElement('div');
  list.className = 'grid';
  const items = cfg.items || [];
  items.forEach(it => {
    const card = document.createElement('div');
    card.className = 'card';
    const t = document.createElement('h3'); t.textContent = it.title || '';
    const d = document.createElement('p'); d.textContent = it.description || '';
    card.appendChild(t); card.appendChild(d);
    if (it.points && it.points.length) {
      const ul = document.createElement('ul');
      it.points.forEach(pt => { const li=document.createElement('li'); li.textContent=pt; ul.appendChild(li); });
      card.appendChild(ul);
    }
    list.appendChild(card);
  });
  container.appendChild(list);


  section.appendChild(container);
  return section;
}
