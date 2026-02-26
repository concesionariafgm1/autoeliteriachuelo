# 📘 Developer Quick Reference - SaaS Website Builder

## 🚀 Quick Start (5 min)

```bash
# 1. Abrir workspace
cd /c:Users/masso/Desktop/nuevo

# 2. Servidor local (Cloudflare Pages)
npm install -g wrangler
wrangler pages dev .

# 3. Abrir en navegador
http://localhost:8787/

# 4. Ver tests (Fase 1 validation)
http://localhost:8787/test-blocks.html
```

---

## 📁 Estructura de Carpetas Key

```
js/
├── firebase.js          ← Config de Firebase
├── tenant.js            ← Resolver clientId desde hostname
├── auth.js              ← Firebase Auth + custom claims
├── dataLayer.js         ← CRUD de Firestore (getTenantId, getPage, savePage, etc.)
├── sectionRenderer.js   ← Motor de renderizado (renderSection)
├── pageRouter.js        ← Enrutador dinámico (/:slug)
├── blockRegistry.js     ← CREAR (Fase 2) - Registro de tipos de bloques
├── adminBuilder.js      ← CREAR (Fase 2) - UI del builder
├── formBuilder.js       ← CREAR (Fase 2) - Generador de formularios
└── ...

config/
├── config.js            ← Config estática (fallback)

admin-builder-template.html  ← CREAR (Fase 2) - Admin builder UI

index-dynamic.html       ← HTML genérico que carga páginas desde Firestore
test-blocks.html         ← Tests para validar (Fase 1)

REFACTORING_PLAN.md      ← Plan de 3 fases
MIGRATION_GUIDE.md       ← Cómo migrar desde sitio acoplado
BLOCK_GUIDE.md           ← Cómo agregar bloques nuevos
FIRESTORE_RULES.md       ← Reglas de seguridad
ARCHITECTURE.md          ← Diseño detallado
```

---

## 🔄 Flujos Comunes

### Flow 1: Cargar una página dinámica

```javascript
import { getTenantId, getPage } from "./js/dataLayer.js";
import { renderSection } from "./js/sectionRenderer.js";

// 1. Resolver tenant
const clientId = await getTenantId();

// 2. Cargar página
const page = await getPage(clientId, 'home');

// 3. Renderizar secciones
const html = page.sections
  .map(section => renderSection(section, clientId))
  .join('');

// 4. Inyectar en DOM
document.querySelector('#pageContent').innerHTML = html;

// 5. Aplicar meta tags (SEO)
document.title = page.meta.title;
```

### Flow 2: Editor guarda página

```javascript
import { getTenantId, savePage } from "./js/dataLayer.js";

const clientId = await getTenantId();
const pageData = {
  slug: 'productos',
  status: 'draft',
  meta: { title: '...', description: '...' },
  sections: [
    { id: '1', type: 'hero', props: {...} },
    { id: '2', type: 'listingsGrid', props: {...} }
  ]
};

await savePage(clientId, pageData);
console.log('✓ Página guardada');
```

### Flow 3: Agregar un bloque nuevo

```javascript
// 1. Definir en blockRegistry.js
blockRegistry.productCard = {
  label: "Tarjeta de Producto",
  schema: {
    title: { type: "string", required: true },
    image: { type: "assetId" },
    price: { type: "number" }
  },
  render: (props) => {
    return `<div class="product-card">...</div>`;
  }
};

// 2. Admin lo ve automáticamente en selector
// (blockRegistry se carga en admin UI)

// 3. Usuario puede arrastrarlo a su página
// Editor guardará: { type: "productCard", props: {...} }
```

---

## 📊 Data Model (Firestore)

### Tenant + Settings

```javascript
// domains/localhost
{ clientId: "autoelite" }

// clients/autoelite/settings/public
{
  brand: { name: "AutoElite", logoAssetId: "..." },
  social: { whatsapp: "...", instagram: "..." },
  seoDefaults: { titleTemplate: "...", defaultDescription: "..." },
  navDefaults: { showHome: true, ... },
  preset: "cars"
}
```

### Pages

```javascript
// clients/autoelite/pages/home
{
  slug: "home",
  status: "published",  // or "draft"
  meta: {
    title: "Início",
    description: "...",
    ogImageAssetId: "..."
  },
  nav: {
    label: "Inicio",
    showInNav: true,
    order: 1
  },
  sections: [
    {
      id: "hero-123",
      type: "hero",
      props: { title: "...", subtitle: "...", ... }
    },
    {
      id: "listings-456",
      type: "listingsGrid",
      props: { type: "vehicle", columns: 3, filters: {...} }
    }
  ],
  updatedAt: 1708534800000
}
```

### Content (Listings & Assets)

```javascript
// clients/autoelite/content/listings/car-001
{
  status: "published",
  type: "vehicle",
  title: "Chevrolet Cruze 2020",
  price: 1250000,
  media: [{ assetId: "img-123", alt: "Frente" }],
  attributes: {
    marca: "Chevrolet",
    modelo: "Cruze",
    año: 2020
  }
}

// clients/autoelite/content/assets/img-123
{
  provider: "cloudinary",
  url: "https://res.cloudinary.com/...",
  width: 800,
  height: 600,
  alt: "Frente del Chevrolet",
  folder: "cars"
}
```

---

## 🛠️ API Reference

### dataLayer.js

```javascript
getTenantId()
  → Promise<string>  // "autoelite"

getPublicSettings(clientId)
  → Promise<{brand, social, seoDefaults, ...}>

getPage(clientId, slug)
  → Promise<{slug, status, meta, nav, sections, updatedAt}>
  // Solo retorna si status='published' O usuario es admin del tenant

savePage(clientId, pageDoc)
  → Promise<void>
  // Escribe página en Firestore (draft o published)

getListings(clientId, query)
  → Promise<Array>
  // Ej: getListings(clientId, { type: 'vehicle', status: 'published', limit: 20 })

invalidateTenantCache(clientId)
  → void
  // Limpiar caché (useful después de editar)
```

### sectionRenderer.js

```javascript
renderSection(section, clientId)
  → string (HTML)
  // Renderiza una sección a HTML
  // Maneja errores defensivamente

renderSections(sections, clientId)
  → string (HTML)
  // Renderiza array de secciones

getSectionSchema(type)
  → object
  // Retorna schema JSON para un tipo de bloque

getAvailableBlocks()
  → Array<{type, label, icon, description, category}>
  // Lista todos los tipos disponibles
```

### pageRouter.js

```javascript
initPageRouter()
  → Promise<void>
  // Inicializar router, cargar página actual
  // Llamar en DOMContentLoaded

// Exported helpers
extractSlugFromUrl()
  → string

applyMetaTags(page, settings)
  → void
```

### auth.js

```javascript
initAuthListener(options)
  → void
  // options: {
  //   requireAdmin: bool,
  //   onUnauthorized: func,
  //   onReady: func
  // }

// Global state
authState.currentUser      // Firebase User object
authState.isAdmin          // boolean
authState.clientId         // string
authState.claims           // object
```

---

## 🧪 Testing

### Tests Fase 1

```bash
http://localhost:8787/test-blocks.html
```

Esperar que pasen 6/6:
1. ✓ dataLayer.getTenantId()
2. ✓ dataLayer.getPublicSettings()
3. ✓ dataLayer.getPage()
4. ✓ sectionRenderer.renderSection()
5. ✓ pageRouter initialization
6. ✓ Meta tags injection

### Agregar Test para Bloque Nuevo

En `test-blocks.html`:

```html
<section id="test-myBlock">
  <h3>Test: myBlock</h3>
  <div id="output"></div>
  <script type="module">
    import { renderSection } from "./js/sectionRenderer.js";
    
    const section = {
      type: "myBlock",
      props: { ... }
    };
    
    try {
      const html = renderSection(section);
      document.querySelector('#output').innerHTML = html;
      console.log('✓ myBlock test passed');
    } catch (err) {
      console.error('✗ myBlock test failed:', err);
    }
  </script>
</section>
```

---

## 🔐 Auth & Roles

```javascript
// Custom claims en Firebase Auth
{
  clientId: "autoelite",
  role: "admin"  // or "editor" or "viewer"
}

// Verificar en cliente
import { authState } from "./js/auth.js";

if (authState.isAdmin) {
  // Mostrar botón de publicar
}

// En Firestore rules
if (request.auth.token.role == 'admin' && 
    request.auth.token.clientId == clientId) {
  // Allow write
}
```

---

## 📝 Convenciones de Código

### Nombres

```javascript
// Funciones de utilidad
function escapeHtml(text) { ... }
function isDebug() { ... }

// Imports de dataLayer
import { getTenantId, getPage, savePage } from "./dataLayer.js";

// Nomedadores de clases
class SectionEditor { ... }

// Constantes
const CACHE_TTL = 5 * 60 * 1000;
const BLOCK_REGISTRY = { ... };
```

### Estructura de Funciones

```javascript
/**
 * Descripción breve
 * @param {string} param1 - Descripción
 * @returns {Promise<Type>} Descripción del resultado
 */
export async function myFunction(param1) {
  try {
    // Validación
    if (!param1) throw new Error('param1 required');
    
    // Lógica
    const result = await doSomething(param1);
    
    // Log si debug
    if (isDebug()) console.log('✓ Done:', result);
    
    return result;
  } catch (err) {
    console.error('[MyFunction]', err.message);
    return null;
  }
}
```

### Error Handling en Renders

```javascript
function renderMyBlock(props = {}) {
  try {
    // Destructuring con defaults
    const { title = "Default", items = [] } = props;
    
    // Validación defensiva
    if (!Array.isArray(items)) {
      return renderErrorFallback("items must be array");
    }
    
    // HTML
    return `<section>...</section>`;
  } catch (err) {
    return renderErrorFallback(`renderMyBlock: ${err.message}`);
  }
}
```

---

## 📚 Recursos

| Recurso | Link |
|---------|------|
| Plan de Refactor | `REFACTORING_PLAN.md` |
| Arquitectura | `ARCHITECTURE.md` |
| Firestore Schema | `FIRESTORE_SEED.js` |
| Bloques existentes | `BLOCK_GUIDE.md` |
| Seguridad | `FIRESTORE_RULES.md` |
| Migración | `MIGRATION_GUIDE.md` |

---

## 🎯 Próximos Pasos

### Fase 1: Validación (Hoy)
- [ ] Ejecutar tests (test-blocks.html 6/6 ✓)
- [ ] Cargar seed data en Firestore
- [ ] Verificar index-dynamic.html

### Fase 2: Admin Builder (Próxima semana)
- [ ] Crear blockRegistry.js
- [ ] Crear admin-builder.html
- [ ] Implementar DnD de secciones
- [ ] Inspector de props

### Fase 3: Listings & Presets (Siguiente semana)
- [ ] Listings manager
- [ ] Presets (cars, clinic, restaurant)
- [ ] Assets manager
- [ ] Leads form

---

## 🚨 Troubleshooting

### "No puedo resolver tenant"

```javascript
// Verificar en console
window.resolveClientId()
  .then(id => console.log('Tenant:', id))
  .catch(err => console.error('Error:', err));

// O en debug mode
?debug=1
// Ver logs de tenant.js
```

### "Las secciones no se renderizan"

```javascript
// Verificar data en Firestore
db.collection('clients/autoelite/pages').doc('home').get()

// Verificar en console
window.__DATA_LAYER_CACHE.pages  // Ver qué se cachea
window.currentPage.sections      // Estructura

// Verificar sectionRenderer
import { renderSection } from './js/sectionRenderer.js';
renderSection(section, clientId)  // Probar render
```

### "Form no se guarda"

```javascript
// Verificar Auth
window.currentUser       // ¿logueado?
window.isAdmin           // ¿rol correcto?
window.authClaims        // ¿clientId correcto?

// Verificar Firestore rules
// https://console.firebase.google.com/project/[ID]/firestore/rules
// Usar Simulator
```

---

**¿Preguntas? Ver archivos .md de documentación o revisar tests en test-blocks.html**
