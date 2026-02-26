# 🏗️ Plan de Refactor - SaaS Website Builder Multi-Tenant

## Resumen Ejecutivo

Este repositorio será transformado de un sitio acoplado a "concesionaria de autos" a un **builder multi-tenant genérico** sin cambios disruptivos en producción. El plan es incremental: preservar dominios/tenant resolution, introducir motor genérico, deprecar código viejo gradualmente.

**Timeline:** ~6 semanas (3 fases)  
**Riesgo:** Bajo (cambios son aditivos principalmente)  
**Mantenibilidad:** Mejora significativa

---

## 📊 Análisis del Estado Actual

### ✅ Fortalezas Existentes

1. **Tenant resolution por hostname** (`js/tenant.js`)
   - Ya resuelve `clientId` desde dominio
   - Cachea correctamente
   - Este pilar NO debe tocarse

2. **Arquitectura Data Layer** (`js/dataLayer.js`)
   - Interfaz CRUD clara
   - Caché con TTL
   - Funciones para: getTenantId, getPublicSettings, getPage, getListings
   - Diseño extensible ✓

3. **Section Renderer** (`js/sectionRenderer.js`)
   - 12 tipos de bloques base (hero, richText, servicesGrid, listingsGrid, etc.)
   - Defensivo contra errores
   - Validación de props y fallbacks
   - Extensible por tipo ✓

4. **Page Router** (`js/pageRouter.js`)
   - Enrutamiento por slug (/)  → home, /:slug → página
   - Meta tags dinámicos (SEO)
   - Manejo de 404
   - Preview mode plantillizado

5. **Firebase Integration** (`js/firebase.js`, `js/auth.js`)
   - Auth listeners con custom claims
   - Roles admin/editor resolvibles
   - Integración con Firestore

### ❌ Acoplamientos a "Concesionaria"

| Archivo | Acoplamiento | Solución |
|---------|--------------|----------|
| `vehiculos.html` | Página hardcodeada de vehículos con SEO acoplado | Deprecar → /:slug dinámica |
| `contacto.html` | Página hardcodeada de contacto | Deprecar → /:slug dinámica |
| `nosotros.html` | Página hardcodeada de nosotros | Deprecar → /:slug dinámica |
| `index.html` | Home específico de autos | Deprecar → index-dynamic.html como índice |
| `admin.html` | Admin orientado solo a vehículos | Reemplazar por admin genérico |
| `js/admin.js` | CRUD de vehículos, no genérico | Reemplazar por generalizado |
| `js/vehicles.js` | Lógica específica de vehículos | Convertir a listingsGrid genérico |
| `sw.js` | Cache name: "autoelite-v1" (hardcodeado) | Parameterizar por tenant |
| `_redirects` | Redirige vehiculos.html → /vehiculos | Cambiar a dinámico |
| Meta tags en HTML | "Concesionaria de autos" hardcodeado | Inyectar desde settings |
| Nombres de marcas/modelos | Lógica de filtros específica de autos | Genericizar en listingsGrid |

### 📁 Archivos Que Cambian vs. Intocables

**SIN CAMBIOS (Pilar del Sistema):**
- `js/tenant.js` — Resolución por hostname
- `js/firebase.js` — Inicialización Firebase
- `firestore.rules` — (verificar, pero base sólida)
- `js/auth.js` — Auth listener base

**REFACTOR (Mejorar, no reescribir):**
- `js/dataLayer.js` — Copmleto, pero verificar tipos dinámicos
- `js/sectionRenderer.js` — Ampliar tipos y hacer más maduro
- `js/pageRouter.js` — Mejorar manejo de draft/published y preview

**DEPRECAR (Gradualmente):**
- `vehiculos.html` → Redirect a `/catalogo` (slug dinámico)
- `contacto.html` → Redirect a `/contacto` (slug dinámico)
- `nosotros.html` → Redirect a `/sobre-nosotros` (slug dinámico)
- `admin.html` (viejo) → Reemplazar por admin builder genérico
- `js/admin.js` → Nuevas funciones admin
- `js/vehicles.js` → Deprecar, los datos van a listings

**CREAR (Nuevo):**
- `js/adminBuilder.js` — UI del builder (sections list, drag-drop, inspector)
- `js/blockRegistry.js` — Registro central de tipos de bloques
- `js/formBuilder.js` — Constructor dinámico de formularios para props
- `admin-builder.html` — New admin UI (page manager + editor)
- `js/presetLoader.js` — Cargar presets (cars, clinic, restaurant, etc.)
- `PRESETS.md` — Guía de cómo crear presets
- `BLOCK_GUIDE.md` — Guía de cómo agregar bloques

---

## 🎯 Plan de Fases

### FASE 1: Motor de Páginas & Secciones ✅ (YA EXISTE, VALIDAR)

**Objetivo:** Asegurar que core dynammic rendering funciona sin romper nada

**Tareas:**
1. ✅ Data Layer (COMPLETO)
2. ✅ Section Renderer con 12 tipos (COMPLETO)
3. ✅ Page Router (COMPLETO)
4. 🔄 **Validación:** Cargar datos de ejemplo en Firestore y verificar test-blocks.html
5. 🔄 **Documentación:** Guías de modelo de datos y uso
6. 🔄 **Compatibilidad:** Asegurar que meta tags, SEO, cache funcionan

**Criterios de Terminado:**
- [ ] `test-blocks.html` pasa todos los tests (6/6)
- [ ] `index-dynamic.html` carga home y navega a /:slug sin errores
- [ ] Meta tags dinámicos se inyectan correctamente
- [ ] Imágenes lazy-load funciona
- [ ] Cache no mezcla tenants
- [ ] Firestore rules documentadas (aunque no nuevas)

**Duración:** 4-6 horas (setup + validación)

**Deliverables:**
- `FIRESTORE_SEED.js` ✅ (completo)
- `IMPLEMENTATION_GUIDE.md` ✅ (actualización)
- `PHASE_1_COMPLETE.md` ✅ (resumen)
- `ARCHITECTURE.md` ✅ (documentación)

---

### FASE 2: Admin Builder Genérico

**Objetivo:** Interface web para construir páginas sin código

**Duración:** 10-12 horas

**Tareas:**

#### 2.1 Page Manager (Listing + CRUD)
- [ ] Listar páginas publicadas + drafts
- [ ] Crear página nueva (form: slug, title, status)
- [ ] Duplicar página
- [ ] Soft delete
- [ ] Cambiar status (draft ↔ published)

#### 2.2 Page Editor Layout
- [ ] **Panel izquierdo:** Sections list (nombre, tipo, orden)
- [ ] **Panel central:** Preview responsive (desktop/tablet/mobile)
- [ ] **Panel derecho:** Inspector de props (form dinámico según tipo)

#### 2.3 Edición de Secciones
- [ ] Agregar sección (select de tipo)
- [ ] Reordenar por drag-drop
- [ ] Editar props (form autogenerado por schema del bloque)
- [ ] Cambiar visibilidad/variantes
- [ ] Eliminar sección

#### 2.4 Draft & Publish
- [ ] Guardar draft (autosave cada 30s)
- [ ] Publicar (promueve draft a published)
- [ ] Previsualizar draft (URL especial: `/preview/:slug?token=...`)
- [ ] Revertir a versión publicada
- [ ] Dirty state (alerta si se intenta salir sin guardar)

**Criterios de Terminado:**
- [ ] CRUD de páginas funciona
- [ ] Drag-drop de secciones funciona
- [ ] Form dinámico se genera según tipo de bloque
- [ ] Draft/publish hace sync a Firestore
- [ ] Preview muestra draft (no published)
- [ ] Autosave funciona sin conflictos

**Nuevos archivos:**
- `admin-builder.html` (UI principal)
- `js/adminBuilder.js` (lógica de layout + DnD)
- `js/formBuilder.js` (generador de formularios dinámicos)
- `js/blockRegistry.js` (registro central de bloques + schemas)
- `ADMIN_GUIDE.md` (guía para admins)

---

### FASE 3: Listings Genéricos & Presets

**Objetivo:** Reemplazar hardcoded "vehículos" con sistema genérico

**Duración:** 8-10 horas

**Tareas:**

#### 3.1 Listings Manager (Admin)
- [ ] CRUD de items en una collection genérica
- [ ] Status (draft/published)
- [ ] Categorías/filtros dinámicos
- [ ] Upload de assets
- [ ] Propiedades dinámicas según rubro

#### 3.2 Block: ListingsGrid Mejorado
- [ ] Mostrar listings de cualquier tipo
- [ ] Filtros y búsqueda
- [ ] Paginación
- [ ] Lazy-load de imágenes
- [ ] Responsive grid

#### 3.3 Presets Verticales
- [ ] Preset "Cars" (concesionaria)
  - Páginas: home, vehicles, about, contact
  - Listings con propiedades: marca, modelo, año, precio, transmisión
  - Categorías sugeridas
- [ ] Preset "Clinic" (consultorio médico)
  - Páginas: home, services, specialists, appointment
  - Listings para servicios + especialistas
- [ ] Preset "Restaurant" (comercio gastronómico)
  - Páginas: home, menu, reservations, contact
  - Listings para platos + mesas
- [ ] Script para "Crear tenant con preset"

#### 3.4 Assets Manager
- [ ] Subir imágenes (signable URLs)
- [ ] Biblioteca de assets
- [ ] Alt text management
- [ ] Asignar a secciones/listings

#### 3.5 Leads (Forms + Data)
- [ ] Recolectar mensajes de contacto dinámicamente
- [ ] Ver y exportar leads
- [ ] Marcar como atendido
- [ ] Integración con formularios (contactForm block)

**Criterios de Terminado:**
- [ ] CRUD de listings funciona
- [ ] ListingsGrid renderiza correctamente
- [ ] Presets crean estructura inicial
- [ ] Assets subidos se asignan a secciones
- [ ] Leads se recopilan y exportan
- [ ] Sin código hardcodeado a "autos"

**Nuevos archivos:**
- `js/listingsManager.js` (CRUD)
- `js/assetsManager.js` (upload + biblioteca)
- `js/leadsManager.js` (recopilación + export)
- `PRESETS.md` (cómo crear un preset)
- `/presets/cars.json` (ejemplo)
- `/presets/clinic.json` (ejemplo)

---

## 🗺️ Hoja de Ruta Detallada

### Semana 1 (Fase 1 - 6 horas)
- **Lunes:** Validar data layer, corregir bugs, cargar seed data en Firestore
- **Martes:** Tests de integración, verificar cache y SEO
- **Wednesday:** Documentación y preparación para Fase 2

### Semana 2-3 (Fase 2 - 12 horas)
- **Lunes:** Page manager (CRUD)
- **Martes:** Layout y preview responsive
- **Wednesday:** Inspector de props y form dinámico
- **Jueves:** Drag-drop y reordenamiento
- **Viernes:** Draft/publish y preview mode

### Semana 4-5 (Fase 3 - 10 horas)  
- **Lunes:** Listings manager y assets
- [ **Martes:** ListingsGrid mejorado
- **Wednesday:** Leads manager
- **Jueves:** Presets (cars, clinic, restaurant)
- **Viernes:** Testing e integración final

---

## 🔧 Cambios Técnicos Clave

### Data Model (Firestore)

```
domains/{hostname}
  → {clientId}

clients/{clientId}/
  settings/public
    → {brand, social, seoDefaults, navDefaults, featureFlags, preset}
  
  pages/{slug}
    → {slug, status, meta, nav, sections, updatedAt}
  
  pageVersions/{slug}/revisions/{revId}
    → {baseStatus, snapshot, createdAt, createdBy}
  
  content/listings/{listingId}
    → {status, type, title, description, price, media, attributes, category}
  
  content/assets/{assetId}
    → {provider, url, publicId, width, height, alt, folder, createdAt}
  
  leads/{leadId}
    → {name, email, phone, message, sourcePage, createdAt, status}
```

### Block Registry (JS)

```javascript
// js/blockRegistry.js
export const BLOCK_REGISTRY = {
  hero: {
    label: "Hero Banner",
    icon: "hero.svg",
    schema: {
      title: { type: "string", required: true },
      subtitle: { type: "string" },
      bgImage: { type: "assetId" },
      cta: { type: "object", props: {text, link} }
    },
    render: (props) => { /* ... */ }
  },
  listingsGrid: {
    label: "Listings Grid",
    schema: {
      type: { type: "string", enum: ["vehicle", "service", "product"] },
      columns: { type: "number", default: 3 },
      filters: { type: "object" }
    }
  },
  // ... 10+ tipos más
};
```

### Service Worker (Tenant-aware)

```javascript
// sw.js - ANTES (hardcodeado)
const CACHE_NAME = 'autoelite-v1';

// sw.js - DESPUÉS (dinámico)
async function getCacheName() {
  const clientId = await resolveTenantIdOffline();
  return `tenant-${clientId}-v1`;
}
```

---

## 🚀 Estrategia de Deployment

### Compatibilidad hacia atrás

1. **Fase 1:** `index.html` sigue sirviendo el home viejo
   - `index-dynamic.html` está listo pero no forzado
   - Tests en `test-blocks.html` validan core

2. **Fase 2:** Introducir `admin-builder.html` en paralelo
   - `admin.html` viejo sigue disponible (deprecation notice)
   - Admins pueden usar uno u otro

3. **Fase 3:** Remover URLs estáticas viejas
   - Redirects: `vehiculos.html` → `/?page=vehicles`
   - Soft delete de páginas antiguas

### Rollback Plan

Si hay issues:
1. **Rollback de Fase 1:** Revert `js/dataLayer.js`, `js/sectionRenderer.js`, `js/pageRouter.js`
2. **Rollback de Fase 2:** Revert `admin-builder.html` y `js/adminBuilder.js`
3. **Rollback de Fase 3:** Mantener `admin.html` y `js/vehicles.js` como fallback

---

## 📊 Matriz de Decisiones (Criterios)

| Decisión | Criterio | Solución |
|----------|----------|----------|
| ¿Cache global o por tenant? | Nunca mezclar datos de tenants | Keyed por `{clientId}-{slug}` |
| ¿Validación de props en cliente o servidor? | Defensiva pero rápida | Cliente (schema), servidor (Firestore rules) |
| ¿Almacenar drafts en Firestore o localStorage? | Persistencia multi-device | Firestore (es DB, no localStorage flaky) |
| ¿Soportar versiones de páginas? | MVP no, Fase 3 sí | Tabla separada `pageVersions` |
| ¿Presets duros en código o datos? | Flexibilidad futura | Data en Firestore (collection `presets`) |
| ¿Versionado de secciones? | Complejo, deja para Fase 4 | Solo páginas por ahora |

---

## ✅ Checklist de Terminación

### Fase 1
- [ ] Data layer validado y documentado
- [ ] Section renderer con 12+ tipos
- [ ] Page router dinámico funciona
- [ ] Tests pasan (6/6)
- [ ] Firestore seed data cargada
- [ ] SEO y meta tags dinámicos

### Fase 2
- [ ] Admin builder UI completa
- [ ] CRUD de páginas funciona
- [ ] Drag-drop de secciones
- [ ] Form dinámico por tipo
- [ ] Draft/publish y preview
- [ ] Autosave sin conflictos

### Fase 3
- [ ] Listings manager completo
- [ ] ListingsGrid genérico
- [ ] Assets manager
- [ ] Leads recopilación
- [ ] Presets: cars, clinic, restaurant
- [ ] Sin acoplamientos a "autos"

---

## 📚 Referencias Clave

- **ARCHITECTURE.md** — Diseño detallado (leer primero)
- **IMPLEMENTATION_GUIDE.md** — Cómo usar en producción
- **FIRESTORE_SEED.js** — Estructura de datos de ejemplo
- **PHASE_1_COMPLETE.md** — Resumen de Fase 1
- **NEXT_STEPS.md** — Detalles de Fase 2-3

---

## 🎓 Aprendizaje & Mejora Continua

1. **Después de Fase 1:**
   - Reunión: "¿funciona en todos los navegadores?"
   - Optimización: ¿hay queries Firestore innecesarias?
   - Retroalimentación: ¿UX del admin es usable?

2. **Después de Fase 2:**
   - Validación: ¿admins pueden publicar sin dudar?
   - Seguridad: ¿Firestore rules bloquean escrituras no autorizadas?
   - Performance: ¿drag-drop es smooth en móvil?

3. **Después de Fase 3:**
   - Escala: ¿funciona con 500+ listings?
   - Presets: ¿es fácil crear uno nuevo?
   - Mantenimiento: ¿el core es predecible y sin deuda?

---

**Fin del Plan de Refactor**

Próximo paso: **Implementar Fase 1 Completa** (Validación + Documentación mejorada)
