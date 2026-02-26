import { loadSection } from './registry.js';

export async function renderHeaderFooter(SITE) {
  const headerEl = document.getElementById('site-header');
  const footerEl = document.getElementById('site-footer');

  if (headerEl) {
    const mod = await loadSection('header');
    mod.render(headerEl, SITE.sections.header, SITE);
  }

  if (footerEl) {
    const mod = await loadSection('footer');
    mod.render(footerEl, SITE.sections.footer, SITE);
  }
}

export async function renderPageLayout(layout = [], SITE) {
  const mainEl = document.getElementById('site-main');
  if (!mainEl) return;

  mainEl.innerHTML = '';

  for (const sectionName of layout) {
    const sectionConfig = (SITE.sections && SITE.sections[sectionName]) || {};
    const wrap = document.createElement('section');
    wrap.dataset.section = sectionName;
    mainEl.appendChild(wrap);

    try {
      const mod = await loadSection(sectionName);
      mod.render(wrap, sectionConfig, SITE);
    } catch (e) {
      console.error(`[Site] Error renderizando sección ${sectionName}:`, e);
      wrap.innerHTML = `
        <div class="container" style="padding:40px 20px">
          <p style="color:var(--color-gray)">No se pudo cargar la sección <b>${sectionName}</b>.</p>
        </div>
      `;
    }
  }
}
