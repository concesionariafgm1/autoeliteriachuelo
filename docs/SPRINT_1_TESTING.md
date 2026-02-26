# Sprint 1 - Testing e Integración

**Objetivo:** Validar que el motor de páginas funciona correctamente

---

## Checklist de Validación

### ✅ Prerequisitos

- [ ] Firestore tiene documentos `pages/home` y `pages/catalogo` con status: "published"
- [ ] blockRegistry.js contiene 5 bloques: hero, richText, servicesGrid, listingsGrid, contactForm
- [ ] Node modules están instalados (`npm install`)
- [ ] Firebase config está presente en `js/firebase.js`

---

## 🧪 Test Cases

### TC1: Cargar página HOME

**Pasos:**
1. Abre `https://autoelite.com/` (o localhost)
2. Espera a que la página cargue completamente
3. Observa la consola del navegador (F12 → Console)

**Resultados Esperados:**
- [ ] Página carga exitosamente (sin redirecciones 404)
- [ ] Se ve título "AutoElite - Vehículos de Calidad" (hero block)
- [ ] Se ve grid de 3 servicios (servicesGrid)
- [ ] Se ve placeholder "Cargando vehicle..." (listingsGrid)
- [ ] Se ve formulario "Contáctanos" (contactForm)
- [ ] En consola: `[DataLayer] ✓ getPagePublished cache MISS (loaded): {...}`
- [ ] En consola: `[PageRouter] ✓ Meta tags applied`
- [ ] Sin errores rojos en consola
- [ ] Meta tags con título actualizado (verificar en `<head>`)

**Criterio de Aceptación:**
✅ PASS si todos los bloques son visibles y sin errores

---

### TC2: Cargar página CATALOGO

**Pasos:**
1. Abre `https://autoelite.com/catalogo`
2. Espera a que cargue
3. Observa la consola

**Resultados Esperados:**
- [ ] Página carga con hero "Nuestro Catálogo"
- [ ] Se ve grid de 4 columnas (listingsGrid)
- [ ] En consola: `[DataLayer] ✓ getPagePublished cache MISS (loaded):`
- [ ] Sin errores rojos
- [ ] Diferente título en meta tags respecto a home

**Criterio de Aceptación:**
✅ PASS si la página se renderiza correctamente

---

### TC3: Caché Funciona (5 min TTL)

**Pasos:**
1. Abre `https://autoelite.com/` (primer load)
2. Nota el log: `cache MISS (loaded)`
3. Recarga la página (cmd/ctrl+R)
4. Verifica el log

**Resultados Esperados:**
- [ ] Primera carga: `cache MISS`
- [ ] Segunda carga: `cache HIT`
- [ ] Tiempo de carga segunda vez es más rápido (visible)

**Criterio de Aceptación:**
✅ PASS si ves MISS en primera carga y HIT en segunda

---

### TC4: Página No Existe (Fallback)

**Pasos:**
1. Abre `https://autoelite.com/no-existe-esta-pagina`
2. Observa qué sucede

**Resultados Esperados:**
- [ ] Página carga (no error 404 HTTP)
- [ ] Muestra mensaje amigable "Página en construcción"
- [ ] Tiene botón "Volver a Inicio"
- [ ] En consola: `⚠️ Page not found in Firestore: no-existe-esta-pagina`
- [ ] Sin errores rojos

**Criterio de Aceptación:**
✅ PASS si el fallback se muestra gracefully

---

### TC5: Sistema Antiguo Sigue Funcionando

**Pasos:**
1. Abre `https://autoelite.com/vehiculos`
2. Si existe vehiculos.html, debería cargar igualmente
3. Verifica que admin.html sigue accesible

**Resultados Esperados:**
- [ ] Si `vehiculos.html` existe, carga normalamente
- [ ] `/admin/` sigue siendo funcional (redirección a admin.html)
- [ ] Código antiguo no fue modificado

**Criterio de Aceptación:**
✅ PASS si sistema antiguo sigue intacto

---

### TC6: Performance - Máximo 3 Queries

**Pasos:**
1. Abre DevTools → Network
2. Carga una página (ej: home)
3. Filtra por "firestore" o "json"
4. Cuenta requests HTTP

**Resultados Esperados:**
- [ ] Máximo 3 requests a Firestore
  - Request 1: getTenantId (desde tenant.js)
  - Request 2: getPublicSettings
  - Request 3: getPagePublished
- [ ] Tiempo total < 2 segundos (first meaningful paint)

**Criterio de Aceptación:**
✅ PASS si ≤ 3 queries y < 2s

---

### TC7: Meta Tags Correctos

**Pasos:**
1. Abre DevTools → Elements
2. Busca en `<head>` por `<meta>` tags
3. Verifica títulos y descriptions

**Resultados Esperados:**
- [ ] `<title>` tiene valor correcto (ej: "Inicio - AutoElite")
- [ ] `<meta name="description">` tiene descripción
- [ ] `<meta property="og:title">` con título OG
- [ ] Meta tags son diferentes para home vs catalogo

**Criterio de Aceptación:**
✅ PASS si meta tags están presentes y correctos

---

### TC8: Bloques se Renderizan Correctamente

**Pasos:**
1. Abre home
2. Inspecciona cada bloque (clic derecho → Inspect)

**Checklist por Bloque:**

#### Hero Block
- [ ] Contiene `<h1>` con título
- [ ] Contiene subtítulo si existe
- [ ] Tiene background-image CSS si bgImage definido
- [ ] Botón CTA es un `<a>` con href correcto

#### ServicesGrid Block
- [ ] Contiene `<grid>` o `<flex>` layout
- [ ] Cada servicio es una `<div>` con clase
- [ ] Ícono emoji visible
- [ ] Título + descripción presentes

#### ListingsGrid Block
- [ ] Contiene `<div id="listings-vehicle">`
- [ ] Mensaje "Cargando vehicle..." visible
- [ ] Grid CSS aplicado (grid-template-columns)

#### ContactForm Block
- [ ] Contiene `<form id="contactForm">`
- [ ] Campos visibles: nombre, email, mensaje
- [ ] Botón submit visible

**Criterio de Aceptación:**
✅ PASS si todos los bloques tienen HTML correcto

---

### TC9: Errores de Validación

**Pasos:**
1. Edita un documento en Firestore
2. Rompe un bloque (ej: elimina "title" del hero)
3. Recarga la página

**Resultados Esperados:**
- [ ] Página aún carga (no crash total)
- [ ] Ve mensaje de error: "Error renderizando sección: ..."
- [ ] Otros bloques siguen renderizándose
- [ ] Consola muestra error específico

**Criterio de Aceptación:**
✅ PASS si errores son gracefully handled

---

### TC10: No Hay Console Errors

**Pasos:**
1. Abre DevTools → Console
2. Carga varias páginas (home, catalogo, no-existe)
3. Busca errores rojos

**Resultados Esperados:**
- [ ] Cero errores rojos en console
- [ ] Advertencias son OK (warnings)
- [ ] Logs de debug son informativos

**Criterio de Aceptación:**
✅ PASS si no hay errores rojos

---

## 📋 Resumen de Aceptación

| TC | Nombre | Estado | Notas |
|----|--------|--------|-------|
| 1 | Cargar HOME | ⬜ | |
| 2 | Cargar CATALOGO | ⬜ | |
| 3 | Caché funciona | ⬜ | |
| 4 | Fallback 404 | ⬜ | |
| 5 | Sistema antiguo | ⬜ | |
| 6 | Performance <3 queries | ⬜ | |
| 7 | Meta tags | ⬜ | |
| 8 | Bloques HTML | ⬜ | |
| 9 | Error handling | ⬜ | |
| 10 | Sin console errors | ⬜ | |

---

## ✅ Criterio de TERMINADO (Sprint 1)

Sprint 1 se considera COMPLETADO cuando:

1. ✅ TC1-TC10: Todos los test cases pasan
2. ✅ No hay breaking changes en sistema antiguo
3. ✅ Documentación actualizada (este documento + FIRESTORE_SETUP_SPRINT1.md)
4. ✅ Código mergeado a rama main con code review
5. ✅ Performance aceptable (<2s first paint, <3 queries)

---

## 🚀 Siguiente: Sprint 2

Una vez aprobado Sprint 1:

- **Sprint 2:** Admin Builder (edición visual, drag-drop)
  - Crear admin-builder.js
  - Implementar inspector dinámico
  - Implementar draft/publish workflow
  - Test: editor puede crear nueva página desde cero

---

## Logs Esperados (Debug)

Cuando abres una página con `?debug=1`:

```
[DataLayer] ✓ Tenant resolved: autoelite-concesionaria
[DataLayer] ✓ getPagePublished cache MISS (loaded): {clientId, slug, sections: 4}
[PageRouter] ✓ Meta tags applied for: {title, description}
[SectionRenderer] Rendering section: hero (hero-1)
[SectionRenderer] Rendering section: servicesGrid (services-1)
[SectionRenderer] Rendering section: listingsGrid (listings-1)
[SectionRenderer] Rendering section: contactForm (contact-1)
[BlockRegistry] ✓ Initialized 5 block renderers from blockRegistry
```

Si ves estos logs, Sprint 1 funciona correctamente.

---

**Responsable:** QA / Tester  
**Fecha:** 21 de febrero de 2026
