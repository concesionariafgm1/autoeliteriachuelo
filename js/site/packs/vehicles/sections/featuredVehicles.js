export function render(root, cfg = {}) {
  root.classList.add('section');
  const title = cfg.title || 'Vehículos';
  const gridId = cfg.gridId || 'featuredVehicles';
  const showMore = cfg.showMore || null;

  root.innerHTML = `
    <div class="container">
      <h2 class="section-title fade-in">${title}</h2>
      <div class="vehicles-grid" id="${gridId}">
        <!-- Vehículos se cargan dinámicamente desde JS -->
      </div>
      ${showMore ? `
        <div style="text-align:center;margin-top:40px;" class="fade-in">
          <a href="${showMore.href}" class="btn btn-outline">${showMore.label}</a>
        </div>
      ` : ''}
    </div>
  `;
}
