export function render(root, cfg = {}) {
  root.classList.add('section');
  root.style.background = 'var(--color-dark)';

  const items = Array.isArray(cfg.items) ? cfg.items : [];

  root.innerHTML = `
    <div class="container">
      <h2 class="section-title fade-in">${cfg.title || ''}</h2>
      <div class="values-grid">
        ${items.map(i => `
          <div class="value-card fade-in">
            <div class="value-icon">${i.icon || ''}</div>
            <h3>${i.title || ''}</h3>
            <p>${i.text || ''}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
