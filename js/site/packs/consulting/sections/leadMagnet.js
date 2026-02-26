// Sección: leadMagnet
export function render(SITE) {
  const cfg = (SITE.sections && SITE.sections.leadMagnet) || {};
  const enabled = cfg.enabled !== false;
  if (!enabled) return document.createElement('div');

  const section = document.createElement('section');
  section.className = 'section fade-in';
  section.id = cfg.id || 'leadMagnet';

  const container = document.createElement('div');
  container.className = 'container';

  const h2 = document.createElement('h2');
  h2.textContent = cfg.title || 'leadMagnet';
  container.appendChild(h2);

  const p = document.createElement('p');
  p.textContent = cfg.subtitle || '';
  container.appendChild(p);

  
  const box = document.createElement('div');
  box.className = 'card';
  const leadText = document.createElement('p');
  leadText.textContent = cfg.description || '';
  box.appendChild(leadText);

  const btn = document.createElement('a');
  btn.className = 'btn btn-secondary';
  btn.href = cfg.downloadUrl || '#';
  btn.textContent = cfg.buttonText || 'Descargar';
  btn.target = '_blank';
  box.appendChild(btn);

  container.appendChild(box);


  section.appendChild(container);
  return section;
}
