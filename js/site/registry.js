// Registro de secciones (carga on-demand)

const REGISTRY = {
  header: () => import('./sections/header.js'),
  footer: () => import('./sections/footer.js'),
  hero: () => import('./sections/hero.js'),
  seoLocal: () => import('./sections/seoLocal.js'),  values: () => import('./sections/values.js'),
  cta: () => import('./sections/cta.js')
};

export function registerSections(map) {
  Object.assign(REGISTRY, map);
}

export async function registerPack(packName) {
  if (!packName) return;
  const name = String(packName).toLowerCase();
  if (name === 'vehicles' || name === 'autos' || name === 'concesionaria') {
    const mod = await import('./packs/vehicles/register.js');
    mod.registerVehiclesPack();
    return;
  }
  if (name === 'consulting' || name === 'consultora' || name === 'services') {
    const mod = await import('./packs/consulting/register.js');
    mod.registerConsultingPack();
    return;
  }
}

export async function loadSection(sectionName) {
  const loader = REGISTRY[sectionName];
  if (!loader) throw new Error(`Sección no registrada: ${sectionName}`);
  return loader();
}
