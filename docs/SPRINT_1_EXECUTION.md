# Sprint 1 - Instrucciones de Ejecución y Validación

**Ready Date:** 21 de febrero, 2026  
**Status:** ✅ IMPLEMENTADO - AWAIT TESTING

---

## 📋 Quick Start (5 minutos)

### 1. Verificar que código compila
```bash
# Si usas bundler (webpack/vite)
npm run build

# Si no usas bundler, solo verificar no hay errores:
# Abrir DevTools (F12) en cualquier página y buscar console errors
```

### 2. Crear documentos en Firestore
```
Seguir exactamente: docs/FIRESTORE_SETUP_SPRINT1.md

Pasos:
1. Firebase Console → Firestore
2. Crear: clients/{tuCliente}/pages/home
3. Crear: clients/{tuCliente}/pages/catalogo
4. Usar JSON de la guía

⏱️ Tiempo: ~5 minutos
```

### 3. Probar Página
```
https://autoelite.com/          → Deberías ver home con 4 bloques
https://autoelite.com/catalogo  → Deberías ver catalogo con 2 bloques
https://autoelite.com/no-existe → Deberías ver mensaje amigable (no error)
```

---

## ✅ Validación Completa (1-2 horas)

Ejecutar en orden:

### FASE 1: Setup (5 min)
- [ ] Verificar blockRegistry.js existe y tiene 5 bloques
- [ ] Verificar getPagePublished() existe en dataLayer.js
- [ ] Verificar sectionRenderer.js importa blockRegistry
- [ ] Crear datos en Firestore (FIRESTORE_SETUP_SPRINT1.md)

### FASE 2: Manual Testing (30 min)
Seguir paso a paso: **docs/SPRINT_1_TESTING.md**

TC1-TC10 (10 test cases):
```
TC1: Cargar HOME                 ⬜ TO-DO
TC2: Cargar CATALOGO             ⬜ TO-DO
TC3: Caché funciona              ⬜ TO-DO
TC4: Fallback 404                ⬜ TO-DO
TC5: Sistema antiguo funciona    ⬜ TO-DO
TC6: Performance <3 queries      ⬜ TO-DO
TC7: Meta tags correctos         ⬜ TO-DO
TC8: Bloques HTML                ⬜ TO-DO
TC9: Error handling              ⬜ TO-DO
TC10: Sin console errors         ⬜ TO-DO
```

Marcar cada uno con ✅ cuando PASE

### FASE 3: Documentación (5 min)
- [ ] Leer SPRINT_1_SCOPE.md (especificación)
- [ ] Leer SPRINT_1_SUMMARY.md (resumen)
- [ ] Verificar README.md actualizado (si aplica)

### FASE 4: Code Review (15 min)
- [ ] Revisar cambios en dataLayer.js (+60 líneas)
- [ ] Revisar cambios en pageRouter.js (+7 líneas modification)
- [ ] Revisar cambios en sectionRenderer.js (+15 líneas)
- [ ] Confirmar: ✅ NO BREAKING CHANGES

---

## 🐛 Debugging Si Hay Problemas

### Página No Carga
```
1. Abrir DevTools (F12)
2. Buscar errores rojos en Console
3. Si error 404: Verificar Firestore tiene documentos
4. Si "undefined" error: Verificar firebase.js config

Remedios:
- npm install (instalar dependencias)
- Limpiar caché del navegador (Ctrl+Shift+Del)
- Intentar en incógnito
```

### Bloques No Renderizan
```
1. Con ?debug=1:
   https://autoelite.com/?debug=1
2. Buscar en console:
   [SectionRenderer] Rendering section: hero
   [SectionRenderer] Rendering section: servicesGrid
   etc.
3. Si ves "Unknown section type: xxx":
   → blockRegistry no tiene ese tipo
   → Verificar espelling en Firestore vs blockRegistry.js

Remedios:
- Verificar "type" en documento Firestore coincide con blockRegistry
- Validar JSON de Firestore
```

### Caché No Funciona
```
1. Primera carga: Deberías ver "cache MISS"
2. Segunda carga: Deberías ver "cache HIT"

Si NO funciona:
- Verificar getPagePublished() retorna página
- Verificar CACHE_TTL no es 0
- Buscar en console: window.__DATA_LAYER_CACHE

Remedios:
- Limpiar localStorage/sessionStorage
- Abrir en pestaña incógnito (sin caché antigua)
```

### Performance Lenta
```
1. DevTools → Network
2. Contar requests a Firestore
3. Debe ser máximo 3

Si > 3 queries:
- Verificar getTenantId() se ejecuta una sola vez
- Verificar caché está poblado después de primer load
- Buscar queries duplicadas

Remedios:
- Asegurar que getPagePublished() está en dataLayer.js
- Verificar sectionRenderer.js inicializa solo una vez
- Invalidar caché si editaste datos en Firestore
```

---

## 📈 Métricas a Recopilar

Durante testing, recolectar:

```
1. Time to First Paint (F12 → :Performance)
   Esperado: < 2 segundos
   Actual: _________

2. Número de queries Firestore
   Esperado: ≤ 3
   Actual: _________

3. Cache HIT rate después de primer load
   Esperado: 100% en SameSession
   Actual: _________

4. Console errors
   Esperado: 0
   Actual: _________

5. Test cases pasando
   Esperado: 10/10
   Actual: _______/10
```

---

## 🚀 Próximos Pasos (Después de Aprobar Sprint 1)

Si todos los test cases pasan ✅:

1. **Mergear a main** (si estás en rama)
   ```bash
   git commit -m "Sprint 1: Motor de páginas dinámico desde Firestore"
   git push origin sprint-1
   # Code review + merge
   ```

2. **Tag release**
   ```bash
   git tag sprint-1-complete
   git push origin sprint-1-complete
   ```

3. **Comenzar Sprint 2** (Admin Builder)
   - Crear rama: `git checkout -b sprint-2`
   - Implementar admin-builder.js
   - Edición visual + drag-drop
   - Timeline: 3 días más ~13 horas

---

## 🎯 Commit Message Sugerido

```
feat(sprint-1): Dynamic page rendering from Firestore

- Add getPagePublished() in dataLayer.js (cache, TTL 5min)
- Refactor pageRouter.js to use getPagePublished()
- Integrate blockRegistry into sectionRenderer.js
- 5 base blocks implemented: hero, richText, servicesGrid, listingsGrid, contactForm
- Add graceful fallback for missing pages
- Add testing & documentation for Sprint 1

BREAKING: None (100% backward compatible)
TESTING: See docs/SPRINT_1_TESTING.md (10 test cases)

Closes: #SPRINT-1
```

---

## 📞 Contacto / Escalaciones

Si encuentras problemas bloqueantes:

1. **Runtime errors:** Revisar console.log en sectionRenderer.js
2. **Firestore auth:** Revisar firestore.rules (no cambios en Sprint 1)
3. **Performance:** Habilitar debug mode (?debug=1) y analizar logs
4. **Data issues:** Validar JSON en Firestore contra FIRESTORE_SETUP_SPRINT1.md

---

## ✨ Final Checklist

Antes de marcar Sprint 1 READY FOR RELEASE:

- [ ] 10/10 test cases pasan ✅
- [ ] Performance < 2s first paint ✅
- [ ] ≤ 3 queries Firestore ✅
- [ ] Cero console.errors rojos ✅
- [ ] Sistema antiguo funciona ✅
- [ ] Caché funciona (MISS/HIT visible) ✅
- [ ] Documentación actualizada ✅
- [ ] Code review aprobado ✅
- [ ] Cambios mergeados a main ✅

**Si todos los checks están ✅: SPRINT 1 IS COMPLETE**

---

**Fecha Creación:** 21 de febrero, 2026  
**Status:** READY FOR QA/TESTING  
**Responsable:** QA / Development
