# 📋 Guía de Migración - De Concesionaria Estática a Builder Dinámico

## 🎯 Objetivo

Migrar el sitio de **páginas HTML estáticas hardcodeadas** a un **sistema dinámico por Firestore**, sin romper dominios activos ni experiencia de usuarios.

---

## 🔄 Fases de Migración

### **PRE-MIGRACIÓN (Hoy)**

**Estado actual:**
```
index.html          ← Home estático
vehiculos.html      ← Página de vehículos
contacto.html       ← Formulario de contacto
nosotros.html       ← Página de información
admin.html          ← Admin específico de autos
js/admin.js         ← Lógica admin de autos
js/vehicles.js      ← Filtros específicos de vehículos
sw.js               ← Cache "autoelite-v1"
```

**Problema:** Toda lógica está pegada a "vehículos" y "concesionaria"

---

### **FASE 1: Infraestructura Dinámica (Complet/Verificar)**

**Qué pasa:**
```
index-dynamic.html  ← Nuevo home dinámico (lee settings desde Firestore)
/:slug              ← Rutas dinámicas (lee páginas desde Firestore)
js/dataLayer.js     ← Abstracción de Firestore (genérica)
js/sectionRenderer.js ← Motor de renderizado (12+ tipos)
js/pageRouter.js    ← Router (home → "home" doc, /x → "x" doc)
test-blocks.html    ← Suite de tests
```

**El sitio viejo aún existe e intacto:**
```
index.html          ← Aún funciona (fallback)
vehiculos.html      ← Aún funciona
admin.html          ← Aún funciona
```

**Flujo dual:**
- Usuario accede a `index.html` → Mira home viejo (OK)
- Usuario accede a `index-dynamic.html` → Mira home dinámico (datos de Firestore)
- Usuario accede a `/:slug` → PageRouter (si existe documento) (Nuevo)

**Criterios de Success:**
- ✅ `test-blocks.html` pasa 6/6 tests
- ✅ `index-dynamic.html` carga sin errores
- ✅ ReferenceError cero en console
- ✅ Meta tags se inyectan dinámicamente
- ✅ Firestore tiene datos de ejemplo

---

### **FASE 2: Admin Builder (Luego)**

**Qué pasa:**
```
admin-builder.html  ← Nuevo admin genérico (arrastrar-soltar)
js/adminBuilder.js  ← UI del editor
js/formBuilder.js   ← Generador de formularios dinámicos
js/blockRegistry.js ← Registro de tipos de bloques
```

**Admin viejo aún accesible:**
```
admin.html          ← Admin viejo (deprecation notice)
js/admin.js         ← Código viejo (no se usa)
js/vehicles.js      ← Código viejo (reemplazado por listingsGrid)
```

**Cambio de flujo:**
- Antes: Admin edita vehículos en tabla > guardar en Firebase
- Después: Admin edita página en builder > arrastra secciones > publica

---

### **FASE 3: Unificación & Deprecación**

**Qué pasa:**
```
vehiculos.html      → Redirect a /catalogo (documento dinámico)
contacto.html       → Redirect a /contacto (documento dinámico)
nosotros.html       → Redirect a /sobre-nosotros (documento dinámico)
index.html          → Redirect a / (index-dynamic.html)
admin.html          → Redirect a /admin-builder (con deprecation)
```

**Resultado:**
```
Una única URL base serve TODOS los rubros:
/ = home
/catalogo = listing de productos (puede ser autos, servicios, comida, etc.)
/contacto = formulario
/sobre-nosotros = página info
/admin = builder de páginas
```

---

## 🛠️ Cambios por Componente

### **1. Front: index.html → index-dynamic.html**

**ANTES:**
```html
<!-- index.html - Hardcodeado -->
<h1>Concesionaria AutoElite - Autos Usados en Corrientes</h1>
<a href="vehiculos.html">Ver Catálogo</a>
```

**DESPUÉS:**
```html
<!-- index-dynamic.html - Dinámico -->
<h1 id="heroTitle"><!-- Se carga desde Firestore --></h1>
<a href="/" id="ctaButton"><!-- Se configura desde settings --></a>

<script type="module">
  import { getTenantId, getPublicSettings } from "./js/dataLayer.js";
  const clientId = await getTenantId();
  const settings = await getPublicSettings(clientId);
  document.querySelector('#heroTitle').textContent = settings.heroTitle;
</script>
```

**Ventaja:** Cambiar el título no requiere redeploy; solo editar Firestore.

---

### **2. Rutas: vehiculos.html → /catalogo (slug dinámico)**

**ANTES:**
```
vehiculos.html
├─ Query: ?marca=Chevrolet&modelo=...
├─ Filtros en JS
└─ Listados en grid hardcodeado
```

**DESPUÉS:**
```
/ + pageRouter
├─ Detecta slug "catalogo"
├─ Carga documento: clients/autoelite/pages/catalogo
├─ Documento contiene:
│  {
│    title: "Catálogo de Vehículos",
│    sections: [
│      {
│        type: "listingsGrid",
│        props: {
│          listingsType: "vehicle",
│          columns: 3,
│          filters: {...}
│        }
│      }
│    ]
│  }
├─ sectionRenderer renderiza listingsGrid
└─ ListingsGrid carga listings desde Firestore dinámicamente
```

**Ventaja:** Mismo componente "listingsGrid" sirve para autos, servicios, comida, etc.

---

### **3. Admin: admin.html → admin-builder.html**

**ANTES:**
```
admin.html
└─ Tabla de vehículos (CRUD)
   ├─ Agregar vehículo
   ├─ Editar propiedades (marca, modelo, año, precio, etc.)
   └─ Eliminar
```

**DESPUÉS:**
```
admin-builder.html
└─ Page Manager
   ├─ Listar páginas (home, catalogo, contacto, etc.)
   ├─ Crear/editar página
   └─ En editor:
      ├─ Panel izq: Sections (draggable)
      ├─ Panel central: Preview responsive
      └─ Panel der: Inspector de props (dinámico p/ cada tipo)
```

**Cambio conceptual:**
- Antes: "Editar items en tabla"
- Después: "Construir página por bloques"

---

### **4. Cache: sw.js parameterizado**

**ANTES:**
```javascript
const CACHE_NAME = 'autoelite-v1'; // Hardcodeado
```

**DESPUÉS:**
```javascript
// Resolver tenant ID en offline mode
async function getCacheName() {
  const clientId = await resolveTenantIdFromHostname() || 'default';
  return `tenant-${clientId}-v${CACHE_VERSION}`;
}

// Uso
addEventListener('install', async (event) => {
  const cacheName = await getCacheName();
  caches.open(cacheName).then(cache => {...});
});
```

**Ventaja:** Cada tenant tiene su propio cache; no se mezclan datos.

---

### **5. Firestore Schema**

**ANTES: NO EXISTÍA (datos en admin.js JSON locals)**

**DESPUÉS: Estructura Completa**

```javascript
// Crear documento: domains/localhost
{
  clientId: "autoelite"
}

// Crear documento: clients/autoelite/settings/public
{
  brand: {
    name: "AutoElite",
    logoAssetId: "xyz123",
    colors: {
      primary: "#E50914",
      secondary: "#333"
    }
  },
  social: {
    whatsapp: "5493794123456",
    instagram: "@autoelitecorrientes",
    facebook: "autoelite.corrientes"
  },
  seoDefaults: {
    titleTemplate: "%s | AutoElite - Concesionaria",
    defaultDescription: "Compra y venta de vehículos usados...",
    ogImageAssetId: "logo-og-123"
  },
  navDefaults: {
    showHome: true,
    showBlog: false
  },
  preset: "cars" // "cars" | "clinic" | "restaurant" | ...
}

// Crear página: clients/autoelite/pages/home
{
  slug: "home",
  status: "published",
  meta: {
    title: "AutoElite - Concesionaria de Autos en Corrientes",
    description: "Venta de vehículos usados y 0km",
    ogImageAssetId: "og-home-123"
  },
  nav: {
    label: "Inicio",
    showInNav: true,
    order: 1
  },
  sections: [
    {
      id: "hero-1",
      type: "hero",
      props: {
        title: "Bienvenido a AutoElite",
        subtitle: "Encuentra tu próximo auto",
        bgImageAssetId: "bg-hero-123",
        cta: { text: "Ver Catálogo", link: "/catalogo" }
      }
    },
    {
      id: "listings-1",
      type: "listingsGrid",
      props: {
        listingsType: "vehicle", // Tipo de item a mostrar
        columns: 3,
        sort: { field: "createdAt", direction: "desc" },
        filters: {
          status: "published"
        }
      }
    }
  ],
  updatedAt: 1708534800000
}

// Crear página: clients/autoelite/pages/catalogo
{
  slug: "catalogo",
  status: "published",
  // ... similar a home
}

// Crear listing: clients/autoelite/content/listings/vehicle-001
{
  status: "published",
  type: "vehicle", // Tipo genérico (vehicle, service, product)
  title: "Chevrolet Cruze 2020",
  description: "Vehículo en excelente estado, 60.000 km",
  price: 1250000,
  tags: ["usado", "sedan"],
  category: "sedan", // Opcional, para filtros
  media: [
    {
      assetId: "vehicle-001-img1",
      alt: "Frente del Chevrolet Cruze"
    }
  ],
  attributes: {
    marca: "Chevrolet",
    modelo: "Cruze",
    año: 2020,
    transmision: "automática",
    combustible: "nafta",
    km: 60000
  },
  createdAt: 1708534800000
}
```

---

## 📊 Tabla de Equivalencias

| Concepto Viejo | Concepto Nuevo | Ubicación |
|---|---|---|
| `index.html` (home estático) | `clients/{clientId}/pages/home` doc | Firestore |
| `vehiculos.html` (página estática) | `clients/{clientId}/pages/catalogo` doc | Firestore |
| `admin.html` - Tabla de autos | `admin-builder.html` - Page manager | nuevo HTML |
| Filtros en `js/vehicles.js` | Dinámicos en `listingsGrid` | props |
| SEO hardcodeado en `<meta>` | Inyectado dinámicamente desde `page.meta` | Firestore |
| Categorías hardcodeadas | `category` field en listing | flexible |
| Imágenes en `assets/` | URLs en Firestore `assets/{assetId}` | Cloud storage |

---

## 🛡️ Garantías de Compatibilidad

### ✅ URLs Públicas

Todos los URLs públicos siguen funcionando:

```
/ → index.html (hoy) → index-dynamic.html (mañana, con redirect)
/vehiculos.html → leer de /catalogo
/contacto.html → leer de /contacto
/admin.html → leer de /admin-builder (con notificación deprecado)
```

Redirect rules (`_redirects`):
```
/index.html     /                     301
/vehiculos.html /catalogo             301
/contacto.html  /contacto             301
/nosotros.html  /sobre-nosotros       301
/admin.html     /admin-builder        301  (solo si está loggueado)
```

### ✅ Dominios & Tenant Resolution

El `js/tenant.js` NO cambia:
```javascript
// Sigue funcionando igual
const clientId = await resolveTenantId();
// Ej: localhost → "autoelite"
//     concesionaria.com.ar → "autoelite"
//     tuclínica.com.ar → "dentist-001"
```

### ✅ Authentication & Roles

El `js/auth.js` NO cambia:
```javascript
// Custom claims siguen siendo válidos
{
  role: "admin" | "editor",
  clientId: "autoelite"
}
```

### ✅ Firestore Security Rules

El `firestore.rules` se mejora pero sigue protegiendo:
```
Lectura pública: settings, pages/published, listings/published, assets
Lectura privada: pages/draft, leads, user-specific data
Escritura: solo authenticated users del tenant correcto
```

---

## 🚨 Puntos Críticos de Migración

### 1. **Datos Iniciales en Firestore**

**Paso crucial:** Cargar estructura inicial antes de Fase 1

```bash
# Crear collection domains/
db.collection('domains').doc('localhost').set({
  clientId: 'autoelite'
});

# Crear collection clients/autoelite/settings/
db.collection('clients').doc('autoelite').collection('settings').doc('public').set({
  brand: { name: 'AutoElite', ... },
  // ...
});

# Crear página home
db.collection('clients').doc('autoelite').collection('pages').doc('home').set({
  slug: 'home',
  status: 'published',
  // ...
});
```

Ver `FIRESTORE_SEED.js` para estructura completa.

### 2. **Testing en Staging Primero**

```
1. Usar dominio de prueba (staging.autoelite.com)
2. Cargar datos de ejemplo en Firestore
3. Verificar:
   - test-blocks.html (6/6 tests ✓)
   - index-dynamic.html carga
   - Meta tags dinámicos
   - Lazy-load funciona
4. Luego promover a producción
```

### 3. **Monitoring Post-Deploy**

```javascript
// Verificar en console
window.__DATA_LAYER_CACHE // Ver qué se cachea
window.__TENANT_CACHE // Ver tenant resuelto
window.location.pathname // Ver slug actual

// En servicios de monitoreo
- Error rate de dataLayer
- Cache hit ratio
- Tiempo de carga de páginas dinámicas
```

---

## 📈 Timeline de Cutover

### **Semana 1: Preparación**

- [ ] Cargar datos ejemplo en Firestore staging
- [ ] Tests locales de index-dynamic.html
- [ ] Validar que admin.html viejo aún funciona

### **Semana 2: Soft Launch**

- [ ] Deploy de `index-dynamic.html` (NO como index por ahora)
- [ ] URL: `/dynamic-home.html` (acceso limitado)
- [ ] Monitoreo de errores
- [ ] Feedback de usuarios (si aplica)

### **Semana 3: Hard Cutover (Fase 1 Complete)**

- [ ] Cambiar redirect: `index.html` → `index-dynamic.html`
- [ ] Deprecation notice en `admin.html` viejo
- [ ] Documentar en README transición completa

### **Semana 4-5: Admin Builder (Fase 2)**

- [ ] Deploy `admin-builder.html`
- [ ] Entrenar admins
- [ ] Test real de edit/publish

### **Semana 6: Deprecación Total (Fase 3)**

- [ ] Remover archivos viejos (html estáticos)
- [ ] Limpiar JS no usado
- [ ] Optimizar service worker

---

## 🎓 Documentación para Stakeholders

### Para **Usuarios Finales** (No cambia nada)
- URLs públicos siguen igual
- Contenido actualizado más rápido (no requiere redeploy)
- Mejor SEO (meta tags dinámicos)

### Para **Admins** (Cambio de herramienta)
- Viejo: Tabla de vehículos (específica de autos)
- Nuevo: Builder de páginas (genérico, cualquier rubro)
- Benefit: Puede crear páginas nuevas sin desarrolladores

### Para **Desarrolladores** (Cambio de arquit.)
- Viejo: Código acoplado a "concesionaria"
- Nuevo: Código genérico, multi-tenant, sin supuestos
- Benefit: Reutilizable para otros rubros/clientes

---

## ✅ Pre-Checklist para Comenzar Migración

- [ ] `test-blocks.html` pasa todos los tests
- [ ] `index-dynamic.html` no tiene errors en console
- [ ] Firestore seed data está cargada
- [ ] Dominios resolveClientId correctamente
- [ ] Auth custom claims funcionan
- [ ] Service worker cachea sin mezclar tenants
- [ ] Meta tags dinámicos se inyectan
- [ ] Imágenes lazy-load funciona
- [ ] CORS headers están configurados (Cloudflare)
- [ ] Backup de data vieja hecho (por si rollback)

---

**Próximo paso:** Ejecutar pre-checklist y proceder con Fase 1 actual.
