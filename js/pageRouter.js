/* ============================================
   PAGE ROUTER - Enrutador dinámico por slug
   
   Responsabilidades:
   - Capturar slug desde URL
   - Cargar página dinámicamente
   - Aplicar meta tags (title, description, OG)
   - Renderizar secciones
   - Manejar errores y 404
   - Soportar fallback a páginas estáticas
   
   Uso:
   import { initPageRouter } from './pageRouter.js';
   await initPageRouter();
   ============================================ */

import { getTenantId, getPublicSettings, getPagePublished, getListings } from "./dataLayer.js";
import { renderSection, renderSections } from "./sectionRenderer.js";

function isDebug() {
  return new URLSearchParams(window.location.search).get("debug") === "1";
}

function log(msg, data = null) {
  if (isDebug()) {
    console.log(`[PageRouter] ${msg}`, data || "");
  }
}

function error(msg, err = null) {
  console.error(`[PageRouter] ${msg}`, err || "");
}

/**
 * Extrae el slug actual desde la URL
 * /vehiculos → "vehiculos"
 * / → "home"
 * /productos/detalles → "productos" (slug principal, no nested)
 */
function extractSlugFromUrl() {
  const path = window.location.pathname;
  
  // Si es raíz, devolver "home"
  if (path === "/" || path === "") {
    return "home";
  }

  // Remover slashes y tomar la primera parte
  const parts = path.split("/").filter(p => p.length > 0);
  return parts[0] || "home";
}

/**
 * Aplica meta tags a la página
 */
function applyMetaTags(page, settings) {
  const title = page.meta?.title || "Sitio";
  const description = page.meta?.description || "";
  const ogImage = page.meta?.ogImage || (settings?.logo || "");

  // Title
  document.title = title;

  // Meta description
  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement("meta");
    metaDesc.name = "description";
    document.head.appendChild(metaDesc);
  }
  metaDesc.content = description;

  // Open Graph
  const ogTags = [
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: ogImage }
  ];

  ogTags.forEach(tag => {
    let el = document.querySelector(`meta[property="${tag.property}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("property", tag.property);
      document.head.appendChild(el);
    }
    el.content = tag.content;
  });

  log(`✓ Meta tags applied for:`, { title, description });
}

/**
 * Renderiza una sección listingsGrid cargando datos dinámicamente
 */
async function renderListingsGridSection(section, clientId) {
  try {
    const { collectionPath, filters = {}, sort = {}, columns = 3 } = section.props || {};

    if (!collectionPath) {
      return `<div class="section-error">Listings grid: collectionPath missing</div>`;
    }

    // Cargar listings
    const listings = await getListings(clientId, {
      filters,
      sort: sort.field ? sort : { field: "createdAt", direction: "desc" },
      limitTo: 12
    });

    if (!Array.isArray(listings) || listings.length === 0) {
      return `
        <section class="section-listings-grid" style="padding: 40px 20px;">
          <div class="container">
            <p style="text-align: center; color: #999;">
              No hay elementos disponibles en este momento.
            </p>
          </div>
        </section>
      `;
    }

    // Renderizar cada listing como card
    const cardsHtml = listings
      .map(listing => renderListingCard(listing))
      .join("");

    const colWidth = 100 / columns;

    return `
      <section class="section-listings-grid" style="padding: 40px 20px;">
        <div class="container" style="max-width: 1200px; margin: 0 auto;">
          <div style="
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
          ">
            ${cardsHtml}
          </div>
        </div>
      </section>
    `;
  } catch (err) {
    error("Error rendering listingsGrid section", err);
    return `<div class="section-error">Error cargando listados: ${err.message}</div>`;
  }
}

/**
 * Renderiza una card de listing (genérica)
 */
function renderListingCard(listing) {
  const {
    id = "",
    title = "Sin título",
    subtitle = "",
    description = "",
    price = null,
    mainImage = null,
    media = []
  } = listing;

  const imageUrl = mainImage || (Array.isArray(media) && media[0]?.url) || "https://via.placeholder.com/300x200?text=Sin+imagen";
  const transformedImage = imageUrl.includes("cloudinary.com")
    ? imageUrl.replace("/upload/", "/upload/w_300,h_300,c_fill,f_auto,q_auto/")
    : imageUrl;

  let priceHtml = "";
  if (price) {
    const formattedPrice = new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS"
    }).format(price);
    priceHtml = `<div style="font-size: 18px; font-weight: bold; color: #E50914; margin-top: 10px;">${formattedPrice}</div>`;
  }

  return `
    <div style="
      background-color: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
    ">
      <img
        src="${transformedImage}"
        alt="${title}"
        loading="lazy"
        style="
          width: 100%;
          height: 200px;
          object-fit: cover;
          display: block;
          background-color: #f0f0f0;
        "
      />
      <div style="padding: 15px;">
        <h3 style="margin: 0 0 5px 0; font-size: 16px;">
          ${title}
        </h3>
        ${subtitle ? `<p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">${subtitle}</p>` : ""}
        ${description ? `<p style="margin: 0 0 10px 0; color: #999; font-size: 13px; line-height: 1.4;">${description}</p>` : ""}
        ${priceHtml}
      </div>
    </div>
  `;
}

/**
 * Renderiza 404
 */
function render404(slug) {
  return `
    <section style="padding: 80px 20px; text-align: center;">
      <div class="container" style="max-width: 600px; margin: 0 auto;">
        <h1 style="font-size: 64px; margin-bottom: 20px;">404</h1>
        <p style="font-size: 18px; color: #666; margin-bottom: 30px;">
          La página no fue encontrada.
        </p>
        <a href="/" style="
          display: inline-block;
          padding: 12px 30px;
          background-color: #E50914;
          color: white;
          text-decoration: none;
          border-radius: 4px;
        ">
          Volver al inicio
        </a>
      </div>
    </section>
  `;
}

/**
 * Renderiza una página completa
 */
async function renderPage(page, clientId, settings) {
  try {
    // Aplicar meta tags
    applyMetaTags(page, settings);

    // Contenedor principal
    const pageContainer = document.getElementById("pageContent");
    if (!pageContainer) {
      error("Element #pageContent not found in HTML");
      return;
    }

    // Renderizar secciones
    let pageHtml = "";

    if (Array.isArray(page.sections)) {
      for (const section of page.sections) {
        try {
          // Si es listingsGrid, renderizar async
          if (section.type === "listingsGrid") {
            const html = await renderListingsGridSection(section, clientId);
            pageHtml += html;
          } else {
            // Otros tipos, renderizar sync
            pageHtml += renderSection(section, clientId);
          }
        } catch (sectionErr) {
          error(`Error rendering section ${section.id}`, sectionErr);
          pageHtml += `<div class="section-error">Error en sección: ${section.type}</div>`;
        }
      }
    }

    // Inyectar HTML
    pageContainer.innerHTML = pageHtml;

    log(`✓ Page rendered: ${page.slug}`);
  } catch (err) {
    error("Error rendering page", err);
    const pageContainer = document.getElementById("pageContent");
    if (pageContainer) {
      pageContainer.innerHTML = `<div class="section-error">Error renderizando página: ${err.message}</div>`;
    }
  }
}

/**
 * Inicializa el router
 * Debe ser llamada después del DOMContentLoaded
 */
export async function initPageRouter() {
  try {
    log("Initializing page router...");

    // Resolver tenant
    const clientId = await getTenantId();
    if (!clientId) {
      error("Could not resolve tenant ID");
      return;
    }

    // Cargar configuración
    const settings = await getPublicSettings(clientId);
    if (!settings) {
      error("Could not load public settings");
      return;
    }

    // Extraer slug
    const slug = extractSlugFromUrl();
    log(`Page slug: ${slug}`);

    // Cargar página publicada (SPRINT 1)
    let page = await getPagePublished(clientId, slug);

    if (!page) {
      // Fallback a HTML estático (no romper sistema actual)
      log(`⚠️ Page not found in Firestore: ${slug}. Attempting fallback to static HTML...`);
      
      // Si es home, podrían no tener document en Firestore, mostrar 404 gracefully
      const pageContainer = document.getElementById("pageContent");
      if (pageContainer) {
        pageContainer.innerHTML = `
          <div style="padding: 40px 20px; text-align: center; max-width: 800px; margin: 0 auto;">
            <h1 style="color: #333; margin-bottom: 10px;">Página en construcción</h1>
            <p style="color: #666; margin-bottom: 20px;">La página <strong>'${slug}'</strong> aún no está disponible.</p>
            <p style="color: #999;">Si es administrador, cree el documento <code>pages/${slug}</code> en Firestore.</p>
            <a href="/" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: #007BFF; color: white; text-decoration: none; border-radius: 4px;">Volver a Inicio</a>
          </div>
        `;
      }
      log(`✓ Fallback displayed for missing page: ${slug}`);
      return;
    }

    // Renderizar
    await renderPage(page, clientId, settings);

  } catch (err) {
    error("Critical error in initPageRouter", err);
  }
}

/**
 * Hook para re-renderizar cuando sea necesario (admin edita página)
 */
export async function reloadCurrentPage() {
  try {
    log("Reloading page...");
    await initPageRouter();
  } catch (err) {
    error("Error reloading page", err);
  }
}

// ===== EXPOSICIONES GLOBALES =====
window.initPageRouter = initPageRouter;
window.reloadCurrentPage = reloadCurrentPage;
window.extractSlugFromUrl = extractSlugFromUrl;

log("Module loaded. Page router ready.");
