import { applyTheme } from './applyTheme.js';
import { applyMeta } from './meta.js';
import { renderHeaderFooter, renderPageLayout } from './render.js';
import { registerPack } from './registry.js';
import { initFadeAnimations, initSmoothScroll } from './ui.js';

function getPageKey() {
  const path = window.location.pathname;
  if (path === '/' || path.endsWith('/index.html')) return 'home';
  // Se pueden agregar más páginas después (vehiculos, contacto, etc.)
  return 'home';
}

async function boot() {
  const SITE = window.SITE;
  if (!SITE) {
    console.error('[Site] window.SITE no está definido. ¿Cargaste /config/site.js?');
    return;
  }

  applyTheme(SITE.theme);
  applyMeta(SITE.branding, SITE.env || {});

  // Packs por rubro (secciones opcionales)
  await registerPack(SITE.pack);

  await renderHeaderFooter(SITE);

  const pageKey = getPageKey();
  const layout = (SITE.pages && SITE.pages[pageKey] && SITE.pages[pageKey].layout) || [];
  await renderPageLayout(layout, SITE);

  // UI helpers
  try {
    initFadeAnimations();
    initSmoothScroll('.navbar');
    // Compatibilidad con vehicles.js (reinvoca animaciones luego de render)
    window.initFadeAnimations = initFadeAnimations;
  } catch (e) {
    console.warn('[Site] UI init failed:', e);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
