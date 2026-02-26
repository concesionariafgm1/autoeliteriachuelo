export function render(root, cfg = {}, SITE) {
  const badge = cfg.badge || SITE.branding?.tagline || '';
  const h1 = cfg.h1 || '';
  const p = cfg.p || '';
  const primary = cfg.primaryCta || null;
  const secondary = cfg.secondaryCta || null;

  root.classList.add('hero');
  root.setAttribute('role', 'banner');

  root.innerHTML = `
    <div class="hero-content">
      ${badge ? `<span class="hero-badge">${badge}</span>` : ''}
      ${h1 ? `<h1>${h1}</h1>` : ''}
      ${p ? `<p>${p}</p>` : ''}
      <div class="hero-buttons">
        ${primary ? `<a href="${primary.href}" class="btn btn-primary">${primary.label}</a>` : ''}
        ${secondary ? `<a href="${secondary.href}" class="btn btn-outline" ${secondary.external ? 'target="_blank" rel="noopener"' : ''}>${secondary.label}</a>` : ''}
      </div>
    </div>
  `;
}
