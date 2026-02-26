function isActive(item) {
  try {
    const path = window.location.pathname;
    if (Array.isArray(item.activeOn) && item.activeOn.includes(path)) return true;
    if (item.href === '/' && (path === '/' || path.endsWith('index.html'))) return true;
    if (item.href && item.href !== '/' && path.startsWith(item.href)) return true;
  } catch {}
  return false;
}

export function render(root, cfg = {}, SITE) {
  const brand = SITE.branding || {};
  const menu = cfg.menu || [];

  root.innerHTML = `
    <nav class="navbar" role="navigation" aria-label="Navegación principal">
      <div class="container">
        <a href="/" class="navbar-brand" aria-label="${brand.name || 'Inicio'}">
          <img src="${brand.logo || ''}" alt="${brand.logoAlt || brand.name || ''}" class="navbar-logo site-logo" onerror="this.style.display='none';this.nextElementSibling.style.display='inline';">
          <span class="navbar-brand-fallback">${(brand.name || '').toUpperCase() || 'SITIO'}</span>
        </a>
        <ul class="navbar-menu" role="menubar" id="site-nav-menu"></ul>
        <button class="hamburger" aria-label="Menú">
          <span></span><span></span><span></span>
        </button>
      </div>
    </nav>
  `;

  const ul = root.querySelector('#site-nav-menu');
  if (ul) {
    ul.innerHTML = menu
      .map((item) => {
        const active = isActive(item) ? 'active' : '';
        const accentStyle = item.accent ? 'style="color: var(--color-primary);"' : '';
        return `<li role="none"><a href="${item.href}" class="${active}" role="menuitem" ${accentStyle}>${item.label}</a></li>`;
      })
      .join('');
  }

  // hamburger toggle (usa tu CSS)
  const hamburger = root.querySelector('.hamburger');
  hamburger?.addEventListener('click', () => {
    root.querySelector('.navbar-menu')?.classList.toggle('active');
    hamburger.classList.toggle('active');
  });
}
