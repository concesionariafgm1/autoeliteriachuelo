export function render(root, cfg = {}) {
  root.classList.add('section');
  root.innerHTML = `
    <div class="container">
      <p>${cfg.text || ''}</p>
    </div>
  `;
}
