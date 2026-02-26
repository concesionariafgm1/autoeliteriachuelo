# Especificación Técnica - Sistema Multi-Tenant, Multi-Rubro

**Fecha:** 21 de Febrero, 2026  
**Estado:** Especificación Vinculante  
**Versión:** 1.0

---

## 1. Requisitos Funcionales

### ✅ Multi-Tenant
- **Aislamiento por cliente:** Todos los datos filtrados por `clientId`
- **Tenant resolution:** Hostname → `domains/{hostname}` → `clientId`
- **Seguridad Firestore:** Reglas que rechazan acceso cross-tenant
- **Custom claims:** JWT incluye `clientId` + `role` para validación en cliente

**Implementación:**
- `js/tenant.js` — Resolve hostname → clientId
- `js/dataLayer.js` — Todas las queries incluyen `clientId` filter
- `firestore.rules` — Validación de tenant en cada read/write
- `js/auth.js` — Listener de custom claims

### ✅ Multi-Rubro (Vertical Offerings)
- **Sin hardcoding:** No hay código específico para "vehiculos", "servicios", etc.
- **Bloques genéricos:** 
  - `listingsGrid` — Renderiza cualquier tipo de item (vehículo, servicio, producto)
  - `contactForm` — Formulario adaptable a cualquier industria
  - `servicesGrid` — Grid genérico de items
- **Presets:** Configuración por vertical (cars.json, clinic.json, restaurant.json)

**Implementación:**
- `js/blockRegistry.js` — Bloques sin referencias a "vehicles"
- `js/outputsSystem.js` — Outputs genéricos
- Firestore estructura: `clients/{clientId}/content/listings/{id}` (sin type específico)
- Cliente define type: `{ type: "vehicle", brand: "Ford", ... }`

### ✅ Pages + Sections (Blocks)
- **Estructura:** Página = array de secciones
- **Sección = Bloque:** Cada elemento visual es un bloque con tipo + propiedades
- **Ejemplo:**
```json
{
  "id": "home",
  "slug": "home",
  "title": "Inicio",
  "sections": [
    { "id": "sec-1", "type": "hero", "props": { "title": "Bienvenido", ... } },
    { "id": "sec-2", "type": "listingsGrid", "props": { "itemType": "vehicle", ... } },
    { "id": "sec-3", "type": "contactForm", "props": { "title": "Contacto", ... } }
  ],
  "status": "published",
  "metadata": { "seo": {...} }
}
```

**Implementación:**
- `js/dataLayer.js#getPage()` → Lee página completa con secciones
- `js/sectionRenderer.js` → Renderiza cada sección según su `type`
- `js/blockRegistry.js` → Define schema, validation, renderer para cada tipo

### ✅ Draft / Publish Workflow
- **Draft:** Cambios en desarrollo, no visible públicamente
- **Publish:** Cambios en producción, visible en sitio público
- **Versioning:** Se mantiene un historico (opcional: revert a versión anterior)

**Implementación:**
- `page.status` ∈ {`"draft"`, `"published"`}
- `savePage()` actualiza Firestore doc
- `getPage()` en público retorna solo `status === "published"`
- `getPage()` en admin retorna todas las versiones

**Firestore Schema:**
```
clients/{clientId}/
  pages/{pageId}/
    id: string
    slug: string
    title: string
    status: "draft" | "published"
    sections: [
      { id, type, props, createdAt, updatedAt }
    ]
    createdAt: timestamp
    updatedAt: timestamp
    publishedAt: timestamp (null si draft)
    editor: { userId, email }
```

### ✅ Rendering Dinámico desde Firestore
- **NO HTML estático:** Ni `index.html` ni `vehiculos.html` definen contenido
- **SÍ Rendering runtime:** Cliente carga estructura desde Firestore → renderiza con JS
- **Performance:** Caché en cliente (5 min TTL) + Service Worker

**Flow:**
```
1. Usuario abre https://autoelite.com/
2. index-dynamic.html carga
3. pageRouter.js detecta slug = "home"
4. dataLayer.getPage(clientId, "home") → Query Firestore
5. Retorna JSON de página + secciones
6. sectionRenderer.js mapea cada section.type → bloque correspondiente
7. blockRegistry[section.type].render(props) → HTML
8. Inyecta en DOM

9. Si es admin:
   - admin-builder-template.html carga
   - inspector permite editar cada bloque
   - savePage() persiste en Firestore
   - getPage() lo ve inmediatamente (live update)
```

**Implementación:**
- `index-dynamic.html` — Scaffold vacío, solo carga JS
- `js/pageRouter.js` — Route matcher + data fetching
- `js/sectionRenderer.js` — Loop de rendering
- `js/dataLayer.js` — Caché + Firestore queries

---

## 2. Estructura de Datos (Firestore)

```
Cloud Firestore
├── domains/
│   ├── autoelite.com.ar/
│   │   └── clientId: "autoelite-concesionaria"
│   ├── miclínica.com/
│   │   └── clientId: "clinic-buenos-aires"
│   └── pizzería.com.ar/
│       └── clientId: "pizzeria-palermo"
│
├── clients/
│   ├── autoelite-concesionaria/
│   │   ├── settings/
│   │   │   ├── public/
│   │   │   │   └── {
│   │   │   │       "businessName": "AutoElite",
│   │   │   │       "logo": "asset-id-123",
│   │   │   │       "primary_color": "#FF0000",
│   │   │   │       "contact_email": "info@autoelite.com"
│   │   │   │     }
│   │   │   └── private/
│   │   │       └── {firebase admin key, API keys, etc}
│   │   │
│   │   ├── pages/  (Contenido del sitio)
│   │   │   ├── home/
│   │   │   │   └── {
│   │   │   │       "id": "home",
│   │   │   │       "slug": "home",
│   │   │   │       "title": "Inicio",
│   │   │   │       "status": "published",
│   │   │   │       "sections": [
│   │   │   │         {
│   │   │   │           "id": "hero-1",
│   │   │   │           "type": "hero",
│   │   │   │           "props": {
│   │   │   │             "title": "AutoElite - Vehículos Premium",
│   │   │   │             "subtitle": "Las mejores opciones de tu ciudad",
│   │   │   │             "bgImage": "asset-id-456",
│   │   │   │             "ctaText": "Ver Catálogo",
│   │   │   │             "ctaUrl": "/catalogo"
│   │   │   │           }
│   │   │   │         },
│   │   │   │         {
│   │   │   │           "id": "grid-1",
│   │   │   │           "type": "listingsGrid",
│   │   │   │           "props": {
│   │   │   │             "title": "Catálogo",
│   │   │   │             "itemType": "vehicle",  ← Genérico, no hardcoded
│   │   │   │             "filters": ["brand", "year", "price"],
│   │   │   │             "limit": 12
│   │   │   │           }
│   │   │   │         }
│   │   │   │       ],
│   │   │   │       "createdAt": "2026-02-01T10:00:00Z",
│   │   │   │       "updatedAt": "2026-02-21T14:30:00Z",
│   │   │   │       "publishedAt": "2026-02-21T10:00:00Z",
│   │   │   │       "editor": { "userId": "admin-123", "email": "admin@autoelite.com" }
│   │   │   │     }
│   │   │   ├── catalogo/
│   │   │   ├── contacto/
│   │   │   └── [más páginas]
│   │   │
│   │   ├── content/
│   │   │   ├── assets/  (Metadatos de imágenes)
│   │   │   │   ├── asset-456/
│   │   │   │   │   └── {
│   │   │   │   │       "id": "asset-456",
│   │   │   │   │       "url": "https://res.cloudinary.com/...",
│   │   │   │   │       "filename": "hero-bg.jpg",
│   │   │   │   │       "size": 524288,
│   │   │   │   │       "uploadedAt": "2026-02-20T10:00:00Z",
│   │   │   │   │       "uploadedBy": "admin-123"
│   │   │   │   │     }
│   │   │   │   └── [más assets]
│   │   │   │
│   │   │   ├── listings/  (Items genéricos: vehículos, servicios, productos)
│   │   │   │   ├── v1-toyota-corolla/
│   │   │   │   │   └── {
│   │   │   │   │       "id": "v1-toyota-corolla",
│   │   │   │   │       "type": "vehicle",  ← Cada item define su tipo
│   │   │   │   │       "title": "Toyota Corolla 2023",
│   │   │   │   │       "description": "...",
│   │   │   │   │       "brand": "Toyota",
│   │   │   │   │       "model": "Corolla",
│   │   │   │   │       "year": 2023,
│   │   │   │   │       "price": 25000,
│   │   │   │   │       "image": "asset-123",
│   │   │   │   │       "createdAt": "2026-02-01T10:00:00Z",
│   │   │   │   │       "updatedAt": "2026-02-21T14:30:00Z"
│   │   │   │   │     }
│   │   │   │   ├── s1-chequeo-cardiaco/
│   │   │   │   │   └── {
│   │   │   │   │       "id": "s1-chequeo-cardiaco",
│   │   │   │   │       "type": "service",  ← Mismo colección, distinto tipo
│   │   │   │   │       "title": "Chequeo Cardiaco",
│   │   │   │   │       "description": "...",
│   │   │   │   │       "price": 150,
│   │   │   │   │       "duration_minutes": 30,
│   │   │   │   │       "image": "asset-789"
│   │   │   │   │     }
│   │   │   │   └── [más items]
│   │   │   │
│   │   │   └── forms/  (Datos de formularios)
│   │   │       ├── contact_v1/
│   │   │       │   ├── submission-001/
│   │   │       │   │   └── {
│   │   │       │   │       "nombre": "Juan Pérez",
│   │   │       │   │       "email": "juan@example.com",
│   │   │       │   │       "asunto": "consulta",
│   │   │       │   │       "mensaje": "Me interesa...",
│   │   │       │   │       "submittedAt": "2026-02-21T10:00:00Z",
│   │   │       │   │       "ipAddress": "203.0.113.42",
│   │   │       │   │       "userAgent": "Mozilla/5.0...",
│   │   │       │   │       "read": false
│   │   │       │   │     }
│   │   │       │   └── [más submissions]
│   │   │       └── [más formas]
│   │   │
│   │   ├── webhooks/  (Integraciones del cliente)
│   │   │   └── form.submitted/
│   │   │       └── {
│   │   │           "eventType": "form.submitted",
│   │   │           "url": "https://api.cliente.com/webhooks/forms",
│   │   │           "active": true,
│   │   │           "createdAt": "2026-02-21T10:00:00Z",
│   │   │           "lastFired": "2026-02-21T15:23:00Z"
│   │   │         }
│   │   │
│   │   └── users/  (Usuarios del cliente con roles)
│   │       ├── admin-123/
│   │       │   └── { "email": "admin@autoelite.com", "role": "admin", ... }
│   │       └── editor-456/
│   │           └── { "email": "editor@autoelite.com", "role": "editor", ... }
│   │
│   ├── clinic-buenos-aires/
│   │   ├── settings/
│   │   ├── pages/
│   │   │   ├── home/
│   │   │   ├── servicios/
│   │   │   └── contacto/
│   │   ├── content/
│   │   │   ├── listings/ (servicios médicos)
│   │   │   ├── assets/
│   │   │   └── forms/
│   │   └── [estructura idéntica]
│   │
│   └── pizzeria-palermo/
│       ├── settings/
│       ├── pages/
│       │   ├── home/
│       │   ├── menu/
│       │   └── pedidos/
│       ├── content/
│       │   ├── listings/ (items de menú)
│       │   ├── assets/
│       │   └── forms/
│       └── [estructura idéntica]
```

---

## 3. Flujos de Datos

### 3.1 Lectura Pública (Usuario Final)

```
Usuario abre: https://autoelite.com/catalogo
    ↓
1. index-dynamic.html (scaffold vacío)
    ↓
2. pageRouter.js detecta slug="catalogo"
    ↓
3. getTenantId() → "autoelite-concesionaria" (del hostname)
    ↓
4. dataLayer.getPage(clientId, "catalogo") → Query Firestore
    ├─ SELECT * FROM clients/{clientId}/pages/catalogo
    ├─ WHERE status = "published"
    └─ Retorna JSON con secciones
    ↓
5. sectionRenderer.js renderiza cada sección:
    ├─ sección tipo "hero" → blockRegistry.hero.render()
    └─ sección tipo "listingsGrid" → blockRegistry.listingsGrid.render()
         ├─ Query listings por itemType
         └─ Renderiza grilla
    ↓
6. Inyecta HTML en DOM
    ↓
Usuario ve página con contenido dinámico ✓
```

### 3.2 Edición en Admin (Editor/Admin)

```
Admin abre: https://autoelite.com/admin/builder
    ↓
1. admin-builder-template.html carga
    ↓
2. Validar custom claims: ADMIN ✓
    ↓
3. loadPages() → Query pages del cliente
    ├─ SELECT id, title, status FROM pages
    └─ Mostrar en dropdown (todas: draft + published)
    ↓
4. Admin selecciona "catalogo" → loadPage("catalogo")
    ├─ Retorna página COMPLETA (incluyendo si es draft)
    └─ Renderiza preview en el builder
    ↓
5. Admin cliquea sección "listingsGrid" → updateInspector()
    ├─ Muestra form con propiedades:
    │  ├─ title (text field)
    │  ├─ itemType (select: vehicle/service/product)
    │  ├─ filters (checkboxes)
    │  └─ limit (number input)
    └─ Valida en tiempo real
    ↓
6. Admin cambia "limit" 12 → 20 → isDirty = true
    ├─ Re-renderiza preview
    └─ Actualiza section.props
    ↓
7. Admin cliquea "Guardar" → savePageDraft()
    ├─ savePage(clientId, page)
    ├─ page.status = "draft"
    ├─ page.updatedAt = NOW
    ├─ page.editor = {userId, email}
    └─ Persiste en Firestore
    ↓
8. Admin cliquea "Publicar" → publishPage()
    ├─ page.status = "published"
    ├─ page.publishedAt = NOW
    ├─ Persiste en Firestore
    ├─ EMITE evento: "page.published"
    │   └─ Ejecuta webhooks registrados (si existen)
    └─ Alert: "✓ Página publicada"
    ↓
9. Usuario ve cambios en https://autoelite.com/catalogo ✓
```

### 3.3 Envío de Formulario

```
Usuario llena contact form en https://autoelite.com/contacto
    ↓
1. contactForm bloque renderizado por sectionRenderer
    ├─ HTML con campos definidos en Firestore
    └─ Validación en cliente con outputsSystem
    ↓
2. Usuario hace submit
    ↓
3. submitForm(formData, contactForm, clientId)
    ├─ Validar todos los campos
    ├─ Si error: mostrar message.errors
    └─ Si OK: continuar
    ↓
4. Guardar en Firestore: clients/{clientId}/content/forms/{formId}/submission-{id}
    ├─ Incluye: formData + submittedAt + ipAddress + userAgent
    └─ Persistido
    ↓
5. emitEvent("form.submitted", {clientId, formId, formData, ...})
    ↓
6. executeWebhooks(clientId, "form.submitted", payload)
    ├─ Query webhooks registrados para "form.submitted"
    └─ POST a https://api.cliente.com/webhooks/forms (si está registrado)
         ├─ URL: https://api.cliente.com/webhooks/forms
         ├─ Payload: {event, timestamp, data: {clientId, formId, formData}}
         └─ Retry logic (si hay error)
    ↓
7. Mostrar success message al usuario ✓
    ↓
8. Admin ve submission en admin panel (próxima fase)
```

---

## 4. Arquitectura de Código

```
js/
├── auth.js                    [Existing] Firebase auth + custom claims listener
├── firebase.js                [Existing] Firebase config + init
├── tenant.js                  [Existing] hostname → clientId resolver
├── dataLayer.js               [Existing] Firestore CRUD + caché
├── sectionRenderer.js         [Existing] Renderiza bloques
├── pageRouter.js              [Existing] Route matching + SEO
├── blockRegistry.js           [New] Definiciones de bloques
├── outputsSystem.js           [New] Validación + formularios + webhooks
├── formBuilder.js             [TODO] Generador de forms dinámicos
├── adminBuilder.js            [TODO] Lógica del admin builder
└── main.js                    [Existing] Entry point

HTML/
├── index-dynamic.html         [Existing] Scaffold para rendering público
├── admin-builder-template.html[New] UI del admin builder
└── login.html                 [Existing] Login page

CSS/
└── style.css                  [Existing] Estilos globales

Config/
├── firestore.rules            [Existing] Reglas de seguridad
├── wrangler.toml              [Existing] Config Cloudflare Workers
└── package.json               [Existing] Dependencies

Admin Tools/
├── assignAdminByEmail.js      [Existing] Setup inicial
├── setClaim.js                [Existing] Custom claims manager
└── createClient.js            [TODO] Crear nuevo cliente
```

---

## 5. Checklist de Requisitos

- [x] **Multi-Tenant:** Aislamiento por clientId en Firestore + custom claims
- [x] **Multi-Rubro:** Bloques genéricos (no hardcoded a "vehiculos")
- [x] **Pages + Sections:** Estructura JSON con tipo + propiedades
- [x] **Draft/Publish:** status field + workflow de publicación
- [x] **Rendering Dinámico:** index-dynamic.html + pageRouter + sectionRenderer
- [x] **Validación:** outputsSystem + blockRegistry.validation
- [x] **Formularios:** createFormOutput + submitForm + Firestore storage
- [x] **Webhooks:** registerWebhook + executeWebhooks + event listeners
- [x] **Outputs:** ValidationRules + BlockOutputs + EventTriggers

---

## 6. Diferencias vs. Sistema Anterior (Vehiculos.html)

| Aspecto | Anterior | Nuevo |
|--------|---------|-------|
| Contenido | HTML estático (vehiculos.html) | JSON dinámico en Firestore |
| Renderizado | Server-side / HTML | Client-side / JavaScript |
| Bloques | Hardcoded a "vehiculos" | Genéricos (listingsGrid, contactForm) |
| Multi-rubro | No soportado | Soportado vía type + presets |
| Admin | Admin.html (CRUD vehiculos) | admin-builder.html (builder visual) |
| Draft/Publish | No existía | Implementado con status field |
| Validación | Ninguna | outputsSystem + blockRegistry |
| Webhooks | No | Implementado con executeWebhooks |
| Forms | Ninguno | contactForm block + outputsSystem |

---

## 7. Seguridad

**Firestore Rules:**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Verificar que el cliente accede solo sus datos
    match /clients/{clientId}/{path=**} {
      allow read, write: if request.auth.token.clientId == clientId && 
                           request.auth.token.role in ['admin', 'editor'];
    }
    
    // Páginas publicadas: lectura pública
    match /clients/{clientId}/pages/{pageId} {
      allow read: if resource.data.status == 'published';
      allow write: if request.auth.token.clientId == clientId && 
                      request.auth.token.role == 'admin';
    }
  }
}
```

**Custom Claims (Firebase Auth):**
```json
{
  "clientId": "autoelite-concesionaria",
  "role": "admin",  // admin, editor, viewer
  "email": "admin@autoelite.com"
}
```

---

## 8. Performance

**Caché cliente (dataLayer.js):**
- 5 minutos TTL por tenant
- Invalida al salvar página
- Service Worker + HTTP caché

**Optimizaciones Firestore:**
- Índices en `(clientId, status)`
- Denormalización de listings en preview
- Batch reads (getMultiple)

---

**Este documento especifica la arquitectura completa del sistema. Todos los desarrollos deben alinearse con estos requisitos.**

**Responsable:** Tech Lead  
**Última actualización:** 21 de febrero de 2026
