// ============================================
// config/site.js
// Modo: 1 cliente = 1 web
//
// Objetivo:
// - Clonar cliente: editar SOLO este archivo.
// - Reorganizar layout: cambiar arrays de layout (sin tocar HTML).
// - Mantener compatibilidad: expone window.SITE_CLIENT_ID y window.SITE_ADMIN_EMAILS.
// ============================================

(function () {
  const SITE = {
    // Firestore: clients/{clientId}/...
    clientId: "autoelite",

    // Entorno
    env: {
      // 'prod' o 'staging' (staging activa noindex + banners opcionales)
      mode: "prod",
      // Base URL pública (para sitemap/OG). Ej: https://www.tudominio.com
      baseUrl: "",
      // Logs en consola
      debug: false
    },

    // Pack por rubro (vehicles | consulting)
    pack: "vehicles",

    // Admin
    // Opción A (recomendada): custom claims role=admin
    // Opción B (rápida): allowlist por email (SIN claims)
    admin: {
      allowedEmails: [
        // "tuemail@dominio.com"
      ]
    },

    branding: {
      name: "AutoElite",
      tagline: "Concesionaria Premium",
      logo: "/assets/logo/logo.png",
      logoAlt: "AutoElite",

      // SEO (home)
      metaTitle: "Compra y Venta de Autos | Concesionaria",
      metaDescription:
        "Compra y venta de vehículos usados y 0km. Atención personalizada y financiación.",
      themeColor: "#E50914",

      addressLine1: "Avenida Independencia 3047",
      addressLine2: "Corrientes Capital, Argentina",
      phoneE164: "+543794286684",

      // Enlaces
      links: {
        whatsapp: {
          phoneE164: "+543794286684",
          defaultText: "Hola, quiero consultar por un vehículo.",
          ctaText: "Escribinos por WhatsApp"
        },
        instagram: {
          url: "",
          label: "Instagram"
        },
        facebook: {
          url: "",
          label: "Facebook"
        }
      }
    },

    // Tema: se aplica como CSS variables en :root
    theme: {
      "--color-primary": "#E50914",
      "--color-dark": "#141414",
      "--color-bg": "#0A0A0A",
      "--color-text": "#FFFFFF"
    },

    // Layouts por página (reordenables)
    
  // Presets de layout (ejemplos): cambia pages.home.layout a cualquiera de estos arrays
  layoutPresets: {
    vehiclesA: ['hero','seoLocal','featuredVehicles','values','cta'],
    vehiclesB: ['hero','featuredVehicles','cta','values','seoLocal'],
    consultingA: ['hero','servicesDetailed','caseStudies','industries','bookCall','cta'],
    consultingB: ['hero','industries','servicesDetailed','leadMagnet','testimonials','contact','cta'] // si agregas esas secciones core luego
  },

  pages: {
      home: {
        // Cambiá el orden, agregá o quitá secciones sin tocar HTML.
        layout: ['hero','seoLocal','featuredVehicles','values','cta']
      }
    },

    // Config por sección
    sections: {
      header: {
        menu: [
          { label: "Home", href: "/", activeOn: ["/"] },
          { label: "Vehículos", href: "/vehiculos.html" },
          { label: "Nosotros", href: "/nosotros.html" },
          { label: "Ubicación", href: "/contacto.html#ubicacion" },
          { label: "Contacto", href: "/contacto.html" },
          { label: "Admin", href: "/admin.html", accent: true }
        ]
      },

      hero: {
        badge: "Concesionaria Premium",
        h1: "Concesionaria de Autos",
        p:
          "Vehículos seleccionados con garantía. Encontrá tu próximo auto con las mejores marcas.",
        primaryCta: { label: "Ver Vehículos", href: "/vehiculos.html" },
        secondaryCta: {
          label: "Contactanos",
          href: "__WHATSAPP__",
          external: true
        }
      },

      seoLocal: {
        text:
          "Somos una concesionaria especializada en compra y venta de autos usados y 0km. Ofrecemos financiación y atención personalizada."
      },

      featuredVehicles: {
        title: "Vehículos Destacados",
        gridId: "featuredVehicles",
        showMore: { label: "Ver todo el stock", href: "/vehiculos.html" }
      },

      values: {
        title: "¿Por qué elegirnos?",
        items: [
          {
            icon: "🛡️",
            title: "Garantía",
            text: "Todos nuestros vehículos cuentan con garantía mecánica para tu tranquilidad."
          },
          {
            icon: "💰",
            title: "Financiación",
            text: "Planes de financiación flexibles adaptados a tu presupuesto."
          },
          {
            icon: "✅",
            title: "Revisados",
            text: "Cada auto pasa por una inspección mecánica completa."
          }
        ]
      },

      cta: {
        title: "¿Buscás un auto?",
        text:
          "Contactanos por WhatsApp y te asesoramos sin compromiso. Estamos para ayudarte a encontrar tu próximo vehículo.",
        button: { label: "__WHATSAPP_CTA__", href: "__WHATSAPP__", external: true }
      },

      footer: {
        about:
          "Concesionaria de vehículos usados y 0km. Tu próximo auto te espera.",
        navigation: [
          { label: "Home", href: "/" },
          { label: "Vehículos", href: "/vehiculos.html" },
          { label: "Nosotros", href: "/nosotros.html" },
          { label: "Contacto", href: "/contacto.html" }
        ]
      }
    }
  };

  // Helpers / placeholders
  const waPhone = (SITE.branding.links.whatsapp.phoneE164 || "").replace(/\+/g, "");
  const waText = encodeURIComponent(SITE.branding.links.whatsapp.defaultText || "Hola!");
  const waUrl = waPhone ? `https://wa.me/${waPhone}?text=${waText}` : "";

  const replacePlaceholders = (obj) => {
    if (!obj || typeof obj !== "object") return obj;
    if (Array.isArray(obj)) return obj.map(replacePlaceholders);
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === "string") {
        out[k] = v
          .replaceAll("__WHATSAPP__", waUrl)
          .replaceAll("__WHATSAPP_CTA__", SITE.branding.links.whatsapp.ctaText || "WhatsApp");
      } else {
        out[k] = replacePlaceholders(v);
      }
    }
    return out;
  };

  SITE.sections = replacePlaceholders(SITE.sections);

  // Exponer config principal
  window.SITE = SITE;

  // Compatibilidad
  window.SITE_CLIENT_ID = SITE.clientId;
  window.SITE_ADMIN_EMAILS = SITE.admin.allowedEmails;
})();


// Auto-apply preset by pack (evita que aparezcan secciones de otro rubro por default)
(function autoApplyPreset() {
  try {
    const p = String(window.SITE.pack || '').toLowerCase();
    if (!window.SITE.pages) window.SITE.pages = {};
    if (!window.SITE.pages.home) window.SITE.pages.home = {};
    const presets = window.SITE.layoutPresets || {};
    if (p === 'consulting' || p === 'consultora' || p === 'services') {
      window.SITE.pages.home.layout = window.SITE.pages.home.layout?.length ? window.SITE.pages.home.layout : (presets.consultingA || []);
    } else {
      // default vehicles
      window.SITE.pages.home.layout = window.SITE.pages.home.layout?.length ? window.SITE.pages.home.layout : (presets.vehiclesA || []);
    }
  } catch(e) {}
})();