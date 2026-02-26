# ✅ Tareas Inmediatas - Roadmap de 3 Semanas

## 🎯 SEMANA 1: Fase 1 Validation (Esta semana)

### Hoy (Lunes)
- [ ] Leer EXECUTIVE_SUMMARY.md (5 min) — Entiende el contexto
- [ ] Leer ARCHITECTURE.md (10 min) — Entiende diseño
- [ ] Clonar/pulliar código actualizado del repo
- [ ] Verificar que blockRegistry.js existe en `js/`
- [ ] Abrir `test-blocks.html` en navegador local
  - [ ] Hace click en "EJECUTAR TODOS LOS TESTS"
  - [ ] Verificar 6/6 tests pasan ✓
  - [ ] Si faltan, debug con `?debug=1`

### Martes
- [ ] Cargar FIRESTORE_SEED.js en Firestore firebase console
  - [ ] Crear collection `domains`
  - [ ] Crear doc `localhost` con `{ clientId: "autoelite" }`
  - [ ] Crear path `clients/autoelite/settings/public` con data de seed
  - [ ] Crear path `clients/autoelite/pages/home` con página ejemplo
  - [ ] (Ver FIRESTORE_SEED.js para estructura exacta)
- [ ] Abrir `index-dynamic.html` en navegador
  - [ ] Debería cargar home desde Firestore
  - [ ] Ver console - no errores
  - [ ] Verificar meta tags dinámicos se inyectaron
  - [ ] Si hay issues, revisar dataLayer logs (`?debug=1`)

### Miércoles
- [ ] Validar Firestore rules
  - [ ] Copiar rules de FIRESTORE_RULES.md
  - [ ] Pegarlas en Firestore Console > Rules tab
  - [ ] Click "Simulate" y ejecutar test cases
  - [ ] Verificar que permite lecturas públicas, deniega drafts sin auth
- [ ] Configurar custom claims (preparación)
  - [ ] Crear usuario de prueba en Firebase Auth
  - [ ] Script admin-tools/setClaim.js
  - [ ] Ejecutar: `node setClaim.js user-123 autoelite admin`
- [ ] Verificar auth flow
  - [ ] Login con usuario
  - [ ] Verificar `window.currentUser`, `window.isAdmin` en console
  - [ ] Intentar acceso a admin intenta 401 sin auth ✓

### Jueves
- [ ] Verificar lazy-load de imágenes
  - [ ] Crear imagen test en Firestore asset
  - [ ] Ponerla en sección hero
  - [ ] Abrir DevTools > Network
  - [ ] Verificar que imagen NO se carga hasta ser visible
- [ ] Test de caché tenant isolation
  - [ ] Crear segundo tenant en Firestore (opcional)
  - [ ] Verificar que no se mezclan datos
  - [ ] Revisar `window.__DATA_LAYER_CACHE` en console
- [ ] Revisar NEXT_STEPS.md y marcar completed items
  - [ ] Fase 2.1 y 2.2 ya completadas ✓
  - [ ] Preparar tareas Fase 3

### Viernes
- [ ] Armar pre-flight checklist (de EXECUTIVE_SUMMARY.md)
  - [ ] [ ] Todos los tests pasan
  - [ ] [ ] blockRegistry.js se carga correctamente
  - [ ] [ ] FIRESTORE_SEED.js en staging
  - [ ] [ ] index-dynamic.html sin errores
  - [ ] [ ] Docs leídas
  - [ ] [ ] Riesgos identificados
  - [ ] [ ] Backup production hecho
- [ ] Documentación review
  - [ ] Leer BLOCK_GUIDE.md (para saber cómo agregar bloques)
  - [ ] Review DEVELOPER_REFERENCE.md (memorizar API)
  - [ ] Review FIRESTORE_RULES.md (entender seguridad)
- [ ] Status check
  - [ ] Hacer pruebas finales
  - [ ] Documentar cualquier issue encontrado
  - [ ] Comunicar "Fase 1 Ready ✓"

---

## 🛠️ SEMANA 2: Fase 2 Implementation (Admin Builder)

### Lunes
- [ ] Crear `admin-builder.html` 
  - [ ] Copiar contenido de `admin-builder-template.html`
  - [ ] Renombrar si es necesario
  - [ ] Probar que carga sin errores en navegador
- [ ] Crear `js/adminBuilder.js` (scaffolding)
  - [ ] Estructura básica: funciones stub para loadPages, savePage, etc.
  - [ ] Imports: dataLayer, sectionRenderer, blockRegistry
- [ ] Crear `js/formBuilder.js` (scaffolding)
  - [ ] Función: `generateFormForBlock(type, props)` que retorna form element
  - [ ] Función: `getFormValues()` que retorna props
  - [ ] Tests manuales en console

### Martes
- [ ] Implementar loadPages()
  - [ ] Query Firestore para todas las páginas del tenant
  - [ ] Popular dropdown `#pageSelect`
  - [ ] OnChange: cargar página seleccionada
- [ ] Implementar renderPagePreview()
  - [ ] Tomar `window.currentPage.sections`
  - [ ] Renderizar con `sectionRenderer.renderSection()`
  - [ ] Inyectar en `#previewContent`
- [ ] Responsive device buttons
  - [ ] Desktop / Tablet / Mobile buttons
  - [ ] Cambiar clase CSS del frame
  - [ ] Verificar que preview es responsive

### Miércoles
- [ ] Drag & Drop de secciones
  - [ ] Usar vanilla JS o pequeña lib (ej: sortablejs)
  - [ ] Click en sección en sidebar izq → selecciona
  - [ ] Drag entre secciones → reordena
  - [ ] Actualizar order en `window.currentPage.sections`
- [ ] Secciones List dinamica
  - [ ] Listar `window.currentPage.sections`
  - [ ] Mostrar tipo + nombre corto
  - [ ] Agregar botón delete por sección
  - [ ] Visual feedback de sección seleccionada

### Jueves
- [ ] Inspector dinámico / Form builder
  - [ ] Cuando selecciona sección, mostrar form para editar props
  - [ ] Usar `formBuilder.generateFormForBlock(section.type, section.props)`
  - [ ] Inputs se rellenan con valores actuales
  - [ ] onChange → actualizar `section.props`
  - [ ] Re-renderizar preview en tiempo real
- [ ] Agregar sección
  - [ ] Modal: seleccionar tipo de bloque
  - [ ] Click "Agregar" → crea sección nueva
  - [ ] Inyecta en `window.currentPage.sections` al final
  - [ ] Actualiza preview + sidebar
  - [ ] Selecciona automáticamente la nueva sección

### Viernes
- [ ] Save Draft
  - [ ] Button "Guardar Draft"
  - [ ] Valida página (slug, meta, sections)
  - [ ] Llama `savePage(clientId, window.currentPage)`
  - [ ] Feedback visual: "✓ Draft guardado"
  - [ ] Dirty state management (alerta si intenta salir sin guardar)
- [ ] Publish
  - [ ] Button "Publicar"
  - [ ] Cambia `status` de "draft" a "published"
  - [ ] Idem save, pero con confirmación
  - [ ] Feedback: "✓ Página publicada"
- [ ] QA & Testing
  - [ ] Crear página nueva → OK?
  - [ ] Editar página existente → OK?
  - [ ] Drag-drop → OK?
  - [ ] Save → OK?
  - [ ] Publish → OK?
  - [ ] Documentar issues encontrados

---

## 📦 SEMANA 3: Fase 3 Implementation (Listings & Presets)

### Lunes
- [ ] Listings Manager
  - [ ] Crear `js/listingsManager.js`
  - [ ] Funciones: getListings, saveListing, deleteListing
  - [ ] UI simple en admin: tabla de listings + CRUD
  - [ ] Status: draft/published

### Martes
- [ ] Assets Manager
  - [ ] Crear `js/assetsManager.js`
  - [ ] Upload: signable URLs o backend endpoint
  - [ ] Biblioteca: listar assets cargados
  - [ ] Alt text management
- [ ] ListingsGrid mejorado
  - [ ] Verificar que listingsGrid bloque funciona con datos reales
  - [ ] Filtros, búsqueda, paginación (MVP)
  - [ ] Responsive grid

### Miércoles
- [ ] Leads Form
  - [ ] contactForm bloque recolecta datos
  - [ ] Submits a Firestore `leads/{leadId}`
  - [ ] Admin ve leads en panel
  - [ ] Mark as "handled" feature
  - [ ] Export to CSV (opcional)

### Jueves
- [ ] Presets data
  - [ ] Crear `/presets/cars.json` (estructura inicial para concesionaria)
  - [ ] Crear `/presets/clinic.json` (estructura inicial para clínica)
  - [ ] Crear `/presets/restaurant.json` (estructura inicial para restaurante)
  - [ ] Documento PRESETS_GUIDE.md (cómo crear preset nuevo)
- [ ] Preset loader
  - [ ] Función: loadPreset(presetName) → popula Firestore
  - [ ] Setup: crear tenant nuevo + cargar preset
  - [ ] Verificar que páginas y listings se crean correctamente

### Viernes
- [ ] Cleanup & Deprecation
  - [ ] Remover `vehiculos.html` (o redirigir a `/catalogo`)
  - [ ] Remover `admin.html` (o redirigir a `/admin-builder`)
  - [ ] Deprecation notices en páginas viejas
  - [ ] Update `` con nuevas rutas
- [ ] Documentation
  - [ ] Completar ADMIN_GUIDE.md
  - [ ] Completar PRESETS_GUIDE.md
  - [ ] Update ARCHITECTURE.md si hay cambios
  - [ ] Final review de toda documentación
- [ ] Final QA
  - [ ] Ejecutar todos los tests nuevamente (6/6 ✓)
  - [ ] Crear documento de "Known Issues"
  - [ ] Timeline ajustado si hubo desvíos

---

## 🎯 Tareas Transversales (Todas las semanas)

- [ ] **Logging & Monitoring**
  - [ ] Verificar logs en Firestore (Firebase Logs)
  - [ ] Monitorear error rate
  - [ ] Documentar issues hallados

- [ ] **Documentación Actualización**
  - [ ] Si cambias un flujo, actualiza ARCHITECTURE.md
  - [ ] Si agregas bloque, actualiza DEVELOPER_REFERENCE.md
  - [ ] Si cambias API dataLayer, actualiza BLOCK_GUIDE.md

- [ ] **Code Review**
  - [ ] Peer review antes de merge a main
  - [ ] Checklist: tests pass, docs updated, no hardcoding

- [ ] **Communication**
  - [ ] Status updates cada viernes
  - [ ] Reportar blockers inmediatamente
  - [ ] Celebrar milestones (Fase 1 done, Fase 2 done, etc.)

---

## 🚨 Dependencias & Bloqueadores

**Bloqueadores Potenciales:**
1. Firestore connectivity (verificar rápido en Lunes)
2. Firebase Auth setup (verificar en Martes)
3. Custom claims no configuradas (revisar en Miércoles)
4. DnD library no funciona (plan B: vanilla JS en Jueves)

**Acciones de Mitigación:**
- Testing temprano (Lunes) para encontrar issues pronto
- Rollback plan documentado (ver MIGRATION_GUIDE.md)
- Comunicar cambios de timeline si hay desvíos

---

## ✅ Success Criteria por Semana

### Semana 1
- ✅ 6/6 tests pasan
- ✅ index-dynamic.html renderiza sin errores
- ✅ Firestore seed data cargada
- ✅ Rules validadas y deployadas
- ✅ Documentación completa y leída
- **GoNogo:** Parar si falta algo crítico en tests

### Semana 2
- ✅ Page manager funciona (CRUD)
- ✅ Drag-drop de secciones smooth
- ✅ Inspector de props dinámico
- ✅ Save draft automático
- ✅ Publish funciona
- **GoNogo:** Demo a stakeholders

### Semana 3
- ✅ Listings manager completo
- ✅ Assets manager completo
- ✅ Leads recopilación funciona
- ✅ Presets (cars, clinic, restaurant) funcionales
- ✅ Sin referencias hardcodeadas a "autos"
- **GoNogo:** Deploy a producción

---

## 📊 Time Breakdown (Estimado)

**Fase 1 (Semana 1):**
- Testing & validation: 6 horas
- Setup Firestore: 1 hora
- Documentation review: 2 horas
- **Total: 9 horas**

**Fase 2 (Semana 2):**
- Implementation: 10 horas
- Testing: 2 horas
- **Total: 12 horas**

**Fase 3 (Semana 3):**
- Listings + Assets: 4 horas
- Presets: 3 horas
- Cleanup & deploy: 2 horas
- **Total: 9 horas**

**Grand Total: ~30 horas spread over 3 weeks**

---

## 📞 Escalation & Support

**Si encuentras problema:**
1. Primero, revisar TROUBLESHOOTING en DEVELOPER_REFERENCE.md
2. Si sigue, revisar test-blocks.html con ?debug=1
3. Si sigue, revisar Firestore Console y rules
4. Luego, preguntar a tech lead o escalate

**Comunicar:**
- Issues encontrados: inmediatamente
- Blockers: misma hora
- Status: viernes eod
- Riesgos: cuando se identifiquen

---

## 🎓 Learning Resources

**Para aprender durante:**
1. ARCHITECTURE.md — Refer como necesario
2. DEVELOPER_REFERENCE.md — Constant reference
3. BLOCK_GUIDE.md — When adding blocks
4. test-blocks.html — Running examples

**External:**
- Firebase Docs: https://firebase.google.com/docs
- Firestore Rules: https://firebase.google.com/docs/firestore/security/get-started
- Web APIs: MDN Web Docs

---

**Documento creado:** 2026-02-21  
**Última actualización:** Hoy  
**Status:** Ready to Execute

---

## 🚀 NEXT ACTION

→ Marca esta checklist en tu sistema de project management (Jira, Asana, GitHub Projects, etc.)

→ Asigna tareas a miembros del equipo

→ Schedule kickoff meeting para Semana 1

→ Questions? Refer to DOCUMENTATION_INDEX.md
