export function render(root, cfg = {}) {
  root.classList.add('section');

  root.innerHTML = `
    <div class="container" style="text-align:center;">
      <div class="fade-in">
        <h2 class="section-title">${cfg.title || ''}</h2>
        <p style="color: var(--color-gray); max-width: 500px; margin: 0 auto 30px; font-size: 1rem;">
          ${cfg.text || ''}
        </p>
        ${cfg.button ? `
          <a href="${cfg.button.href}" class="btn btn-whatsapp" ${cfg.button.external ? 'target="_blank" rel="noopener"' : ''}>
            ${cfg.button.label}
          </a>
        ` : ''}
      </div>
    </div>
  `;
}
