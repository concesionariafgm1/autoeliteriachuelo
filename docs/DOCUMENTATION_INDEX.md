# 📚 Índice de Documentación - SaaS Website Builder

## 🎯 START HERE

**Eres una persona nueva en el proyecto?**

1. **Leer (5 min):** [EXECUTIVE_SUMMARY.md](EXECUTIVE_SUMMARY.md)  
   → Entiende qué es el proyecto, states, timeline

2. **Leer (10 min):** [ARCHITECTURE.md](ARCHITECTURE.md)  
   → Entiende cómo funciona la arquitectura

3. **Reference (keep open):** [DEVELOPER_REFERENCE.md](DEVELOPER_REFERENCE.md)  
   → Cheat sheet de API, data model, flows

4. **Test (5 min):** Abre en navegador:
   ```
   http://localhost:8787/test-blocks.html
   ```
   → Haz click en "EJECUTAR TODOS LOS TESTS"  
   → Deberías ver 6/6 ✓

---

## 📖 Documentación por Rol

### 👨‍💻 DESARROLLADORES

**Empezar:**
1. [DEVELOPER_REFERENCE.md](DEVELOPER_REFERENCE.md) — Cheat sheet
2. [ARCHITECTURE.md](ARCHITECTURE.md) — Diseño detallado
3. [BLOCK_GUIDE.md](BLOCK_GUIDE.md) — Cómo agregar bloques

**Para Tareas Específicas:**
- "Agregar un bloque nuevo" → [BLOCK_GUIDE.md](BLOCK_GUIDE.md)
- "Entender data layer" → [ARCHITECTURE.md](ARCHITECTURE.md#data-layer)
- "Comprender flujos" → [DEVELOPER_REFERENCE.md](DEVELOPER_REFERENCE.md#flujos-comunes)
- "Tests & debugging" → [DEVELOPER_REFERENCE.md](DEVELOPER_REFERENCE.md#testing)
- "Firestore rules" → [FIRESTORE_RULES.md](FIRESTORE_RULES.md)

**Code Samples:**
- blockRegistry.js ejemplo completo: [BLOCK_GUIDE.md#countdowntimer](BLOCK_GUIDE.md#ejemplo-completo-countdowntimer)
- Formulario dinámico: [BLOCK_GUIDE.md#form-builder](BLOCK_GUIDE.md#admin-form-generator)
- Data flows: [DEVELOPER_REFERENCE.md#flujos-comunes](DEVELOPER_REFERENCE.md#flujos-comunes)

### 👤 ADMINS (Usuarios del Builder)

**Empezar:**
1. [ADMIN_GUIDE.md](ADMIN_GUIDE.md) — Tutorial (cuando esté completo)
2. Screenshots & videos (en ADMIN_GUIDE.md)
3. Tutorial: "Mi primer página" (en ADMIN_GUIDE.md)

**Operacional:**
- "¿Cómo crear una página?" → ADMIN_GUIDE.md (Fase 2)
- "¿Cómo publicar?" → ADMIN_GUIDE.md (Fase 2)
- "¿Qué es draft vs published?" → ADMIN_GUIDE.md (Fase 2)

### 🏗️ ARCHITECTS & PMs

**Empezar:**
1. [EXECUTIVE_SUMMARY.md](EXECUTIVE_SUMMARY.md) — Estado & timeline
2. [REFACTORING_PLAN.md](REFACTORING_PLAN.md) — Plan de 3 fases
3. [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) — Cómo pasar producción

**Strategic:**
- "¿Cuáles son los riesgos?" → [REFACTORING_PLAN.md#matriz-de-decisiones](REFACTORING_PLAN.md#matriz-de-decisiones) + [EXECUTIVE_SUMMARY.md#riesgos--mitigación](EXECUTIVE_SUMMARY.md#riesgos--mitigación)
- "¿Cómo migramos sin romper?" → [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)
- "¿Timeline realista?" → [REFACTORING_PLAN.md#hoja-de-ruta-detallada](REFACTORING_PLAN.md#hoja-de-ruta-detallada)
- "¿Criterios de éxito?" → [EXECUTIVE_SUMMARY.md#criterios-de-éxito-por-fase](EXECUTIVE_SUMMARY.md#criterios-de-éxito-por-fase)

### 🔐 SECURITY ENGINEERS

**Focus:**
1. [FIRESTORE_RULES.md](FIRESTORE_RULES.md) — Rules & security
2. [FIRESTORE_RULES.md#custom-claims-setup](FIRESTORE_RULES.md#custom-claims-setup) — Auth setup
3. [FIRESTORE_RULES.md#protecciones-adicionales](FIRESTORE_RULES.md#protecciones-adicionales) — Hardening

**Checklists:**
- Pre-deploy security: [FIRESTORE_RULES.md#checklist-de-seguridad-pre-deploy](FIRESTORE_RULES.md#checklist-de-seguridad-pre-deploy)

---

## 📁 Archivos Documentación

### Core Architecture

| Archivo | Tamaño | Audience | Propósito |
|---------|--------|----------|-----------|
| **[EXECUTIVE_SUMMARY.md](EXECUTIVE_SUMMARY.md)** | ~600 líneas | PMs, Leads | Estado actual, roadmap, ROI |
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | ~400 líneas | Devs, Architects | Diseño detallado de componentes |
| **[DEVELOPER_REFERENCE.md](DEVELOPER_REFERENCE.md)** | ~450 líneas | Devs | Cheat sheet, API, troubleshooting |

### Strategy & Migration

| Archivo | Tamaño | Audience | Propósito |
|---------|--------|----------|-----------|
| **[REFACTORING_PLAN.md](REFACTORING_PLAN.md)** | ~650 líneas | Devs, PMs | Plan de 3 fases, acoplamientos |
| **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)** | ~500 líneas | Ops, Devs | Cómo migrar producción sin ruptura |

### Implementation Guides

| Archivo | Tamaño | Audience | Propósito |
|---------|--------|----------|-----------|
| **[BLOCK_GUIDE.md](BLOCK_GUIDE.md)** | ~600 líneas | Devs | Tutorial: agregar bloques nuevos |
| **[FIRESTORE_RULES.md](FIRESTORE_RULES.md)** | ~400 líneas | Security, Devs | Rules, custom claims, hardening |
| **[admin-builder-template.html](admin-builder-template.html)** | ~500 líneas | Devs | UI template para Fase 2 |

### Code Reference

| Archivo | Tamaño | Audience | Propósito |
|---------|--------|----------|-----------|
| **[js/blockRegistry.js](js/blockRegistry.js)** | ~450 líneas | Devs | 10+ tipos de bloques funcionales |
| **[FIRESTORE_SEED.js](FIRESTORE_SEED.js)** | Data example | Devs, Ops | Estructura + datos de ejemplo |

---

## 🗺️ Mapa de Información

```
┌──────────────────────────────────────────────────────┐
│ NUEVO EN PROYECTO?                                   │
│ → EXECUTIVE_SUMMARY.md (5 min)                       │
│ → ARCHITECTURE.md (10 min)                           │
│ → test-blocks.html (5 min)                           │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ DESARROLLADOR: AGREGAR BLOQUE NUEVO                  │
│ → DEVELOPER_REFERENCE.md (Quick Start)               │
│ → BLOCK_GUIDE.md (Step by step)                      │
│ → Copiar template, llenar, testear                   │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ ADMIN: CREAR PÁGINA                                  │
│ → ADMIN_GUIDE.md (cuando esté listo en Fase 2)      │
│ → Video tutorial (cuando esté grabado)               │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ PM: ENTENDER ROADMAP                                 │
│ → REFACTORING_PLAN.md (Plan de 3 fases)             │
│ → EXECUTIVE_SUMMARY.md (Timeline & ROI)             │
│ → MIGRATION_GUIDE.md (Go-live plan)                 │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ SECURITY: VERIFICAR RULES                            │
│ → FIRESTORE_RULES.md (Rules reference)              │
│ → Firestore Simulator                               │
│ → Pre-deploy checklist                              │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ PROBLEMA EN PRODUCCIÓN?                              │
│ → DEVELOPER_REFERENCE.md#troubleshooting             │
│ → FIRESTORE_RULES.md#flujo-de-seguridad             │
│ → test-blocks.html (validar core)                    │
└──────────────────────────────────────────────────────┘
```

---

## 📋 Documentos Útiles para Tareas Comunes

### "Necesito entender la architecture rápido"
1. ARCHITECTURE_DIAGRAM.txt (visual ASCII)
2. ARCHITECTURE.md (written)
3. DEVELOPER_REFERENCE.md#data-model

### "Quiero agregar un bloque nuevo"
1. BLOCK_GUIDE.md#paso-a-paso | Sección completa tut
2. js/blockRegistry.js | Ver ejemplos
3. test-blocks.html | Escribir test

### "Necesito configurar Firestore rules"
1. FIRESTORE_RULES.md | Copiar rules
2. Firestore Console | Pegarconsole
3. FIRESTORE_RULES.md#testing-rules | Validar

### "Quiero entender auth & custom claims"
1. FIRESTORE_RULES.md#custom-claims-setup
2. DEVELOPER_REFERENCE.md#auth--roles
3. admin-tools/setClaim.js | Ejecutar script

### "Voy a migrar a producción"
1. MIGRATION_GUIDE.md | Paso a paso
2. FIRESTORE_RULES.md#checklist-de-seguridad
3. REFACTORING_PLAN.md#compatibilidad-hacia-atrás

### "Encontré un error"
1. DEVELOPER_REFERENCE.md#troubleshooting
2. test-blocks.html?debug=1 | Debug logs
3. Firestore Console | Verificar datos

---

## 🔍 Búsqueda Rápida por Palabra Clave

| Busco... | Ver archivo... | Sección |
|----------|----------------|---------|
| `blockRegistry` | BLOCK_GUIDE.md | Definición, uso, ejemplos |
| `dataLayer` | DEVELOPER_REFERENCE.md | API reference |
| `Firestore schema` | ARCHITECTURE.md | Data Model |
| `Custom claims` | FIRESTORE_RULES.md | Setup section |
| `Roles & permisos` | FIRESTORE_RULES.md | Matriz de acceso |
| `pageRouter` | ARCHITECTURE.md | Page router section |
| `Tenant isolation` | FIRESTORE_RULES.md | Principios |
| `Admin builder UI` | admin-builder-template.html | HTML markup |
| `Fases del proyecto` | REFACTORING_PLAN.md | Fases 1-3 |
| `Security checklist` | FIRESTORE_RULES.md | Pre-deploy |
| `Quick start` | DEVELOPER_REFERENCE.md | Quick Start section |
| `Timeline` | REFACTORING_PLAN.md | Hoja de ruta |

---

## 🚀 Getting Started Paths

### Path 1: Validar Fase 1 (Hoy, 4-6 horas)
```
1. Leer EXECUTIVE_SUMMARY.md                      (5 min)
2. Leer ARCHITECTURE.md                           (10 min)
3. Cargar FIRESTORE_SEED.js en Firestore         (30 min)
4. Abrir test-blocks.html en navegador            (5 min)
5. Click "EJECUTAR TODOS LOS TESTS"              (1 min)
6. Verificar 6/6 ✓                                (1 min)
7. Abrir index-dynamic.html en navegador          (5 min)
8. Comprobar que carga home sin errores          (5 min)
9. Review FIRESTORE_RULES.md y validar setup     (30 min)
10. Llenae pre-flight checklist                   (15 min)

RESULTADO: Fase 1 validada, lista para Fase 2
```

### Path 2: Implementar Fase 2 (12 horas)
```
1. Leer DEVELOPER_REFERENCE.md                   (10 min)
2. Leer admin-builder-template.html              (15 min)
3. Crear admin-builder.html (copiar template)    (30 min)
4. Implementar Load Pages                         (2 horas)
5. Implementar Drag-Drop de secciones            (3 horas)
6. Implementar Inspector dinámico                 (2 horas)
7. Implementar Save Draft                         (2 horas)
8. Implementar Publish                            (1 hora)
9. Testing & debugging                            (1 hora)

RESULTADO: Admin builder funcional
```

### Path 3: Add New Block Type (2 hours)
```
1. Leer BLOCK_GUIDE.md                           (20 min)
2. Abrir js/blockRegistry.js                      (5 min)
3. Copiar template de bloque existente            (10 min)
4. Modificar para nuevo tipo                      (30 min)
5. Escribir test en test-blocks.html             (20 min)
6. Verificar renderizado en navegador            (10 min)

RESULTADO: Nuevo bloque funcional, testeado
```

---

## 📞 Soporte & Contacto

**Preguntas sobre:**
- Architecture → Ver ARCHITECTURE.md o pregunta a tech lead
- API usage → Ver DEVELOPER_REFERENCE.md
- Bloques → Ver BLOCK_GUIDE.md
- Security → Ver FIRESTORE_RULES.md
- Timeline → Ver REFACTORING_PLAN.md

**Bug reports:**
1. Reproducir en test-blocks.html
2. Ver DEVELOPER_REFERENCE.md#troubleshooting
3. Revisar Firestore Console

---

## ✅ Documentación Completeness

| Archivo | Status | Coverage |
|---------|--------|----------|
| EXECUTIVE_SUMMARY.md | ✅ Complete | 100% |
| REFACTORING_PLAN.md | ✅ Complete | 100% |
| MIGRATION_GUIDE.md | ✅ Complete | 100% |
| ARCHITECTURE.md | ✅ Complete | 100% |
| DEVELOPER_REFERENCE.md | ✅ Complete | 100% |
| BLOCK_GUIDE.md | ✅ Complete | 100% |
| FIRESTORE_RULES.md | ✅ Complete | 100% |
| ADMIN_GUIDE.md | 🟡 Pendiente Fase 2 | 0% |
| PRESETS_GUIDE.md | 🟡 Pendiente Fase 3 | 0% |

**Total Coverage:** 77% (7/9 docs complete)

---

## 📊 Statistics

- **Total Documentation:** ~3500 líneas
- **Code Examples:** 50+
- **Diagrams:** 5+ (ASCII)
- **Checklists:** 8
- **Troubleshooting Guides:** 3
- **Step-by-step Tutorials:** 5+

---

**Última actualización:** 2026-02-21  
**Versión de documentación:** 1.0  
**Status:** Ready for review & implementation

---

## 🎯 Next Step

**¿Por dónde empezamos?**

→ Abre [EXECUTIVE_SUMMARY.md](EXECUTIVE_SUMMARY.md) (5 minutos)  
→ Luego [ARCHITECTURE.md](ARCHITECTURE.md) (10 minutos)  
→ Luego ejecuta test-blocks.html en navegador
