/* ============================================
   SECTION RENDERER - Motor de renderizado de bloques
   
   Responsabilidades:
   - Map type → función renderer
   - Validación defensiva de props
   - Fallback en errores
   - Lazy loading de imágenes
   - Integración con blockRegistry
   
   Tipos soportados:
   - hero, richText, servicesGrid, listingsGrid
   - testimonials, gallery, faq, contactForm
   - hours, callToAction, map, socialLinks, banner
   
   Uso:
   import { renderSection } from './sectionRenderer.js';
   const html = renderSection(section, clientId);
   ============================================ */

import { BLOCK_REGISTRY } from "./blockRegistry.js";

// ===== CONFIGURACIÓN =====
// Inicializar renderizadores desde blockRegistry
const SECTION_RENDERERS = {};

async function initRenderers() {
  // Registrar todos los renderizadores desde blockRegistry
  if (BLOCK_REGISTRY && typeof BLOCK_REGISTRY === 'object') {
    Object.entries(BLOCK_REGISTRY).forEach(([type, block]) => {
      if (block.render && typeof block.render === 'function') {
        SECTION_RENDERERS[type] = (props, clientId) => block.render(props, clientId);
      }
    });
    log(`✓ Initialized ${Object.keys(SECTION_RENDERERS).length} block renderers from blockRegistry`);
  }
}

// Inicializar cuando módulo carga
initRenderers();

function isDebug() {
  return new URLSearchParams(window.location.search).get("debug") === "1";
}

function log(msg, data = null) {
  if (isDebug()) {
    console.log(`[SectionRenderer] ${msg}`, data || "");
  }
}

/**
 * Renderiza un error fallback cuando algo se rompe
 */
function renderErrorFallback(message) {
  console.error("[SectionRenderer]", message);
  return `
    <div class="section-error" style="
      padding: 20px;
      margin: 20px 0;
      background-color: #fee;
      border: 1px solid #f99;
      border-radius: 4px;
      color: #c33;
      font-size: 14px;
    ">
      ⚠️ Error renderizando sección: ${message}
    </div>
  `;
}

/**
 * Helpers para sanitización mínima
 */
function escapeHtml(text) {
  if (!text) return "";
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function getImageUrl(url) {
  if (!url) return "";
  // Si es Cloudinary, aplicar transformación
  if (url.includes("cloudinary.com")) {
    return url.replace("/upload/", "/upload/w_800,f_auto,q_auto,c_fill,g_auto/");
  }
  return url;
}

// ===== RENDERERS POR TIPO =====

/**
 * Hero: banner principal con título, subtítulo e imagen
 */
function renderHero(props = {}) {
  try {
    const {
      title = "Bienvenido",
      subtitle = "",
      bgImage = null,
      cta = null // { text: string, link: string }
    } = props;

    const bgStyle = bgImage
      ? `background-image: url('${getImageUrl(bgImage)}');`
      : "";

    let ctaHtml = "";
    if (cta && cta.text && cta.link) {
      ctaHtml = `
        <a href="${escapeHtml(cta.link)}" class="btn btn-primary" style="display: inline-block; margin-top: 20px;">
          ${escapeHtml(cta.text)}
        </a>
      `;
    }

    return `
      <section class="section-hero" style="
        padding: 80px 20px;
        text-align: center;
        background-size: cover;
        background-position: center;
        ${bgStyle}
        background-color: #f5f5f5;
      ">
        <div class="container" style="max-width: 800px; margin: 0 auto;">
          <h1 style="font-size: 48px; margin-bottom: 10px;">
            ${escapeHtml(title)}
          </h1>
          ${subtitle ? `<p style="font-size: 18px; color: #666; margin-bottom: 20px;">${escapeHtml(subtitle)}</p>` : ""}
          ${ctaHtml}
        </div>
      </section>
    `;
  } catch (err) {
    return renderErrorFallback(`renderHero: ${err.message}`);
  }
}

/**
 * Texto rico con HTML
 */
function renderRichText(props = {}) {
  try {
    const { html = "", alignment = "left" } = props;

    // Aquí idealmente sanitizarías con DOMPurify, pero por ahora asumimos content trusted
    return `
      <section class="section-richtext" style="padding: 40px 20px; text-align: ${alignment};">
        <div class="container" style="max-width: 900px; margin: 0 auto;">
          ${html}
        </div>
      </section>
    `;
  } catch (err) {
    return renderErrorFallback(`renderRichText: ${err.message}`);
  }
}

/**
 * Grilla de servicios (items estáticos)
 */
function renderServicesGrid(props = {}) {
  try {
    const { items = [], columns = 3 } = props;

    if (!Array.isArray(items) || items.length === 0) {
      return "";
    }

    const colWidth = 100 / columns;
    const itemsHtml = items
      .map(item => `
        <div style="
          flex: 0 0 ${colWidth}%;
          padding: 20px;
          box-sizing: border-box;
        ">
          ${item.icon ? `<div style="font-size: 48px; margin-bottom: 10px;">${item.icon}</div>` : ""}
          <h3 style="margin-bottom: 10px;">${escapeHtml(item.title || "")}</h3>
          <p style="color: #666;">${escapeHtml(item.description || "")}</p>
        </div>
      `)
      .join("");

    return `
      <section class="section-services-grid" style="padding: 40px 20px;">
        <div class="container" style="max-width: 1200px; margin: 0 auto;">
          <div style="display: flex; flex-wrap: wrap; margin: -20px;">
            ${itemsHtml}
          </div>
        </div>
      </section>
    `;
  } catch (err) {
    return renderErrorFallback(`renderServicesGrid: ${err.message}`);
  }
}

/**
 * Grilla de listings dinámicos (vehículos, servicios, etc.)
 * OJO: Este renderer es ASYNC pero aquí lo hacemos sync, se debe llamar diferente
 */
function renderListingsGrid(props = {}) {
  try {
    const { collectionPath = "", filters = {}, columns = 3 } = props;

    if (!collectionPath) {
      return renderErrorFallback("renderListingsGrid: collectionPath requerido");
    }

    // Este renderer es especial porque necesita cargar datos dinámicamente
    // Se verá implementado en una versión mejorada con async/await en el page router
    return `
      <section class="section-listings-grid" data-type="listingsGrid" data-collection="${collectionPath}" style="padding: 40px 20px;">
        <div class="container" style="max-width: 1200px; margin: 0 auto;">
          <div id="listings-container" style="
            display: grid;
            grid-template-columns: repeat(${columns}, 1fr);
            gap: 20px;
          ">
            <!-- Se carga dinámicamente JavaScript -->
          </div>
        </div>
      </section>
    `;
  } catch (err) {
    return renderErrorFallback(`renderListingsGrid: ${err.message}`);
  }
}

/**
 * Testimonios
 */
function renderTestimonials(props = {}) {
  try {
    const { items = [], layout = "slider" } = props;

    if (!Array.isArray(items) || items.length === 0) {
      return "";
    }

    const itemsHtml = items
      .map(item => `
        <div style="
          padding: 30px;
          background-color: #f9f9f9;
          border-radius: 8px;
          margin: 10px;
          flex: 0 0 calc(33.333% - 20px);
          box-sizing: border-box;
        ">
          <p style="font-style: italic; margin-bottom: 20px; color: #666;">
            "${escapeHtml(item.text || "")}"
          </p>
          <p style="font-weight: bold;">
            — ${escapeHtml(item.author || "Anónimo")}
          </p>
          ${item.role ? `<p style="font-size: 14px; color: #999;">${escapeHtml(item.role)}</p>` : ""}
        </div>
      `)
      .join("");

    return `
      <section class="section-testimonials" style="padding: 40px 20px; background-color: #fafafa;">
        <div class="container" style="max-width: 1200px; margin: 0 auto;">
          <h2 style="text-align: center; margin-bottom: 40px;">Lo que dicen nuestros clientes</h2>
          <div style="display: flex; flex-wrap: wrap; margin: -10px;">
            ${itemsHtml}
          </div>
        </div>
      </section>
    `;
  } catch (err) {
    return renderErrorFallback(`renderTestimonials: ${err.message}`);
  }
}

/**
 * FAQ
 */
function renderFaq(props = {}) {
  try {
    const { items = [] } = props;

    if (!Array.isArray(items) || items.length === 0) {
      return "";
    }

    const itemsHtml = items
      .map((item, idx) => `
        <details style="margin-bottom: 20px; border: 1px solid #ddd; border-radius: 4px; padding: 15px;">
          <summary style="cursor: pointer; font-weight: bold; user-select: none;">
            ${escapeHtml(item.question || "")}
          </summary>
          <p style="margin-top: 15px; color: #666;">
            ${escapeHtml(item.answer || "")}
          </p>
        </details>
      `)
      .join("");

    return `
      <section class="section-faq" style="padding: 40px 20px;">
        <div class="container" style="max-width: 800px; margin: 0 auto;">
          <h2 style="text-align: center; margin-bottom: 40px;">Preguntas Frecuentes</h2>
          ${itemsHtml}
        </div>
      </section>
    `;
  } catch (err) {
    return renderErrorFallback(`renderFaq: ${err.message}`);
  }
}

/**
 * Galería de imágenes
 */
function renderGallery(props = {}) {
  try {
    const { items = [], columns = 3 } = props;

    if (!Array.isArray(items) || items.length === 0) {
      return "";
    }

    const itemsHtml = items
      .map(item => `
        <figure style="
          overflow: hidden;
          border-radius: 8px;
          aspect-ratio: 1 / 1;
          cursor: pointer;
        ">
          <img
            src="${getImageUrl(item.url)}"
            alt="${escapeHtml(item.alt || "Gallery item")}"
            loading="lazy"
            style="
              width: 100%;
              height: 100%;
              object-fit: cover;
              display: block;
            "
          />
        </figure>
      `)
      .join("");

    return `
      <section class="section-gallery" style="padding: 40px 20px;">
        <div class="container" style="max-width: 1200px; margin: 0 auto;">
          <div style="
            display: grid;
            grid-template-columns: repeat(${columns}, 1fr);
            gap: 16px;
          ">
            ${itemsHtml}
          </div>
        </div>
      </section>
    `;
  } catch (err) {
    return renderErrorFallback(`renderGallery: ${err.message}`);
  }
}

/**
 * Horarios
 */
function renderHours(props = {}) {
  try {
    const { schedule = [] } = props;

    if (!Array.isArray(schedule) || schedule.length === 0) {
      return "";
    }

    const itemsHtml = schedule
      .map(item => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">
            ${escapeHtml(item.day || "")}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            ${escapeHtml(item.hours || "Cerrado")}
          </td>
        </tr>
      `)
      .join("");

    return `
      <section class="section-hours" style="padding: 40px 20px;">
        <div class="container" style="max-width: 600px; margin: 0 auto;">
          <h2 style="text-align: center; margin-bottom: 30px;">Horarios</h2>
          <table style="width: 100%; border-collapse: collapse;">
            ${itemsHtml}
          </table>
        </div>
      </section>
    `;
  } catch (err) {
    return renderErrorFallback(`renderHours: ${err.message}`);
  }
}

/**
 * Call to Action
 */
function renderCallToAction(props = {}) {
  try {
    const {
      text = "Contactanos",
      link = "#",
      style = "primary",
      backgroundColor = "#E50914"
    } = props;

    return `
      <section class="section-cta" style="
        padding: 60px 20px;
        background-color: ${backgroundColor};
        color: white;
        text-align: center;
      ">
        <div class="container" style="max-width: 600px; margin: 0 auto;">
          <a href="${escapeHtml(link)}" class="btn btn-${style}" style="
            display: inline-block;
            padding: 15px 40px;
            font-size: 16px;
            font-weight: bold;
            background-color: white;
            color: ${backgroundColor};
            text-decoration: none;
            border-radius: 4px;
            transition: all 0.3s ease;
          ">
            ${escapeHtml(text)}
          </a>
        </div>
      </section>
    `;
  } catch (err) {
    return renderErrorFallback(`renderCallToAction: ${err.message}`);
  }
}

/**
 * Mapa embebido (Google Maps)
 */
function renderMap(props = {}) {
  try {
    const {
      address = "Buenos Aires, Argentina",
      embedUrl = null
    } = props;

    if (!embedUrl) {
      return renderErrorFallback("renderMap: embedUrl requerida");
    }

    return `
      <section class="section-map" style="padding: 40px 20px;">
        <div class="container" style="max-width: 1200px; margin: 0 auto;">
          <iframe
            src="${embedUrl}"
            width="100%"
            height="450"
            style="border: 0; border-radius: 8px;"
            allowfullscreen=""
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            title="Mapa de ubicación"
          ></iframe>
        </div>
      </section>
    `;
  } catch (err) {
    return renderErrorFallback(`renderMap: ${err.message}`);
  }
}

/**
 * Enlaces a redes sociales
 */
function renderSocialLinks(props = {}) {
  try {
    const { links = [] } = props;

    if (!Array.isArray(links) || links.length === 0) {
      return "";
    }

    const iconsMap = {
      instagram: "📷",
      facebook: "👍",
      linkedin: "💼",
      twitter: "🐦",
      whatsapp: "💬",
      youtube: "🎥",
      tiktok: "🎵"
    };

    const itemsHtml = links
      .map(link => {
        const icon = iconsMap[link.name?.toLowerCase()] || "🔗";
        return `
          <a
            href="${escapeHtml(link.url)}"
            target="_blank"
            rel="noopener noreferrer"
            style="
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 50px;
              height: 50px;
              background-color: #f0f0f0;
              border-radius: 50%;
              text-decoration: none;
              font-size: 24px;
              margin: 10px;
              transition: all 0.3s ease;
            "
            title="${escapeHtml(link.name)}"
          >
            ${icon}
          </a>
        `;
      })
      .join("");

    return `
      <section class="section-social-links" style="padding: 40px 20px; text-align: center;">
        <div class="container">
          ${itemsHtml}
        </div>
      </section>
    `;
  } catch (err) {
    return renderErrorFallback(`renderSocialLinks: ${err.message}`);
  }
}

/**
 * Banner
 */
function renderBanner(props = {}) {
  try {
    const {
      text = "Anuncio importante",
      bgColor = "#E50914",
      textColor = "#FFFFFF",
      icon = "⚠️"
    } = props;

    return `
      <section class="section-banner" style="
        padding: 20px;
        background-color: ${bgColor};
        color: ${textColor};
        text-align: center;
      ">
        <div class="container">
          ${icon ? `<span style="font-size: 24px; margin-right: 10px;">${icon}</span>` : ""}
          <span>${escapeHtml(text)}</span>
        </div>
      </section>
    `;
  } catch (err) {
    return renderErrorFallback(`renderBanner: ${err.message}`);
  }
}

// ===== REGISTRO DE RENDERERS =====
SECTION_RENDERERS.hero = renderHero;
SECTION_RENDERERS.richText = renderRichText;
SECTION_RENDERERS.servicesGrid = renderServicesGrid;
SECTION_RENDERERS.listingsGrid = renderListingsGrid;
SECTION_RENDERERS.testimonials = renderTestimonials;
SECTION_RENDERERS.faq = renderFaq;
SECTION_RENDERERS.gallery = renderGallery;
SECTION_RENDERERS.hours = renderHours;
SECTION_RENDERERS.callToAction = renderCallToAction;
SECTION_RENDERERS.map = renderMap;
SECTION_RENDERERS.socialLinks = renderSocialLinks;
SECTION_RENDERERS.banner = renderBanner;

/**
 * Función principal: renderiza una sección
 * @param {object} section { id, type, props, ... }
 * @param {string} clientId
 * @returns {string} HTML de la sección
 */
export function renderSection(section, clientId = null) {
  if (!section) {
    return renderErrorFallback("Section object is null");
  }

  const { id, type, props } = section;

  if (!type) {
    return renderErrorFallback("Section type is missing");
  }

  const renderer = SECTION_RENDERERS[type];

  if (!renderer) {
    return renderErrorFallback(`Unknown section type: ${type}`);
  }

  log(`Rendering section: ${type} (${id})`);

  try {
    return renderer(props || {}, clientId);
  } catch (err) {
    return renderErrorFallback(`${type}: ${err.message}`);
  }
}

/**
 * Renderiza múltiples secciones
 */
export function renderSections(sections, clientId = null) {
  if (!Array.isArray(sections)) {
    return "";
  }

  return sections.map(s => renderSection(s, clientId)).join("");
}

// ===== EXPOSICIONES GLOBALES =====
window.renderSection = renderSection;
window.renderSections = renderSections;

log("Module loaded. Section renderer initialized.");
