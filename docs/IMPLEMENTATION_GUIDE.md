# Website Builder Multi-Tenant por Bloques - Guía de Implementación

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Estructura de Datos](#estructura-de-datos)
3. [Arquitectura de Módulos](#arquitectura-de-módulos)
4. [Crear un Tenant Nuevo](#crear-un-tenant-nuevo)
5. [Crear una Página Nueva](#crear-una-página-nueva)
6. [Agregar un Nuevo Bloque (Type)](#agregar-un-nuevo-tipo-de-bloque)
7. [Migración desde el Sistema Antiguo](#migración-desde-el-sistema-antiguo)
8. [Seguridad](#seguridad)
9. [Performance](#performance)
10. [Troubleshooting](#troubleshooting)

---

## Introducción

Este proyecto implementa un **SaaS Website Builder multi-tenant y multi-rubro** donde:

- **Un único código base** sirve a múltiples usuarios (tenants)
- **Cada página se define dinámicamente** mediante configuración en Firestore (no HTML hardcodeado)
- **Las páginas están compuestas de bloques (secciones)** que se renderean según su `type`
- **Sin duplicación de repositorios**: un deploy → múltiples sitios web

**Ventajas:**
- ✓ Escalable: agregar un cliente = crear documentos en Firestore
- ✓ Multi-rubro: vehículos, consultorios, imprentas, tiendas, etc.
- ✓ Mantenible: cambios en un bloque = todos los sitios se actualizan
- ✓ Performance: caching inteligente, lazy loading automático
- ✓ Seguridad: datos públicos/privados separados

---

## Estructura de Datos

### Firestore Collections

```
firestore/
├── domains/
│   ├── localhost → { clientId: "autoelite" }
│   └── autoelite.com.ar → { clientId: "autoelite" }
│
├── clients/
│   ├── autoelite/
│   │   ├── settings/
│   │   │   └── public/ → { brandName, logo, colors, etc }
│   │   │
│   │   ├── pages/
│   │   │   ├── home/ → { slug, sections: [], meta, nav, status }
│   │   │   ├── vehiculos/ → { ... }
│   │   │   └── contacto/ → { ... }
│   │   │
│   │   └── content/
│   │       ├── listings/
│   │       │   ├── vehiculo-001/ → { title, price, media, attributes }
│   │       │   └── vehiculo-002/ → { ... }
│   │       ├── testimonials/
│   │       ├── faqs/
│   │       └── assets/
│   │
│   └── clinicadrsandez/
│       ├── settings/public/
│       ├── pages/
│       │   ├── home/
│       │   ├── servicios/
│       │   └── turno/
│       └── content/
│           └── listings/ (servicios médicos)
```

### Estructura de una Página

```javascript
// clients/autoelite/pages/vehiculos/
{
  slug: "vehiculos",                    // Identificador único (en URL)
  status: "published",                   // "published" o "draft"
  
  meta: {                                // SEO
    title: "Autos en Venta | AutoElite",
    description: "Nuestros vehículos...",
    ogImage: "https://...",
    canonical: "https://autoelite.com/vehiculos"
  },
  
  nav: {                                 // Navegación
    showInNav: true,
    label: "Vehículos",
    order: 2
  },
  
  sections: [                            // Bloques que componen la página
    {
      id: "unique-id-1",                 // Identificador único en página
      type: "hero",                      // Tipo de bloque
      props: {                           // Props específicas del bloque
        title: "Nuestros Vehículos",
        subtitle: "...",
        bgImage: "..."
      }
    },
    {
      id: "unique-id-2",
      type: "listingsGrid",
      props: {
        collectionPath: "content/listings",
        filters: { category: "vehicles" },
        sort: { field: "createdAt", direction: "desc" }
      }
    }
  ],
  
  updatedAt: 1708000000000
}
```

### Estructura de un Listing (Producto)

```javascript
// clients/autoelite/content/listings/vehiculo-001/
{
  status: "published",
  category: "vehicles",
  
  title: "Chevrolet Cruze 2018",
  subtitle: "Excelente estado",
  description: "Vehículo en perfectas condiciones...",
  
  price: 1850000,
  
  mainImage: "https://...",
  media: [
    { url: "https://...", alt: "Vista exterior" },
    { url: "https://...", alt: "Interior" }
  ],
  
  // Atributos flexibles según rubro
  attributes: {
    brand: "Chevrolet",
    model: "Cruze",
    year: 2018,
    km: 45000,
    engine: "1.6 16v"
  },
  
  tags: ["sedán", "bajo-km"],
  createdAt: 1708000000000,
  updatedAt: 1708000000000
}
```

---

## Arquitectura de Módulos

El código nuevo está organizado en módulos ES6 que trabajan en conjunto:

### 1. **js/dataLayer.js** - Capa de Datos
Responsabilidades:
- Resolución de tenant desde hostname
- Carga de configuración pública
- Queries a Firestore
- Caching inteligente

**Funciones:**
```javascript
await getTenantId()                    // string (clientId)
await getPublicSettings(clientId)      // objeto settings
await getPage(clientId, slug)          // objeto página
await getListings(clientId, options)   // array de items
await getListing(clientId, listingId)  // objeto único
await getPublishedPages(clientId)      // array de páginas para nav
```

### 2. **js/sectionRenderer.js** - Motor de Renderizado
Responsabilidades:
- Mapea type → función renderer
- Renderiza HTML para cada bloque
- Validación defensiva de props
- Fallbacks en errores

**Tipos soportados:**
```
hero, richText, servicesGrid, listingsGrid
testimonials, faq, gallery, hours, callToAction
map, socialLinks, banner
```

**Uso:**
```javascript
const html = renderSection(section, clientId);
const allHtml = renderSections(sections, clientId);
```

### 3. **js/pageRouter.js** - Enrutador Dinámico
Responsabilidades:
- Captura slug desde URL
- Carga página dinámicamente
- Aplica meta tags (SEO)
- Renderiza secciones
- Maneja 404s

**Uso:**
```javascript
import { initPageRouter } from './js/pageRouter.js';

document.addEventListener('DOMContentLoaded', async () => {
  await initPageRouter();
});
```

### 4. **js/tenant.js** - Resolución de Tenant
Ya existente, funciona sin cambios.

---

## Crear un Tenant Nuevo

### Paso 1: Mapeo de Dominio

En **Firestore Console**, crear documento:
```
Collection: domains
Document: tuconsultorium.com.ar

{
  clientId: "drsandez"
}
```

### Paso 2: Crear Configuración Pública

```
Collection: clients
Document: drsandez
  Collection: settings
    Document: public

{
  brandName: "Consultorio Dr. Sández",
  logo: "assets/logo/drsandez.png",
  phone: "+543794123456",
  email: "contacto@drsandez.com.ar",
  address: "Calle Principal 123, Corrientes",
  
  whatsapp: "+543794123456",
  instagram: "https://instagram.com/drsandez",
  
  colorPrimary: "#0066CC",
  colorSecondary: "#333333",
  
  copyright: "© 2025 Dr. Sández. Todos los derechos reservados.",
  
  published: true,
  updatedAt: Math.floor(Date.now() / 1000)
}
```

### Paso 3: Crear Página Home

```
Collection: clients → drsandez → pages
Document: home

{
  slug: "home",
  status: "published",
  meta: {
    title: "Consultorio Dr. Sández",
    description: "Servicios médicos especializados...",
    ogImage: "assets/logo/drsandez.png"
  },
  nav: {
    showInNav: true,
    label: "Inicio",
    order: 1
  },
  sections: [
    {
      id: "hero-home",
      type: "hero",
      props: {
        title: "Bienvenido al Consultorio Dr. Sández",
        subtitle: "Salud y bienestar para toda tu familia",
        cta: { text: "Ir a Servicios", link: "/servicios" }
      }
    }
  ],
  updatedAt: Math.floor(Date.now() / 1000)
}
```

### Paso 4: Apuntar el Dominio

En tu registrador de dominios, apunta el dominio a Cloudflare Pages (tu deploy).

**¡Hecho!** El sitio detectará automáticamente el nuevo tenant desde el dominio.

---

## Crear una Página Nueva

### 1. Définición en Firestore

```
Collection: clients → autoelite → pages
Document: consultas

{
  slug: "consultas",
  status: "published",  // "draft" para no publicar aún
  meta: {
    title: "Formulario de Consultas | AutoElite",
    description: "Envía tu consulta y nuestro equipo se comunicará contigo.",
    ogImage: "assets/logo/logo.png"
  },
  nav: {
    showInNav: true,
    label: "Consultas",
    order: 5
  },
  sections: [
    {
      id: "hero-consultas",
      type: "hero",
      props: {
        title: "¿Tenés alguna consulta?",
        subtitle: "Completá el formulario y pronto te responderemos"
      }
    },
    {
      id: "contact-form",
      type: "contactForm",  // (a implementar en próxima fase)
      props: {
        fields: [
          { name: "nombre", type: "text", required: true },
          { name: "email", type: "email", required: true },
          { name: "mensaje", type: "textarea", required: true }
        ]
      }
    }
  ],
  updatedAt: Math.floor(Date.now() / 1000)
}
```

### 2. Acceder desde la URL

La página será automáticamente **accesible en `/consultas`** una vez que exista en Firestore con `status: "published"`.

(El router detecta `/consultas` → slug="consultas" → carga desde Firestore)

---

## Agregar un Nuevo Tipo de Bloque

### Paso 1: Crear Función Renderer

En **js/sectionRenderer.js**, agregar:

```javascript
/**
 * Nuevo tipo: testimonialSlider
 */
function renderTestimonialSlider(props = {}) {
  try {
    const { items = [], autoplay = true } = props;

    if (!Array.isArray(items) || items.length === 0) {
      return "";
    }

    // Tu lógica de renderizado aquí
    return `
      <section class="section-testimonial-slider" data-autoplay="${autoplay}">
        <!-- HTML -->
      </section>
    `;
  } catch (err) {
    return renderErrorFallback(`renderTestimonialSlider: ${err.message}`);
  }
}

// Registrar en SECTION_RENDERERS
SECTION_RENDERERS.testimonialSlider = renderTestimonialSlider;
```

### Paso 2: Usar en Página

En Firestore, agregar sección:

```javascript
{
  id: "testimonials-slider-1",
  type: "testimonialSlider",  // Tu nuevo tipo
  props: {
    items: [
      { text: "...", author: "Juan" },
      { text: "...", author: "María" }
    ],
    autoplay: true
  }
}
```

**¡Automáticamente se renderizará** sin necesidad de redeploy.

---

## Migración desde el Sistema Antiguo

### Fase 1: Setup de Nueva Arquitectura (HECHO)

- ✓ Data layer creado
- ✓ Section renderer creado
- ✓ Page router creado
- ✓ index-dynamic.html creado

### Fase 2: Cargar Datos en Firestore

1. Copiar estructura de [FIRESTORE_SEED.js](./FIRESTORE_SEED.js)
2. Ejecutar script en Firebase Admin CLI
3. Verificar en Firestore Console

### Fase 3: Probar Nueva Estructura

1. Acceder a `index-dynamic.html` en navegador
2. Debería cargar desde Firestore y renderizar dinámicamente
3. Las páginas están en `/` (home) o `/:slug`

### Fase 4: Migrar Vehículos

Convertir vehículos antiguos → listings nuevos:

```javascript
// Viejo (en vehicles.js):
{
  marca: "Chevrolet",
  modelo: "Cruze",
  año: 2018,
  km: 45000,
  precio: 1850000,
  images: ["..."]
}

// Nuevo (en content/listings):
{
  status: "published",
  category: "vehicles",
  title: "Chevrolet Cruze 2018",
  price: 1850000,
  mainImage: "...",
  media: [{ url: "...", alt: "..." }],
  attributes: {
    brand: "Chevrolet",
    model: "Cruze",
    year: 2018,
    km: 45000
  }
}
```

### Fase 5: Reemplazar index.html

Una vez estable, renombrar:
- `index-dynamic.html` → `index.html` (FUTURO)
- Mantener páginas antiguas como fallback temporal

---

## Seguridad

### Firestore Rules (Mínimas)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Dominios: públicos
    match /domains/{domain} {
      allow read: if true;
      allow write: if false;  // Cloud Function o Admin SDK
    }
    
    // Configuración pública: pública
    match /clients/{clientId}/settings/public {
      allow read: if true;
      allow write: if hasClaim('admin', clientId);
    }
    
    // Páginas: solo si status == published
    match /clients/{clientId}/pages/{slug} {
      allow read: if resource.data.status == 'published';
      allow write: if hasClaim('admin', clientId);
    }
    
    // Listings: solo si status == published
    match /clients/{clientId}/content/listings/{listingId} {
      allow read: if resource.data.status == 'published';
      allow write: if hasClaim('admin', clientId);
    }
    
    // Leads: crear si autenticado, leer si admin
    match /clients/{clientId}/leads/{leadId} {
      allow create: if request.auth != null;
      allow read: if hasClaim('admin', clientId);
    }
  }
}

function hasClaim(claim, clientId) {
  return request.auth != null
    && request.auth.token[claim] == clientId;
}
```

### Aislamiento Multi-Tenant

Cada caché está indexado por `clientId`:

```javascript
// dataLayer.js
window.__DATA_LAYER_CACHE = {
  tenantId: null,
  settings: {
    "autoelite": {...},    // Solo datos de autoelite
    "drsandez": {...}      // Solo datos de drsández
  },
  pages: {
    "autoelite": {...},
    "drsández": {...}
  }
};
```

---

## Performance

### Caching Inteligente

- TTL: 5 minutos por defecto
- Cache por clientId + filtros
- Invalidar manualmente: `invalidateTenantCache(clientId)`

### Lazy Loading

Imágenes automáticamente con:
```html
<img src="..." loading="lazy" />
```

### Optimización de Imágenes

Con Cloudinary:
```javascript
// Automático en imageUrl helper:
// /upload/ → /upload/w_300,h_300,c_fill,f_auto,q_auto/
```

### Network

- 3 queries máximo por página:
  1. Resolver tenant
  2. Cargar settings
  3. Cargar página
- Listings cargan bajo demanda (si la sección lo requiere)

---

## Troubleshooting

### "Página no encontrada" (404)

1. Verificar que la página existe en Firestore
2. Verificar que `status: "published"`
3. Verificar que el slug es correcto (sensible a mayúsculas)

Ejemplo:
```
URL: /vehiculos
Buscará: clients/autoelite/pages/vehiculos
```

### "Tenant no resuelto"

1. Verificar que existe documento en `domains/{hostname}`
2. Verificar que tiene campo `clientId`
3. Verificar en console: `window.__TENANT_CACHE`

### "Listings no cargan"

1. Verificar que existen documentos en `content/listings`
2. Verificar que `status: "published"`
3. Verificar que `filters` coinciden con los datos

Ejemplo:
```javascript
// En sección:
props: {
  collectionPath: "content/listings",
  filters: { category: "vehicles" }
}

// En listing debe existir:
category: "vehicles"
status: "published"
```

### Console dice "[DataLayer] failed to load page"

Verificar:
- Reglas Firestore permiten lectura pública
- Documento de página existe
- BD está inicializada correctamente

---

## Próximas Fases de Desarrollo

### Fase 3: Admin Genérico ⏳
- CRUD de páginas
- Editor de secciones drag-drop
- Editor de props por tipo
- Preview en vivo

### Fase 4: Contactos/Leads ⏳
- Formulario dinámico
- Webhooks (email, WhatsApp)
- Rate limiting
- Confirmación en Firestore

### Fase 5: Uploads ⏳
- Interfaz de assets
- Integración Cloudinary/R2
- Firmas de upload
- Gestión de referencias

### Fase 6: Presets Verticales ⏳
- Preset: "Cars" (concesionaria)
- Preset: "Clinic" (consultorio)
- Preset: "Shop" (tienda)
- Con páginas y listings pre-configurados

---

## Documentación

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Diseño detallado
- [FIRESTORE_SEED.js](./FIRESTORE_SEED.js) - Datos de ejemplo
- [js/dataLayer.js](./js/dataLayer.js) - API de datos
- [js/sectionRenderer.js](./js/sectionRenderer.js) - Tipos de bloques

---

**¡Felicidades! Ya tienes un website builder multi-tenant y multi-rubro.** 🚀
