import { registerSections } from '../../registry.js';

export function registerVehiclesPack() {
  registerSections({
    featuredVehicles: () => import('./sections/featuredVehicles.js'),
  });
}
