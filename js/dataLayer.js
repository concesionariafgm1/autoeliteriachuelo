/* ============================================
   DATA LAYER - Central repository para datos multi-tenant
   
   Responsabilidades:
   - Resolver tenant (clientId) desde hostname
   - Cargar configuración pública
   - Cargar páginas por slug
   - Cargar listings con filtros
   - Caché inteligente con versionado
   
   Uso:
   import { getTenantId, getPublicSettings, getPage } from './dataLayer.js';
   
   const clientId = await getTenantId();
   const settings = await getPublicSettings(clientId);
   const page = await getPage(clientId, 'vehiculos');
   ============================================ */

import { db } from "./firebase.js";
import { doc, getDoc, collection, getDocs, query, where, orderBy, limit, QueryConstraint } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ===== CACHE GLOBAL =====
window.__DATA_LAYER_CACHE = {
  tenantId: null,
  settings: {},
  pages: {},
  listings: {},
  expirations: {} // Versionado simple: { key: timestamp }
};

const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

function isDebug() {
  return new URLSearchParams(window.location.search).get("debug") === "1";
}

function log(msg, data = null) {
  if (isDebug()) {
    console.log(`[DataLayer] ${msg}`, data || "");
  }
}

function error(msg, err = null) {
  console.error(`[DataLayer] ${msg}`, err || "");
}

/**
 * Valida si caché aún es válido
 */
function isCacheValid(key) {
  const expiration = window.__DATA_LAYER_CACHE.expirations[key];
  if (!expiration) return false;
  return Date.now() < expiration;
}

/**
 * Invalida caché de un tenant (útil después de ediciones)
 */
export function invalidateTenantCache(clientId) {
  delete window.__DATA_LAYER_CACHE.settings[clientId];
  delete window.__DATA_LAYER_CACHE.pages[clientId];
  delete window.__DATA_LAYER_CACHE.listings[clientId];
  
  Object.keys(window.__DATA_LAYER_CACHE.expirations).forEach(key => {
    if (key.includes(clientId)) {
      delete window.__DATA_LAYER_CACHE.expirations[key];
    }
  });
  
  log("❌ Cache invalidated for tenant:", clientId);
}

/**
 * Obtiene el tenant ID (clientId) del hostname actual
 * Usa la función de tenant.js que ya existe
 */
export async function getTenantId() {
  if (window.__DATA_LAYER_CACHE.tenantId) {
    return window.__DATA_LAYER_CACHE.tenantId;
  }

  try {
    // usar window.resolveClientId que ya está disponible desde tenant.js
    if (typeof window.resolveClientId === "function") {
      const clientId = await window.resolveClientId();
      if (clientId) {
        window.__DATA_LAYER_CACHE.tenantId = clientId;
        log("✓ Tenant resolved:", clientId);
        return clientId;
      }
    }
  } catch (err) {
    error("Failed to resolve tenant ID", err);
  }

  return null;
}

/**
 * Carga configuración pública de un tenant
 * Ruta: clients/{clientId}/settings/public
 */
export async function getPublicSettings(clientId) {
  if (!clientId) {
    error("getPublicSettings called with empty clientId");
    return null;
  }

  const cacheKey = `settings-${clientId}`;

  // Verificar caché
  if (window.__DATA_LAYER_CACHE.settings[clientId] && isCacheValid(cacheKey)) {
    log("📦 Settings from cache:", clientId);
    return window.__DATA_LAYER_CACHE.settings[clientId];
  }

  try {
    const settingsRef = doc(db, "clients", clientId, "settings", "public");
    const settingsDoc = await getDoc(settingsRef);

    if (settingsDoc.exists()) {
      const settings = settingsDoc.data();
      window.__DATA_LAYER_CACHE.settings[clientId] = settings;
      window.__DATA_LAYER_CACHE.expirations[cacheKey] = Date.now() + CACHE_TTL;
      log("✓ Settings loaded:", clientId);
      return settings;
    } else {
      log("⚠️ Settings not found for:", clientId);
      return null;
    }
  } catch (err) {
    error(`Failed to load settings for ${clientId}`, err);
    return null;
  }
}

/**
 * Carga una página por slug
 * Ruta: clients/{clientId}/pages/{slug}
 * Solo retorna si status === 'published'
 */
export async function getPage(clientId, slug) {
  if (!clientId || !slug) {
    error("getPage called with missing clientId or slug");
    return null;
  }

  const cacheKey = `page-${clientId}-${slug}`;

  // Verificar caché
  if (window.__DATA_LAYER_CACHE.pages[clientId]?.[slug] && isCacheValid(cacheKey)) {
    log(`📦 Page from cache: ${slug}`);
    return window.__DATA_LAYER_CACHE.pages[clientId][slug];
  }

  try {
    const pageRef = doc(db, "clients", clientId, "pages", slug);
    const pageDoc = await getDoc(pageRef);

    if (pageDoc.exists()) {
      const page = pageDoc.data();
      
      // Solo retornar si está publicada
      if (page.status !== "published") {
        log(`⚠️ Page not published: ${slug}`);
        return null;
      }

      // Guardar en caché
      if (!window.__DATA_LAYER_CACHE.pages[clientId]) {
        window.__DATA_LAYER_CACHE.pages[clientId] = {};
      }
      window.__DATA_LAYER_CACHE.pages[clientId][slug] = page;
      window.__DATA_LAYER_CACHE.expirations[cacheKey] = Date.now() + CACHE_TTL;

      log(`✓ Page loaded: ${slug}`);
      return page;
    } else {
      log(`❌ Page not found: ${slug}`);
      return null;
    }
  } catch (err) {
    error(`Failed to load page ${slug}`, err);
    return null;
  }
}

/**
 * Carga listings (productos genéricos: vehículos, servicios, etc.)
 * Ruta: clients/{clientId}/content/listings
 * 
 * @param {string} clientId
 * @param {object} options
 *   - filters: { category: "vehicles", status: "published" }
 *   - sort: { field: "createdAt", direction: "desc" }
 *   - limitTo: 12
 * @returns {Array}
 */
export async function getListings(clientId, options = {}) {
  if (!clientId) {
    error("getListings called with empty clientId");
    return [];
  }

  const {
    filters = {},
    sort = { field: "createdAt", direction: "desc" },
    limitTo = 12
  } = options;

  // Generar clave de caché basada en parámetros
  const filterKey = Object.entries(filters)
    .sort()
    .map(([k, v]) => `${k}=${v}`)
    .join("|");
  const cacheKey = `listings-${clientId}-${filterKey}-${sort.field}`;

  // Verificar caché
  if (window.__DATA_LAYER_CACHE.listings[cacheKey] && isCacheValid(cacheKey)) {
    log(`📦 Listings from cache (${window.__DATA_LAYER_CACHE.listings[cacheKey].length} items)`);
    return window.__DATA_LAYER_CACHE.listings[cacheKey];
  }

  try {
    const listingsRef = collection(db, "clients", clientId, "content", "listings");
    
    // Construir constraints dinámicamente
    const constraints = [];
    
    // Siempre filtrar por status = published
    constraints.push(where("status", "==", "published"));
    
    // Agregar filtros adicionales
    Object.entries(filters).forEach(([field, value]) => {
      if (value !== undefined && value !== null) {
        constraints.push(where(field, "==", value));
      }
    });
    
    // Agregar ordenamiento
    constraints.push(orderBy(sort.field, sort.direction === "desc" ? "desc" : "asc"));
    
    // Limitar resultados
    constraints.push(limit(limitTo));
    
    const q = query(listingsRef, ...constraints);
    const snapshot = await getDocs(q);
    
    const listings = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Guardar en caché
    window.__DATA_LAYER_CACHE.listings[cacheKey] = listings;
    window.__DATA_LAYER_CACHE.expirations[cacheKey] = Date.now() + CACHE_TTL;

    log(`✓ Loaded ${listings.length} listings`);
    return listings;
  } catch (err) {
    error("Failed to load listings", err);
    return [];
  }
}

/**
 * Envía un lead (formulario de contacto) a Firestore
 * Crea un documento en clients/{clientId}/leads
 * 
 * @param {string} clientId
 * @param {object} leadData { name, email, message, phone?, ... }
 * @returns {Promise<string>} leadId del documento creado
 */
export async function submitLead(clientId, leadData) {
  if (!clientId) {
    error("submitLead called with empty clientId");
    return null;
  }

  try {
    // Aquí implementaremos más adelante la lógica de creación
    // Por ahora es un placeholder
    log("Lead submitted (not yet implemented in dataLayer)", leadData);
    return null;
  } catch (err) {
    error("Failed to submit lead", err);
    return null;
  }
}

/**
 * Carga un listing específico por ID
 * Ruta: clients/{clientId}/content/listings/{listingId}
 */
export async function getListing(clientId, listingId) {
  if (!clientId || !listingId) {
    error("getListing called with missing clientId or listingId");
    return null;
  }

  const cacheKey = `listing-${clientId}-${listingId}`;

  // Verificar caché
  if (window.__DATA_LAYER_CACHE.listings[cacheKey] && isCacheValid(cacheKey)) {
    log(`📦 Listing from cache: ${listingId}`);
    return window.__DATA_LAYER_CACHE.listings[cacheKey];
  }

  try {
    const listingRef = doc(db, "clients", clientId, "content", "listings", listingId);
    const listingDoc = await getDoc(listingRef);

    if (listingDoc.exists()) {
      const listing = {
        id: listingDoc.id,
        ...listingDoc.data()
      };

      // Guardar en caché
      window.__DATA_LAYER_CACHE.listings[cacheKey] = listing;
      window.__DATA_LAYER_CACHE.expirations[cacheKey] = Date.now() + CACHE_TTL;

      log(`✓ Listing loaded: ${listingId}`);
      return listing;
    } else {
      log(`❌ Listing not found: ${listingId}`);
      return null;
    }
  } catch (err) {
    error(`Failed to load listing ${listingId}`, err);
    return null;
  }
}

/**
 * Obtiene la lista de páginas publicadas (para nav, sitemap, etc.)
 * Retorna array de { slug, label, order, showInNav }
 */
export async function getPublishedPages(clientId) {
  if (!clientId) {
    error("getPublishedPages called with empty clientId");
    return [];
  }

  const cacheKey = `all-pages-${clientId}`;

  // Verificar caché
  if (window.__DATA_LAYER_CACHE.pages[clientId] && isCacheValid(cacheKey)) {
    const pages = Object.values(window.__DATA_LAYER_CACHE.pages[clientId]);
    log(`📦 Pages from cache (${pages.length} pages)`);
    return pages;
  }

  try {
    const pagesRef = collection(db, "clients", clientId, "pages");
    const q = query(
      pagesRef,
      where("status", "==", "published"),
      orderBy("nav.order", "asc")
    );
    const snapshot = await getDocs(q);

    const pages = snapshot.docs.map(doc => ({
      slug: doc.id,
      ...doc.data()
    }));

    // Guardar en caché cada página
    pages.forEach(page => {
      if (!window.__DATA_LAYER_CACHE.pages[clientId]) {
        window.__DATA_LAYER_CACHE.pages[clientId] = {};
      }
      window.__DATA_LAYER_CACHE.pages[clientId][page.slug] = page;
    });

    const pagesCacheKey = `all-pages-${clientId}`;
    window.__DATA_LAYER_CACHE.expirations[pagesCacheKey] = Date.now() + CACHE_TTL;

    log(`✓ Loaded ${pages.length} published pages`);
    return pages;
  } catch (err) {
    error("Failed to load published pages", err);
    return [];
  }
}

/**
 * Obtiene una página publicada por slug (SPRINT 1)
 * Optimizado para rendering público: solo retorna páginas publicadas
 *
 * @param {string} clientId - ID del cliente
 * @param {string} slug - Slug de la página (ej: "home", "catalogo")
 * @returns {Promise<Object|null>} - Página con secciones o null si no existe
 *
 * @example
 * const page = await getPagePublished('autoelite', 'home');
 * // { id, slug, title, status: 'published', sections: [...], metadata: {...} }
 */
export async function getPagePublished(clientId, slug) {
  if (!clientId || !slug) {
    log("⚠️ getPagePublished called with missing params:", { clientId, slug });
    return null;
  }

  // Intenta caché primero
  const cacheKey = `page-published-${clientId}-${slug}`;
  if (isCacheValid(cacheKey)) {
    const cached = window.__DATA_LAYER_CACHE.pages[clientId]?.[slug];
    if (cached) {
      log(`✓ getPagePublished cache HIT:`, { clientId, slug });
      return cached;
    }
  }

  try {
    const pageRef = doc(db, "clients", clientId, "pages", slug);
    const snapshot = await getDoc(pageRef);

    if (!snapshot.exists()) {
      log(`⚠️ getPagePublished not found:`, { clientId, slug });
      window.__DATA_LAYER_CACHE.expirations[cacheKey] = Date.now() + CACHE_TTL;
      return null;
    }

    const pageData = snapshot.data();

    // Solo retornar si está publicada
    if (pageData.status !== "published") {
      log(`⚠️ getPagePublished not published:`, { clientId, slug, status: pageData.status });
      return null;
    }

    // Estandarizar estructura retornada
    const page = {
      id: slug,
      slug: slug,
      ...pageData
    };

    // Guardar en caché
    if (!window.__DATA_LAYER_CACHE.pages[clientId]) {
      window.__DATA_LAYER_CACHE.pages[clientId] = {};
    }
    window.__DATA_LAYER_CACHE.pages[clientId][slug] = page;
    window.__DATA_LAYER_CACHE.expirations[cacheKey] = Date.now() + CACHE_TTL;

    log(`✓ getPagePublished cache MISS (loaded):`, { clientId, slug, sections: page.sections?.length || 0 });
    return page;
  } catch (err) {
    error(`getPagePublished failed for ${clientId}/${slug}`, err);
    return null;
  }
}

// ===== EXPOSICIONES GLOBALES =====
// Para compatibilidad con código no-módulo
window.getTenantId = getTenantId;
window.getPublicSettings = getPublicSettings;
window.getPage = getPage;
window.getListings = getListings;
window.getListing = getListing;
window.getPublishedPages = getPublishedPages;
window.getPagePublished = getPagePublished;
window.invalidateTenantCache = invalidateTenantCache;

log("Module loaded. Data layer initialized.");
