/* ============================================
   TENANT.JS - Single-site mode (1 cliente = 1 web)

   Mantiene las mismas funciones públicas para no romper imports,
   pero ahora resuelve el clientId desde config/site.js (window.SITE_CLIENT_ID).

   También conserva loadTenantPublicSettings() para permitir que el admin
   guarde configuración en Firestore: clients/{clientId}/settings/public.
   ============================================ */

import { db } from "./firebase.js";
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ===== CACHE GLOBAL =====
window.__TENANT_CACHE = {
  promise: null,
  clientId: null
};

// ===== HELPER: DEBUG MODE =====
function isDebug() {
  return new URLSearchParams(window.location.search).get("debug") === "1";
}

// En single-site mode no mostramos banners de tenant.

/**
 * Resuelve clientId en modo single-site.
 * Prioridad:
 * 1) window.SITE_CLIENT_ID (config/site.js)
 * 2) ?client= (para pruebas rápidas)
 */
export async function resolveClientId() {
  try {
    // Opción 0: Si ya tenemos clientId resuelto, devolverlo
    if (window.__TENANT_CACHE.clientId !== null) {
      if (isDebug()) {
        console.log("[Tenant] Using cached clientId:", window.__TENANT_CACHE.clientId);
      }
      return window.__TENANT_CACHE.clientId;
    }

    // Si ya hay una promesa en vuelo, esperarla
    if (window.__TENANT_CACHE.promise !== null) {
      if (isDebug()) {
        console.log("[Tenant] Promise already in flight, awaiting...");
      }
      return await window.__TENANT_CACHE.promise;
    }

    // Crear la promesa que resuelve una sola vez
    const resolutionPromise = (async () => {
      // Opción 1: window.SITE_CLIENT_ID (single-site)
      if (window.SITE_CLIENT_ID) {
        window.__TENANT_CACHE.clientId = window.SITE_CLIENT_ID;
        return window.SITE_CLIENT_ID;
      }

      // Opción 2: ?client= en URL (solo para pruebas)
      const params = new URLSearchParams(window.location.search);
      const queryClient = params.get('client');
      if (queryClient) {
        if (isDebug()) {
          console.log("[Tenant] Resolved from query param: ?client=", queryClient);
        }
        window.__TENANT_CACHE.clientId = queryClient;
        return queryClient;
      }

      // No hay clientId configurado
      if (isDebug()) {
        console.warn("[Tenant] No SITE_CLIENT_ID configured. Set it in config/site.js");
      }
      window.__TENANT_CACHE.clientId = null;
      return null;
    })();

    // Guardar la promesa para evitar doble resolución
    window.__TENANT_CACHE.promise = resolutionPromise;
    const result = await resolutionPromise;
    
    // Limpiar la promesa
    window.__TENANT_CACHE.promise = null;
    
    // Mantener compatibilidad con código legado
    window.RESOLVED_CLIENT_ID = result;
    
    return result;
  } catch (error) {
    console.error("[Tenant] Critical error in resolveClientId:", error);
    if (isDebug()) {
      console.error("[Tenant] Error details:", error?.name, error?.code, error?.message);
    }
    window.__TENANT_CACHE.clientId = null;
    window.__TENANT_CACHE.promise = null;
    return null;
  }
}

/**
 * Carga configuración pública de un tenant desde Firestore
 * Ruta: clients/{clientId}/settings/public
 * Retorna null si no existe
 */
export async function loadTenantPublicSettings(clientId) {
  if (!clientId) {
    if (isDebug()) {
      console.warn("[Tenant] loadTenantPublicSettings called with empty clientId");
    }
    return null;
  }

  try {
    const settingsDocRef = doc(db, 'clients', clientId, 'settings', 'public');
    const settingsDoc = await getDoc(settingsDocRef);

    if (settingsDoc.exists()) {
      const settings = settingsDoc.data();
      if (isDebug()) {
        console.log("[Tenant] Loaded public settings for clientId:", clientId, settings);
      }
      return settings;
    } else {
      if (isDebug()) {
        console.log("[Tenant] No public settings found for clientId: " + clientId + " (expected fallback)");
      }
      return null;
    }
  } catch (error) {
    console.error("[Tenant] Error loading public settings for clientId: " + clientId, error);
    return null;
  }
}

// ===== EXPOSICIONES GLOBALES =====
// Exponer funciones para que código no-módulo pueda usarlas
window.resolveClientId = resolveClientId;
window.loadTenantPublicSettings = loadTenantPublicSettings;
window.isDebug = isDebug;

console.log("[Tenant] Module loaded. Cache and helpers initialized.");
