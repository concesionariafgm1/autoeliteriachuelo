/* ============================================
   BLOCK REGISTRY - Registro central de tipos de bloques
   
   Define todos los tipos de secciones disponibles con:
   - Metadata (label, icon, description)
   - Schema (validación de props)
   - Renderer (función para generar HTML)
   
   Uso:
   import { BLOCK_REGISTRY, getAvailableBlocks, getBlockSchema } from './blockRegistry.js';
   
   const block = BLOCK_REGISTRY.hero;
   const html = block.render({ title: "...", ... });
   
   ============================================ */

// ===== HELPERS =====

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

function renderErrorFallback(message) {
  return `
    <div class="section-error" style="
      padding: 20px;
      margin: 20px 0;
      background-color: #fee;
      border: 1px solid #f99;
      border-radius: 4px;
      color: #c33;
      font-size: 14px;
      font-family: monospace;
    ">
      ⚠️ Error renderizando sección: ${escapeHtml(message)}
    </div>
  `;
}

function getImageUrl(url) {
  if (!url) return "";
  // Transformación Cloudinary
  if (url.includes("cloudinary.com")) {
    return url.replace("/upload/", "/upload/w_800,f_auto,q_auto,c_fill,g_auto/");
  }
  return url;
}

// ===== REGISTRY =====

export const BLOCK_REGISTRY = {
  
  // ===== HERO BANNER =====
  hero: {
    label: "Hero Banner",
    icon: "🎬",
    description: "Banner principal con título, subtítulo e imagen",
    category: "layout",
    
    schema: {
      title: { type: "string", required: true, label: "Título" },
      subtitle: { type: "string", label: "Subtítulo" },
      bgImage: { type: "assetId", label: "Imagen de fondo" },
      cta: {
        type: "object",
        label: "Botón CTA",
        properties: {
          text: { type: "string", label: "Texto del botón" },
          link: { type: "string", label: "URL" }
        }
      }
    },

    render: (props = {}) => {
      try {
        const {
          title = "Bienvenido",
          subtitle = "",
          bgImage = null,
          cta = null
        } = props;

        const bgStyle = bgImage
          ? `background-image: url('${getImageUrl(bgImage)}'); background-size: cover; background-position: center;`
          : "";

        let ctaHtml = "";
        if (cta && cta.text && cta.link) {
          ctaHtml = `
            <a href="${escapeHtml(cta.link)}" class="btn btn-primary" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #E50914; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
              ${escapeHtml(cta.text)}
            </a>
          `;
        }

        return `
          <section class="section-hero" style="
            padding: 100px 20px;
            text-align: center;
            background-color: #f5f5f5;
            color: #000;
            ${bgStyle}
          ">
            <div class="container" style="max-width: 800px; margin: 0 auto;">
              <h1 style="font-size: 48px; margin-bottom: 15px; font-weight: bold;">
                ${escapeHtml(title)}
              </h1>
              ${subtitle ? `<p style="font-size: 18px; color: #666; margin-bottom: 30px;">${escapeHtml(subtitle)}</p>` : ""}
              ${ctaHtml}
            </div>
          </section>
        `;
      } catch (err) {
        return renderErrorFallback(`hero render: ${err.message}`);
      }
    }
  },

  // ===== RICH TEXT =====
  richText: {
    label: "Texto Rico",
    icon: "📝",
    description: "Párrafos y contenido HTML",
    category: "content",

    schema: {
      html: { type: "string", required: true, label: "Contenido HTML" },
      alignment: { type: "string", default: "left", label: "Alineación", enum: ["left", "center", "right"] }
    },

    render: (props = {}) => {
      try {
        const { html = "", alignment = "left" } = props;
        
        return `
          <section class="section-richtext" style="padding: 40px 20px; text-align: ${alignment};">
            <div class="container" style="max-width: 900px; margin: 0 auto;">
              ${html}
            </div>
          </section>
        `;
      } catch (err) {
        return renderErrorFallback(`richText render: ${err.message}`);
      }
    }
  },

  // ===== SERVICES GRID =====
  servicesGrid: {
    label: "Grid de Servicios",
    icon: "🎯",
    description: "Mostrar servicios en grid",
    category: "content",

    schema: {
      title: { type: "string", label: "Título" },
      items: {
        type: "array",
        label: "Servicios",
        itemsSchema: {
          title: { type: "string", required: true },
          icon: { type: "string" },
          description: { type: "string" }
        }
      },
      columns: { type: "number", default: 3, min: 1, max: 4 }
    },

    render: (props = {}) => {
      try {
        const { title = "", items = [], columns = 3 } = props;

        if (!Array.isArray(items) || items.length === 0) {
          return renderErrorFallback("Services grid: items debe ser array no vacío");
        }

        const servicesHtml = items.map(item => `
          <div style="flex: 1; min-width: 200px; padding: 20px; text-align: center;">
            ${item.icon ? `<div style="font-size: 40px; margin-bottom: 10px;">${item.icon}</div>` : ""}
            <h3 style="margin-bottom: 10px;">${escapeHtml(item.title)}</h3>
            ${item.description ? `<p style="color: #666; font-size: 14px;">${escapeHtml(item.description)}</p>` : ""}
          </div>
        `).join("");

        return `
          <section class="section-services" style="padding: 40px 20px; background: #f9f9f9;">
            <div class="container" style="max-width: 1200px; margin: 0 auto;">
              ${title ? `<h2 style="text-align: center; margin-bottom: 40px;">${escapeHtml(title)}</h2>` : ""}
              <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                ${servicesHtml}
              </div>
            </div>
          </section>
        `;
      } catch (err) {
        return renderErrorFallback(`servicesGrid render: ${err.message}`);
      }
    }
  },

  // ===== TESTIMONIALS =====
  testimonials: {
    label: "Testimonios",
    icon: "💬",
    description: "Tarjetas de testimonios con foto y cita",
    category: "content",

    schema: {
      title: { type: "string", label: "Título" },
      items: {
        type: "array",
        label: "Testimonios",
        itemsSchema: {
          quote: { type: "string", required: true },
          author: { type: "string", required: true },
          role: { type: "string" },
          photo: { type: "assetId" }
        }
      },
      columns: { type: "number", default: 3, min: 1, max: 4 }
    },

    render: (props = {}) => {
      try {
        const { title = "", items = [], columns = 3 } = props;

        if (!Array.isArray(items) || items.length === 0) {
          return renderErrorFallback("Testimonials: items debe ser array no vacío");
        }

        const testimonialsHtml = items.map(item => `
          <div style="flex: 1; min-width: 250px; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <p style="font-style: italic; margin-bottom: 15px; color: #333;">"${escapeHtml(item.quote)}"</p>
            ${item.photo ? `<img src="${getImageUrl(item.photo)}" alt="${escapeHtml(item.author)}" style="width: 60px; height: 60px; border-radius: 50%; margin-bottom: 10px; object-fit: cover;">` : ""}
            <strong style="display: block;">${escapeHtml(item.author)}</strong>
            ${item.role ? `<small style="color: #666;">${escapeHtml(item.role)}</small>` : ""}
          </div>
        `).join("");

        return `
          <section class="section-testimonials" style="padding: 40px 20px;">
            <div class="container" style="max-width: 1200px; margin: 0 auto;">
              ${title ? `<h2 style="text-align: center; margin-bottom: 40px;">${escapeHtml(title)}</h2>` : ""}
              <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                ${testimonialsHtml}
              </div>
            </div>
          </section>
        `;
      } catch (err) {
        return renderErrorFallback(`testimonials render: ${err.message}`);
      }
    }
  },

  // ===== FAQ =====
  faq: {
    label: "Preguntas Frecuentes",
    icon: "❓",
    description: "Acordeón de FAQs",
    category: "content",

    schema: {
      title: { type: "string", label: "Título" },
      items: {
        type: "array",
        label: "Preguntas",
        itemsSchema: {
          question: { type: "string", required: true },
          answer: { type: "string", required: true }
        }
      }
    },

    render: (props = {}) => {
      try {
        const { title = "", items = [] } = props;

        if (!Array.isArray(items) || items.length === 0) {
          return renderErrorFallback("FAQ: items debe ser array no vacío");
        }

        const faqHtml = items.map((item, idx) => `
          <details style="border-bottom: 1px solid #eee; padding: 15px 0;">
            <summary style="cursor: pointer; font-weight: bold; padding: 10px 0;">${escapeHtml(item.question)}</summary>
            <div style="padding: 15px 0; color: #666;">${escapeHtml(item.answer)}</div>
          </details>
        `).join("");

        return `
          <section class="section-faq" style="padding: 40px 20px; background: #f9f9f9;">
            <div class="container" style="max-width: 900px; margin: 0 auto;">
              ${title ? `<h2 style="text-align: center; margin-bottom: 30px;">${escapeHtml(title)}</h2>` : ""}
              ${faqHtml}
            </div>
          </section>
        `;
      } catch (err) {
        return renderErrorFallback(`faq render: ${err.message}`);
      }
    }
  },

  // ===== CALL TO ACTION =====
  callToAction: {
    label: "Llamado a Acción",
    icon: "📢",
    description: "Banner destacado con botón",
    category: "layout",

    schema: {
      text: { type: "string", required: true, label: "Texto" },
      buttonText: { type: "string", required: true, label: "Texto del botón" },
      buttonLink: { type: "string", required: true, label: "URL del botón" },
      bgColor: { type: "string", default: "#E50914", label: "Color de fondo" }
    },

    render: (props = {}) => {
      try {
        const {
          text = "¿Listo para comenzar?",
          buttonText = "Comenzar",
          buttonLink = "/",
          bgColor = "#E50914"
        } = props;

        return `
          <section class="section-cta" style="
            padding: 60px 20px;
            background-color: ${bgColor};
            color: white;
            text-align: center;
          ">
            <div class="container" style="max-width: 600px; margin: 0 auto;">
              <h2 style="margin-bottom: 20px; font-size: 32px;">${escapeHtml(text)}</h2>
              <a href="${escapeHtml(buttonLink)}" class="btn btn-white" style="
                display: inline-block;
                padding: 14px 32px;
                background: white;
                color: ${bgColor};
                text-decoration: none;
                border-radius: 4px;
                font-weight: bold;
                transition: all 0.3s;
              ">
                ${escapeHtml(buttonText)}
              </a>
            </div>
          </section>
        `;
      } catch (err) {
        return renderErrorFallback(`callToAction render: ${err.message}`);
      }
    }
  },

  // ===== LISTINGS GRID (Genérico) =====
  listingsGrid: {
    label: "Grid de Productos/Listados",
    icon: "🏪",
    description: "Grid dinámico de items (productos, vehículos, servicios, etc.)",
    category: "content",

    schema: {
      title: { type: "string", label: "Título" },
      type: { 
        type: "string",
        label: "Tipo de item",
        enum: ["vehicle", "service", "product", "specialist"],
        default: "product"
      },
      columns: { type: "number", default: 3, min: 1, max: 4 },
      filters: { type: "object", label: "Filtros (advanced)" }
    },

    render: (props = {}) => {
      try {
        const { title = "", type = "product", columns = 3 } = props;

        // Nota: El renderer DINÁMICO (que carga de Firestore) está en pageRouter.js
        // porque necesita async para cargar datos. Este es el fallback/template.

        return `
          <section class="section-listings" style="padding: 40px 20px;">
            <div class="container" style="max-width: 1200px; margin: 0 auto;">
              ${title ? `<h2 style="margin-bottom: 30px;">${escapeHtml(title)}</h2>` : ""}
              <div id="listings-${type}" style="display: grid; grid-template-columns: repeat(${columns}, 1fr); gap: 20px;">
                <!-- Se carga dinámicamente en pageRouter -->
                <p style="grid-column: 1 / -1; text-align: center; color: #999;">Cargando ${type}...</p>
              </div>
            </div>
          </section>
        `;
      } catch (err) {
        return renderErrorFallback(`listingsGrid render: ${err.message}`);
      }
    }
  },

  // ===== CONTACT FORM =====
  contactForm: {
    label: "Formulario de Contacto",
    icon: "✉️",
    description: "Formulario dinámico para recolectar leads",
    category: "interaction",

    schema: {
      title: { type: "string", label: "Título" },
      fields: {
        type: "array",
        label: "Campos del formulario",
        itemsSchema: {
          name: { type: "string", required: true },
          type: { type: "string", enum: ["text", "email", "tel", "textarea"] },
          required: { type: "boolean", default: false }
        }
      },
      submitText: { type: "string", default: "Enviar", label: "Texto del botón" }
    },

    render: (props = {}) => {
      try {
        const { title = "Contáctanos", fields = [], submitText = "Enviar" } = props;

        const fieldsHtml = Array.isArray(fields) ? fields.map(field => {
          const type = field.type || "text";
          const required = field.required ? "required" : "";
          const placeholder = field.name.charAt(0).toUpperCase() + field.name.slice(1);

          if (type === "textarea") {
            return `
              <div style="margin-bottom: 15px;">
                <textarea name="${field.name}" placeholder="${placeholder}" ${required} style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-family: inherit; min-height: 120px;"></textarea>
              </div>
            `;
          }

          return `
            <div style="margin-bottom: 15px;">
              <input type="${type}" name="${field.name}" placeholder="${placeholder}" ${required} style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-family: inherit;">
            </div>
          `;
        }).join("") : "";

        return `
          <section class="section-contact-form" style="padding: 40px 20px; background: #f9f9f9;">
            <div class="container" style="max-width: 600px; margin: 0 auto;">
              ${title ? `<h2 style="text-align: center; margin-bottom: 30px;">${escapeHtml(title)}</h2>` : ""}
              <form id="contactForm" onsubmit="handleContactFormSubmit(event)" style="display: flex; flex-direction: column;">
                ${fieldsHtml}
                <button type="submit" style="padding: 12px 24px; background: #E50914; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">
                  ${escapeHtml(submitText)}
                </button>
              </form>
            </div>
          </section>
        `;
      } catch (err) {
        return renderErrorFallback(`contactForm render: ${err.message}`);
      }
    }
  },

  // ===== BANNER SIMPLE =====
  banner: {
    label: "Banner Simple",
    icon: "📋",
    description: "Banner con fondo y texto",
    category: "layout",

    schema: {
      text: { type: "string", required: true },
      bgColor: { type: "string", default: "#E50914" },
      textColor: { type: "string", default: "#ffffff" }
    },

    render: (props = {}) => {
      try {
        const {
          text = "Banner",
          bgColor = "#E50914",
          textColor = "#ffffff"
        } = props;

        return `
          <section class="section-banner" style="
            padding: 30px 20px;
            background-color: ${bgColor};
            color: ${textColor};
            text-align: center;
          ">
            <div class="container">
              <p style="margin: 0; font-size: 18px;">${escapeHtml(text)}</p>
            </div>
          </section>
        `;
      } catch (err) {
        return renderErrorFallback(`banner render: ${err.message}`);
      }
    }
  }
};

// ===== UTILITY FUNCTIONS =====

/**
 * Obtener lista de bloques disponibles
 */
export function getAvailableBlocks() {
  return Object.entries(BLOCK_REGISTRY).map(([type, block]) => ({
    type,
    label: block.label,
    icon: block.icon,
    description: block.description,
    category: block.category
  }));
}

/**
 * Obtener schema de un tipo de bloque
 */
export function getBlockSchema(type) {
  const block = BLOCK_REGISTRY[type];
  return block ? block.schema : null;
}

/**
 * Verificar si un tipo de bloque existe
 */
export function isValidBlockType(type) {
  return Boolean(BLOCK_REGISTRY[type]);
}

/**
 * Obtener bloque por tipo
 */
export function getBlockByType(type) {
  return BLOCK_REGISTRY[type] || null;
}
