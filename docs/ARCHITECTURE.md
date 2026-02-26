# Arquitectura de Website Builder Multi-Tenant por Bloques

## Estado Actual - Análisis de Acoplamientos

### Acoplamientos a "Concesionaria" Identificados:

1. **config.js** - Hardcodeado a AutoElite
   - `brandName: "AutoElite"`
   - `heroTitle: "Tu próximo auto está acá"`
   - Específico del rubro de autos

2. **vehiculos.html** - Estructura estática
   - Página fija con navbar, filtros (marca, año)
   - Asume que existe una grilla de "vehículos"
   - No parametrizable por rubro

3. **vehicles.js** - Lógica específica de autos
   - Manejo de campos: brand, model, year, km, price, engine
   - Transformaciones de Cloudinary específicas
   - CRUD operando en colección `vehicles`

4. **admin.js** - Admin orientado a vehículos
   - Formularios específicos: marca, modelo, año, etc.
   - No existe admin genérico para páginas/secciones

5. **index.html, nosotros.html, contacto.html** - Páginas estáticas
   - Layouts hardcodeados
   - Sin capacidad de cambiar estructura desde Firestore

### Dependencias/Relaciones Existentes:

```
tenant.js (resuelve clientId desde hostname) ✓ ESTÁ BIEN
  ↓
config.js (carga estética) → NEEDS REFACTOR
  ↓
main.js (aplica estética a DOM)
  ↓
vehiculos.html + vehicles.js (ACOPLADO A AUTOS)
admin.js (ACOPLADO A AUTOS)
```

## Arquitectura Objetivo - Pages + Sections (Bloques)

### Modelo de Datos en Firestore

```
clients/{clientId}/
  settings/public/          → Branding, NAV, feature flags
  pages/{slug}/             → Definición de página + secciones
  content/
    listings/{listingId}     → Items genéricos (vehículos, servicios, etc)
    testimonials/
    faqs/
  assets/{assetId}          → Referencias de imágenes
  leads/{leadId}            → Contactos del formulario
```

### Types de Secciones (Bloques Mínimos)

| Type | Propósito | Props Típicas |
|------|-----------|---------------|
| `hero` | Banner principal | title, subtitle, bgImage, cta |
| `richText` | Contenido de texto | html, alignment |
| `servicesGrid` | Grilla de servicios | items[], columns |
| `listingsGrid` | Grilla de productos/autos | collectionPath, filters, sort |
| `testimonials` | Testimonios | items[], layout |
| `gallery` | Galería de imágenes | items[], columns |
| `faq` | Preguntas frecuentes | items[] |
| `contactForm` | Formulario de contacto | fields[], submitWebhook |
| `hours` | Horarios | schedule[] |
| `callToAction` | Botón/CTA | text, link, style |
| `map` | Mapa embebido | address, coordinates |
| `socialLinks` | Enlaces a redes | links[] |
| `banner` | Anuncio | text, bgColor, icon |

### Estructura de Página en Firestore

```javascript
clients/autoelite/pages/vehiculos/ {
  slug: "vehiculos",
  status: "published",  // draft|published
  meta: {
    title: "Autos en Venta | AutoElite",
    description: "Vehículos usados y 0km...",
    ogImage: "...",
    canonical: "https://domain.com/vehiculos"
  },
  nav: {
    showInNav: true,
    label: "Vehículos",
    order: 2
  },
  sections: [
    {
      id: "hero-1",
      type: "hero",
      props: {
        title: "Nuestros Vehículos",
        subtitle: "Explora nuestro catálogo",
        bgImage: "..."
      },
      visibility: { mobile: true, tablet: true, desktop: true }
    },
    {
      id: "listings-1",
      type: "listingsGrid",
      props: {
        collectionPath: "content/listings",
        filters: { category: "vehicles" },
        sort: { field: "createdAt", direction: "desc" },
        itemsPerPage: 12
      }
    }
  ],
  updatedAt: 1708000000000
}
```

## Arquitectura Frontend

### 1. **Data Layer** (`js/dataLayer.js` - NEW)
Responsabilidades:
- Resolver tenant (usar `tenant.js` existente)
- Cargar configuración pública
- Cargar página por slug
- Cargar listings con filtros
- Caché inteligente con versionado

```javascript
export async function getTenantId() { }
export async function getPublicSettings() { }
export async function getPage(slug) { }
export async function getListings(query) { }
export async function submitLead(formData) { }
```

### 2. **Section Renderer** (`js/sectionRenderer.js` - NEW)
Responsabilidades:
- Map type → función renderer
- Validación defensiva de props
- Fallback en errores
- Lazy loading de imágenes

```javascript
export function renderSection(section, clientId) {
  const renderer = SECTION_RENDERERS[section.type];
  if (!renderer) {
    return renderErrorFallback(`Unknown section type: ${section.type}`);
  }
  return renderer(section.props, clientId);
}

const SECTION_RENDERERS = {
  hero: renderHero,
  listingsGrid: renderListingsGrid,
  // ...
};
```

### 3. **Page Router** (`js/pageRouter.js` - NEW)
Responsabilidades:
- Capturar `:slug` desde URL
- Cargar página + aplicar meta tags
- Renderizar secciones en orden
- Manejar 404

```javascript
export async function initPageRouter() {
  const slug = extractSlugFromUrl();
  const page = await getPage(slug);
  if (!page) {
    renderNotFound();
    return;
  }
  renderPageWithSections(page);
}
```

### 4. **Un Index HTML Genérico** (`index.html` - REFACTORED)
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport">
  <!-- Meta dinámicos se inyectan aquí por JS -->
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <nav class="navbar" id="navbar"></nav>
  <main id="pageContent"></main>
  <footer id="footer"></footer>

  <script src="config/config.js"></script>
  <script type="module" src="js/tenant.js"></script>
  <script type="module" src="js/dataLayer.js"></script>
  <script type="module" src="js/sectionRenderer.js"></script>
  <script type="module" src="js/pageRouter.js"></script>
  <script type="module" src="js/main.js"></script>
</body>
</html>
```

## Plan de Implementación Incremental (8 Fases)

### Fase 1: Data Layer + Modelo (SIN ROMPER SITIO)
- [x] Crear `js/dataLayer.js` con funciones básicas
- [x] Actualizar `tenant.js` para que exporte `getTenantId()`
- [x] Tests en console

### Fase 2: Section Renderer Base
- [ ] Crear `js/sectionRenderer.js` con tipos básicos
- [ ] Implementar `hero`, `richText`, `listingsGrid`
- [ ] Error fallbacks

### Fase 3: Router por Slug
- [ ] Crear `js/pageRouter.js` que mapee `/` → home, `/:slug` → página
- [ ] Mantener rutas státicas como fallback
- [ ] Test en vehiculos_dynamic.html (nueva página de prueba)

### Fase 4: Migración gradual de páginas
- [ ] Crear páginas en Firestore (home, vehiculos, etc.)
- [ ] Redirigir `vehiculos.html` → `/?page=vehiculos` o manejar en router
- [ ] Mantener vehiculos.html como fallback

### Fase 5: Admin Genérico
- [ ] Crear admin genérico para CRUD de páginas
- [ ] Editor de secciones (agregar, quitar, reordenar)
- [ ] Editor de props por tipo

### Fase 6: Migración de Vehículos a Listings
- [ ] CRUD de listings (reemplaza CRUD de vehículos)
- [ ] Mapeo: vehículo antiguo → listing nuevo
- [ ] Depurar vehicles.js gradualmente

### Fase 7: Optimizaciones
- [ ] Caching inteligente
- [ ] Lazy loading de imágenes
- [ ] Service worker genérico

### Fase 8: Documentación + Presets
- [ ] README con modelo de datos
- [ ] Guía: crear tenant nuevo
- [ ] Guía: crear página nueva
- [ ] Preset vertical: "cars"

## Migración del Tenant Actual (AutoElite)

**Paso 1:** Crear estructura en Firestore
```firestore
domains/autoelite.com.ar → { clientId: "autoelite" }
clients/autoelite/
  settings/public/ {
    brandName, logo, colors, phone, email, ...
  }
  pages/home/ {
    slug: "home",
    sections: [ hero, ... ]
  }
  pages/vehiculos/ {
    slug: "vehiculos",
    sections: [ hero, listingsGrid ]
  }
  content/listings/ → migrar vehículos aquí
```

**Paso 2:** Mantener vehiculos.html como fallback
- Si la página "vehiculos" existe en Firestore, renderizar dinámicamente
- Si no, fallback al HTML estático

**Paso 3:** Deprecar config.js gradualmente
- Mover settings a Firestore
- Mantener config.js como fallback local

## Consideraciones de Seguridad

### Firestore Rules (Mínimo)
```javascript
match /clients/{clientId}/settings/public {
  allow read: if true;  // Público
  allow write: if hasClaim('admin');
}
match /clients/{clientId}/pages/{slug} {
  allow read: if resource.data.status == 'published';
  allow write: if hasClaim('admin');
}
match /clients/{clientId}/content/listings {
  allow read: if resource.data.status == 'published';
  allow write: if hasClaim('admin');
}
match /clients/{clientId}/leads {
  allow create: if request.auth != null;  // o restricción por rate limit
  allow read: if hasClaim('admin');
}
```

## Aislamiento Multi-Tenant

El cache debe estar indexado por clientId:
```javascript
window.__PAGE_CACHE = {
  [clientId]: {
    [slug]: { page, timestamp }
  }
};
```

## Criterios de Éxito

- ✓ El sitio actual (vehiculos) sigue funcionando sin cambios visibles
- ✓ Una página nueva se puede crear sin código (solo Firestore)
- ✓ Admin permite editar páginas y secciones
- ✓ El caché no mezcla tenants
- ✓ Errores en una sección no rompen la página
- ✓ Performance: máximo 3 queries por carga (tenant + settings + page)
