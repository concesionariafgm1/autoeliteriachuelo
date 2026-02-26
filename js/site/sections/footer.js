export function render(root, cfg = {}, SITE) {
  const brand = SITE.branding || {};
  const nav = cfg.navigation || [];
  const links = brand.links || {};

  const socialLinks = [
    links.instagram?.url ? `<a href="${links.instagram.url}" target="_blank" rel="noopener" data-social="instagram">${links.instagram.label || 'Instagram'}</a>` : '',
    links.facebook?.url ? `<a href="${links.facebook.url}" target="_blank" rel="noopener">${links.facebook.label || 'Facebook'}</a>` : ''
  ]
    .filter(Boolean)
    .join(' · ');

  const name = brand.name || 'Marca';
  const split = name.split(' ');
  const first = split.shift() || name;
  const rest = split.join(' ');

  root.innerHTML = `
    <footer class="footer" role="contentinfo">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-col">
            <div class="footer-brand">${first}${rest ? ` <span>${rest}</span>` : ''}</div>
            <p>${cfg.about || ''}</p>
            <p>${brand.addressLine1 || ''}${brand.addressLine2 ? `<br>${brand.addressLine2}` : ''}</p>
            ${socialLinks ? `<p>${socialLinks}</p>` : ''}
          </div>
          <div class="footer-col">
            <h4>Navegación</h4>
            <ul>
              ${nav.map(i => `<li><a href="${i.href}">${i.label}</a></li>`).join('')}
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <p>© ${new Date().getFullYear()} ${name}. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  `;
}
