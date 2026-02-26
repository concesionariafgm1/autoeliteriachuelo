import { registerSections } from '../../registry.js';

export function registerConsultingPack() {
  registerSections({
    servicesDetailed: () => import('./sections/servicesDetailed.js'),
    caseStudies: () => import('./sections/caseStudies.js'),
    industries: () => import('./sections/industries.js'),
    bookCall: () => import('./sections/bookCall.js'),
    leadMagnet: () => import('./sections/leadMagnet.js'),
  });
}
