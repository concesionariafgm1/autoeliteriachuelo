# Sprint 1 - Motor de Páginas Genérico

**Período:** Semana 1 (3 días ~ 10 horas)  
**Objetivo:** Introducir `pages/{slug}` con routing + rendering genérico, manteniendo sistema actual funcional  
**Estado:** BACKLOG → TODO  

---

## 1. Objetivo del Sprint

Implementar el motor de páginas dinámicas desde Firestore sin romper funcionalidad existente. El sitio debe poder:
- Cargar página "home" desde `clients/{clientId}/pages/home`
- Renderizar secciones genericadas según su `type`
- Fallback a HTML estático si no existe página en Firestore

**No incluir:** Editor visual, drag-drop, versionado, presets.

---

## 2. Alcance Detallado

### 2.1 Implementaciones Requeridas

#### A) Data Layer Enhancement (dataLayer.js)
```javascript
export async function getPagePublished(clientId, slug) {
  // SELECT * FROM clients/{clientId}/pages/{slug}
  // WHERE status = 'published'
  // Retorna: null si no existe o no publicada
  // Cachear 5 min por (clientId, slug)
}
```

**Requisitos:**
- Filter por `status === 'published'`
- Caché en memoria con TTL 5 minutos
- Invalidar caché si el mismo cliente publica una página
- Retornar null si no existe documento
- Logging: "getPagePublished(...) cache HIT/MISS"

---

#### B) Router Público Mejorado (pageRouter.js)
```javascript
// Rutas a soportar:
GET / → slug = "home"
GET /catalogo → slug = "catalogo"
GET /nosotros → slug = "nosotros"
GET /contacto → slug = "contacto"
GET /vehiculos → fallback a vehiculos.html (default)

// No cambiar:
GET /admin/* → sigue siendo admin.html
GET /login → sigue siendo login.html
```

**Requisitos:**
- Detectar slug desde URL pathname
- Llamar `getPagePublished(clientId, slug)`
- Si retorna página: renderizar con sectionRenderer
- Si retorna null: fallback a HTML estático (no romper)
- Inyectar meta tags (SEO) desde page.metadata o defaults
- NO duplicar lógica actual (refactorizar si es necesario)

---

#### C) Section Renderer Genérico (sectionRenderer.js)
Mejorar el existente para ser completamente genérico:

```javascript
export function renderPage(page, clientId) {
  // page.sections = [ {id, type, props}, ... ]
  // Retorna: string de HTML renderizado
  
  return page.sections
    .map(section => renderSection(section, clientId))
    .join('');
}

export function renderSection(section, clientId) {
  // section = { id, type: "hero" | "richText" | ..., props }
  
  const renderer = blockRegistry[section.type];
  if (!renderer) {
    return `<!-- ERROR: tipo de bloque desconocido "${section.type}" -->`;
  }
  
  return renderer.render(section.props, clientId);
}
```

**Requisitos:**
- Mantener renderización idéntica a la actual para bloques existentes
- Agregar error fallback si bloque desconocido
- No cambiar interfaz de blockRegistry

---

#### D) Block Registry Base (blockRegistry.js)

Definir **MÍNIMO** estos 5 bloques (ya creados en trabajo anterior):

1. **hero**
   ```json
   {
     "type": "hero",
     "props": {
       "title": "string",
       "subtitle": "string",
       "bgImage": "asset-id",
       "ctaText": "string",
       "ctaUrl": "string"
     }
   }
   ```

2. **richText**
   ```json
   {
     "type": "richText",
     "props": {
       "html": "string (escaped HTML)",
       "backgroundColor": "string (hex)"
     }
   }
   ```

3. **servicesGrid**
   ```json
   {
     "type": "servicesGrid",
     "props": {
       "title": "string",
       "services": [
         { "id": "s1", "icon": "emoji", "title": "Servicio 1", "description": "..." }
       ]
     }
   }
   ```

4. **listingsGrid** (GENÉRICO)
   ```json
   {
     "type": "listingsGrid",
     "props": {
       "title": "Catálogo",
       "itemType": "vehicle",  // ← definido por cliente
       "filters": ["brand", "year"],
       "limit": 12
     }
   }
   ```
   Debe queryar: `clients/{clientId}/content/listings`
   Filtrar por: `type === itemType`

5. **contactForm**
   ```json
   {
     "type": "contactForm",
     "props": {
       "title": "Contacto",
       "description": "...",
       "fields": [
         { "id": "name", "label": "Nombre", "fieldType": "text", "required": true },
         { "id": "email", "label": "Email", "fieldType": "email", "required": true }
       ]
     }
   }
   ```

---

### 2.2 Modelo Firestore (Crear Nueva Estructura)

#### Nueva Colección: pages
```
clients/{clientId}/pages/{slug}
├── id: string
├── slug: string
├── title: string
├── status: "published" | "draft"
├── sections: array
│   ├── [0]
│   │   ├── id: string (ej: "hero-1")
│   │   ├── type: string (ej: "hero")
│   │   └── props: object
│   ├── [1]
│   │   ├── id: string
│   │   ├── type: string
│   │   └── props: object
│   └── ...
├── metadata: object
│   ├── title: string (para SEO)
│   ├── description: string (meta description)
│   └── image: string (og:image)
├── createdAt: timestamp
├── updatedAt: timestamp
└── publishedAt: timestamp (null si draft)
```

#### Documento Ejemplo: HOME PAGE
```
Colección: clients/autoelite-concesionaria/pages
Documento: home

{
  "id": "home",
  "slug": "home",
  "title": "Inicio - AutoElite",
  "status": "published",
  "sections": [
    {
      "id": "hero-1",
      "type": "hero",
      "props": {
        "title": "AutoElite - Vehículos de Calidad",
        "subtitle": "Las mejores opciones en vehículos premium",
        "bgImage": "asset-bg-001",
        "ctaText": "Ver Catálogo",
        "ctaUrl": "/catalogo"
      }
    },
    {
      "id": "services-1",
      "type": "servicesGrid",
      "props": {
        "title": "Nuestros Servicios",
        "services": [
          {
            "id": "svc-1",
            "icon": "🔧",
            "title": "Financiación",
            "description": "Planes flexibles de pago"
          },
          {
            "id": "svc-2",
            "icon": "🛡️",
            "title": "Garantía",
            "description": "Garantía de fábrica incluida"
          }
        ]
      }
    },
    {
      "id": "listings-1",
      "type": "listingsGrid",
      "props": {
        "title": "Catálogo de Vehículos",
        "itemType": "vehicle",
        "filters": ["brand", "year", "price"],
        "limit": 12
      }
    },
    {
      "id": "contact-1",
      "type": "contactForm",
      "props": {
        "title": "Contáctanos",
        "description": "Completa el formulario y nos comunicaremos",
        "fields": [
          {"id": "nombre", "label": "Nombre", "fieldType": "text", "required": true},
          {"id": "email", "label": "Email", "fieldType": "email", "required": true},
          {"id": "mensaje", "label": "Mensaje", "fieldType": "textarea", "required": true}
        ]
      }
    }
  ],
  "metadata": {
    "title": "AutoElite - Vehículos Premium",
    "description": "Los mejores vehículos de calidad a precios competitivos",
    "image": "asset-og-001"
  },
  "createdAt": {"_seconds": 1740153600},
  "updatedAt": {"_seconds": 1740153600},
  "publishedAt": {"_seconds": 1740153600}
}
```

#### Documento Ejemplo: CATALOGO PAGE
```
Colección: clients/autoelite-concesionaria/pages
Documento: catalogo

{
  "id": "catalogo",
  "slug": "catalogo",
  "title": "Catálogo de Vehículos",
  "status": "published",
  "sections": [
    {
      "id": "hero-cat",
      "type": "hero",
      "props": {
        "title": "Nuestro Catálogo",
        "subtitle": "Explora todos nuestros vehículos disponibles",
        "bgImage": "asset-bg-002",
        "ctaText": "Contactar",
        "ctaUrl": "#contacto"
      }
    },
    {
      "id": "listings-cat",
      "type": "listingsGrid",
      "props": {
        "title": "Todos los Vehículos",
        "itemType": "vehicle",
        "filters": ["brand", "year", "price", "mileage"],
        "limit": 50
      }
    }
  ],
  "metadata": {
    "title": "Catálogo Completo - AutoElite",
    "description": "Todos nuestros vehículos disponibles en una sola página",
    "image": "asset-og-002"
  },
  "createdAt": {"_seconds": 1740153600},
  "updatedAt": {"_seconds": 1740153600},
  "publishedAt": {"_seconds": 1740153600}
}
```

#### Mantener Estructura Existente (NO CAMBIAR)
```
clients/{clientId}/settings/public
├── businessName
├── logo
├── primary_color
├── contact_email
└── [campos actuales]

clients/{clientId}/content/listings/{id}
├── type: "vehicle"
├── title
├── description
├── brand
├── model
├── year
├── price
├── image
└── [campos existentes - NO ROMPER]
```

---

### 2.3 Cambios Mínimos a Archivos Existentes

#### index-dynamic.html
```html
<!-- NO CAMBIAR - sigue igual -->
<!-- El router.js cargará el contenido dinámico -->
<div id="content"></div>
```

#### js/dataLayer.js
**Agregar SOLO:**
```javascript
// Nuevas funciones (las existentes se mantienen igual)
export async function getPagePublished(clientId, slug) { ... }

// Podría refactorizar getPage para usar getPagePublished,
// pero NO es obligatorio en Sprint 1
```

#### js/pageRouter.js
**Refactorizar la parte de routing, mantener SEO setup:**
```javascript
// Router actual + nueva lógica para pages/
// Mantener compatibilidad con vehiculos.html fallback
```

#### js/sectionRenderer.js
**Mantener como está, agregar:**
```javascript
// Nueva función renderPage + renderSection
// Las funciones actuales se mantienen igual
```

#### js/blockRegistry.js
**Crear archivo nuevo (ya existe en trabajo anterior)**
- Incluir los 5 bloques base
- Mantener posibilidad de extensión

#### admin.js, vehicles.js, vehiculos.html
**NO CAMBIAR NADA** - coexisten durante Sprint 1

---

## 3. Tasks Técnicas Desglosadas

### Task 1: Crear blockRegistry.js (3h)
- [ ] Definir estructura base (exports, interfaces)
- [ ] Implementar hero block
- [ ] Implementar richText block
- [ ] Implementar servicesGrid block
- [ ] Implementar listingsGrid block (query genérica)
- [ ] Implementar contactForm block
- [ ] Testear cada render en test-blocks.html

**Entrada:** Especificación de bloques  
**Salida:** js/blockRegistry.js funcional  

---

### Task 2: Extender dataLayer.js (2h)
- [ ] Implementar `getPagePublished(clientId, slug)`
- [ ] Agregar caché con TTL 5 minutos
- [ ] Añadir invalidación de caché al guardar
- [ ] Logging de cache HIT/MISS
- [ ] Testear con datos Firestore reales

**Entrada:** Especificación de datos  
**Salida:** dataLayer.js con getPagePublished  

---

### Task 3: Refactorizar pageRouter.js (3h)
- [ ] Mantener lógica SEO actual
- [ ] Agregar slug detection (/ → home, /catalogo → catalogo)
- [ ] Integrar `getPagePublished()`
- [ ] Implementar fallback a HTML estático
- [ ] Testear rutas: /, /catalogo, /contacto, /vehiculos, /no-existe

**Entrada:** pageRouter.js actual  
**Salida:** pageRouter.js mejorado  

---

### Task 4: Mejorar sectionRenderer.js (2h)
- [ ] Crear `renderPage(page, clientId)`
- [ ] Crear `renderSection(section, clientId)`
- [ ] Integrar blockRegistry
- [ ] Comprobar compatibilidad con bloques existentes
- [ ] Error fallback para bloques desconocidos

**Entrada:** sectionRenderer.js actual + blockRegistry.js  
**Salida:** sectionRenderer.js mejorado  

---

### Task 5: Crear Firestore Documents Manuales (1h)
- [ ] Crear documento `pages/home` en Firestore (admin console)
- [ ] Crear documento `pages/catalogo` en Firestore
- [ ] Validar estructura vs. modelo

**Entrada:** Ejemplos dados arriba  
**Salida:** Documentos en Firestore  

---

### Task 6: Testing e Integración (2h)
- [ ] Probar: GET / carga home desde Firestore
- [ ] Probar: GET /catalogo carga catalogo desde Firestore
- [ ] Probar: GET /vehiculos fallback a HTML (no existe en Firestore)
- [ ] Probar: GET /no-existe fallback sin error
- [ ] Verificar no se rompió admin.html
- [ ] Verificar caché funciona

**Entrada:** Código + Firestore  
**Salida:** Sprint 1 funcional  

---

## 4. Criterios de Aceptación

### CA1: Motor Funciona
- [ ] Usuario abre https://autoelite.com/ → Carga home desde Firestore ✓
- [ ] Usuario abre https://autoelite.com/catalogo → Carga catalogo desde Firestore ✓
- [ ] Usuario abre https://autoelite.com/vehiculos → Fallback a vehiculos.html ✓
- [ ] Usuario abre https://autoelite.com/no-existe → No error, fallback graceful ✓

### CA2: Secciones se Renderizan
- [ ] Hero block renderiza con título + imagen + CTA ✓
- [ ] RichText block renderiza HTML escaped ✓
- [ ] ServicesGrid renderiza grid de servicios ✓
- [ ] ListingsGrid queryea content/listings + renderiza items ✓
- [ ] ContactForm renderiza campos + validación ✓

### CA3: Compatibilidad
- [ ] Sistema antiguo (admin.html, vehicles.js) sigue funcionando ✓
- [ ] Caché en cliente funciona (verificar en DevTools) ✓
- [ ] SEO: Meta tags inyectados correctamente ✓
- [ ] No hay console errors ✓

### CA4: Performance
- [ ] Tiempo carga página < 2 segundos (first paint) ✓
- [ ] No más de 3 queries Firestore para cargar página ✓
- [ ] Caché previene queries repetidas ✓

### CA5: Documentación
- [ ] Documento de esquema Firestore actualizado ✓
- [ ] README de blockRegistry escrito ✓
- [ ] Ejemplos de datos en Firestore documentados ✓

---

## 5. Dependencias Externas

- ✅ Firebase (Auth + Firestore) — ya configurado
- ✅ blockRegistry.js — ya creado en trabajo anterior
- ✅ outputsSystem.js — ya creado en trabajo anterior
- ⚠️ Firestore documents manuales — deben existir para testear

---

## 6. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|--------|-----------|
| Romper admin.html actual | Alta | Alto | Hacer todos los cambios non-breaking; testear admin después de cada task |
| Performance: demasiadas queries | Media | Medio | Implementar caché TTL 5 min; logging |
| Firestore schema mal diseñado | Media | Alto | Validar estructura con equipo antes de Task 5 |
| Compatibilidad blockRegistry | Baja | Medio | Testear con test-blocks.html |

---

## 7. Definición de "Done"

Se considera Sprint 1 completado cuando:

1. ✅ Se puede crear documento `pages/home` en Firestore
2. ✅ Usuario abre sitio → Carga contenido de `pages/home` dinámicamente
3. ✅ Se pueden crear bloques adicionales (hero, listings, contact)
4. ✅ Sistema antiguo (vehiculos.html) sigue funcionando sin cambios
5. ✅ No hay console.errors o warnings no solucionados
6. ✅ Caché funciona (verificable en DevTools)
7. ✅ Todo documentado

---

## 8. Timeline Estimado (3 días = 10 horas)

| Task | Horas | Días |
|------|-------|------|
| Task 1: blockRegistry.js | 3 | Día 1 |
| Task 2: getPagePublished() | 2 | Día 1 |
| Task 3: pageRouter refactor | 3 | Día 2 |
| Task 4: sectionRenderer enhance | 2 | Día 2 |
| Task 5: Crear docs Firestore | 1 | Día 3 |
| Task 6: Testing | 2 | Día 3 |
| **TOTAL** | **13h** | **~3 días** |

*Ajustar si aparecen bloqueos. Priorizar Task 3 (router) si hay limitaciones de tiempo.*

---

## 9. Notas Finales

- **No es architect decision exhaustivo.** Este Sprint valida el motor; decisiones finales sobre presets, versionado, etc. se toman en retrospectiva.
- **Puede evolucionar.** Si durante implementation se encuentra que Task X consume más tiempo, ajustamos Task Y.
- **Code review:** Cada task requiere code review antes de pasar a siguiente (non-blocking pero recomendado).

**Responsable Sprint:** Tech Lead  
**Fecha Creación:** 21 de febrero de 2026
