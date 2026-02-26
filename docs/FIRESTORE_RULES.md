# 🔒 Firestore Security Rules & Arquitectura de Seguridad

## 🎯 Principios de Seguridad

### Golden Rules

1. **Lectura pública:** Solo `published` content
2. **Lectura privada:** Solo usuario authenticated del tenant correcto
3. **Escritura:** Solo authenticated users con rol admin/editor
4. **Tenant isolation:** Cada usuario solo ve/edita su clientId

---

## 📋 Firestore Rules Esperadas

```javascript
// firestore.rules

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ============================================
    // HELPER functions
    // ============================================
    
    /**
     * Obtener el clientId del usuario logueado
     * (desde custom claims de Firebase Auth)
     */
    function getUserClientId() {
      return request.auth.token.clientId;
    }

    /**
     * Verificar si el usuario es admin
     */
    function isAdmin() {
      return request.auth.token.role == 'admin';
    }

    /**
     * Verificar si el usuario es editor o admin
     */
    function isEditorOrAdmin() {
      return request.auth.token.role in ['admin', 'editor'];
    }

    /**
     * Error messages
     */
    function unauthorized() {
      return request.auth == null;
    }

    // ============================================
    // PUBLIC COLLECTIONS (Lectura pública)
    // ============================================

    /**
     * Dominios: mappeo hostname -> clientId
     * Pública (sin autenticación requerida)
     */
    match /domains/{hostname} {
      allow read: if true; // Público, necesario para resolver tenant
      allow write: if false; // Admin solo en backend
    }

    /**
     * Settings públicos de un tenant
     * Ej: clients/autoelite/settings/public
     * SOLO this document es accesible públicamente
     */
    match /clients/{clientId}/settings/public {
      allow read: if true; // Público (UI settings, branding info, etc.)
      allow write: if isAdmin() && getUserClientId() == clientId;
    }

    /**
     * Settings privados de un tenant
     * Ej: clients/autoelite/settings/analytics, settings/apikeys, etc.
     * Solo el owner del cliente puede acceder
     */
    match /clients/{clientId}/settings/{docId} {
      allow read, write: if (docId == "public") || (
        isAdmin() && getUserClientId() == clientId
      );
    }

    /**
     * Páginas PUBLISHED (públicas)
     * Ej: clients/autoelite/pages/home (si status == 'published')
     */
    match /clients/{clientId}/pages/{pageSlug} {
      allow read: if resource.data.status == 'published' || (
        isEditorOrAdmin() && getUserClientId() == clientId
      );
      allow write: if isEditorOrAdmin() && getUserClientId() == clientId;
    }

    /**
     * Listings PUBLISHED (públicos)
     * Ej: clients/autoelite/content/listings/vehicle-001 (si status == 'published')
     */
    match /clients/{clientId}/content/listings/{listingId} {
      allow read: if resource.data.status == 'published' || (
        isEditorOrAdmin() && getUserClientId() == clientId
      );
      allow write: if isEditorOrAdmin() && getUserClientId() == clientId;
    }

    /**
     * Assets (imágenes, etc.)
     * Si están asignados a secciones/listings published, accesibles públicamente
     * Pero la metadata (alt, folder) solo editable por admins
     */
    match /clients/{clientId}/content/assets/{assetId} {
      allow read: if true; // URLs públicas de imágenes
      allow write: if isAdmin() && getUserClientId() == clientId;
    }

    // ============================================
    // PRIVATE COLLECTIONS (Autenticación requerida)
    // ============================================

    /**
     * Page Versions/Revisions
     * Historia de cambios, solo para admins
     */
    match /clients/{clientId}/pageVersions/{slug}/revisions/{revId} {
      allow read, write: if isAdmin() && getUserClientId() == clientId;
    }

    /**
     * Leads (formularios de contacto)
     * Los visitors escriben, admins leen
     */
    match /clients/{clientId}/leads/{leadId} {
      // Lectura: solo admin
      allow read: if isAdmin() && getUserClientId() == clientId;
      // Escritura: cualquiera (public form submit, pero desde backend preferible)
      allow create: if true; // Considerar agregar rate-limiting
      // Edición: solo admin (marcar como atendido)
      allow update: if isAdmin() && getUserClientId() == clientId;
      allow delete: if isAdmin() && getUserClientId() == clientId;
    }

    /**
     * Presets (plantillas de tenant)
     * Públicas para ver, editables solo por super-admin
     */
    match /presets/{presetName} {
      allow read: if true;
      allow write: if false; // Editables solo en backend/scripts
    }

    // ============================================
    // CATCH-ALL (Deny by default)
    // ============================================
    
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 🚀 Implementación en Firestore Console

### 1. Deploy Rules

```bash
# Copiar firestore.rules a la consola:
# https://console.firebase.google.com/project/[PROJECT]/firestore/rules

# O via Firebase CLI:
firebase deploy --only firestore:rules
```

### 2. Testing Rules

Usa el **Simulator de Firestore Rules:**

```
Path: domains/localhost
Auth: Unauthenticated
Action: get
Expected: ✓ ALLOW (es pública)

---

Path: clients/autoelite/pages/home
Auth: User { clientId: "autoelite", role: "editor" }
Status: published
Action: get
Expected: ✓ ALLOW

---

Path: clients/autoelite/pages/home (draft)
Auth: User { clientId: "autoelite", role: "editor" }
Status: draft
Action: get
Expected: ✓ ALLOW (es el tenant correcto)

---

Path: clients/autoelite/pages/home (draft)
Auth: User { clientId: "competitor", role: "editor" }
Status: draft
Action: get
Expected: ✗ DENY (diferente tenant)

---

Path: clients/autoelite/leads/lead-001
Auth: Unauthenticated
Action: create
Expected: ✓ ALLOW (form público)

---

Path: clients/autoelite/leads/lead-001
Auth: User { clientId: "autoelite", role: "editor" }
Status: draft
Action: read
Expected: ✗ DENY (no es admin)
```

---

## 📊 Matriz de Acceso

| Recurso | Usuario Público | Editor | Admin | Super-Admin |
|---------|---|---|---|---|
| `domains/{hostname}` | 🟢 R | 🟢 R | 🟢 R | 🟢 RW |
| `settings/public` | 🟢 R | 🟢 R | 🟢 R | 🟢 RW |
| `settings/{other}` (private) | ❌ | ❌ (otro tenant) | 🟢 RW (propio) | 🟢 RW |
| `pages/{slug}` (published) | 🟢 R | 🟢 R | 🟢 R | 🟢 RW |
| `pages/{slug}` (draft) | ❌ | 🟢 RW (propio tenant) | 🟢 RW | 🟢 RW |
| `content/listings` (published) | 🟢 R | 🟢 R | 🟢 RW | 🟢 RW |
| `content/listings` (draft) | ❌ | 🟢 RW (propio tenant) | 🟢 RW | 🟢 RW |
| `content/assets` | 🟢 R (URLs) | 🟢 R | 🟢 RW | 🟢 RW |
| `pageVersions` | ❌ | ❌ | 🟢 RW | 🟢 RW |
| `leads` | ❌ R, 🟢 W (form) | ❌ | 🟢 RW | 🟢 RW |
| `presets` | 🟢 R | 🟢 R | 🟢 R | 🟢 RW |

---

## 🔐 Custom Claims Setup

Para que las rules funcionen, agregar custom claims en Firebase Auth:

```javascript
// backend/admin-tools/setClaim.js
const admin = require('firebase-admin');

async function addCustomClaims(uid, clientId, role) {
  try {
    await admin.auth().setCustomUserClaims(uid, {
      clientId: clientId,
      role: role // 'admin' | 'editor' | 'viewer'
    });
    console.log(`✓ Claims set for ${uid}`);
  } catch (error) {
    console.error('Error setting claims:', error);
  }
}

module.exports = { addCustomClaims };
```

Uso:

```javascript
// Hacer admin a un usuario específico
addCustomClaims('user-123', 'autoelite', 'admin');

// Hacer editor a otro
addCustomClaims('user-456', 'autoelite', 'editor');
```

---

## 🛡️ Protecciones Adicionales

### 1. Rate Limiting en Leads

Considerar agregar rate-limiting en backend (Cloud Function):

```javascript
// functions/submitLead.js
const rateLimit = require('express-rate-limit');

const leadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5 // Máx 5 requests por IP
});

app.post('/api/leads/:clientId', leadLimiter, async (req, res) => {
  // ... validate and save
});
```

### 2. Validación de Contenido

En `js/dataLayer.js`, validar antes de guardar:

```javascript
export async function savePage(clientId, pageDoc) {
  // Validar estructura
  if (!pageDoc.slug) throw new Error('slug required');
  if (!Array.isArray(pageDoc.sections)) throw new Error('sections must be array');
  
  // Validar que cada sección tenga type
  pageDoc.sections.forEach(s => {
    if (!BLOCK_REGISTRY[s.type]) throw new Error(`Unknown block type: ${s.type}`);
  });

  // Guardar
  await firestore.collection('clients').doc(clientId)
    .collection('pages').doc(pageDoc.slug).set(pageDoc);
}
```

### 3. Sanitización en Renderer

En `js/sectionRenderer.js`, siempre escape HTML:

```javascript
function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
```

### 4. CORS & CSP Headers

En `_headers` (Cloudflare Pages):

```
/*
  Access-Control-Allow-Origin: https://example.com
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Referrer-Policy: strict-origin-when-cross-origin
```

---

## 🔄 Flujo de Seguridad Completo

### Usuario Público

```
1. Accede a index.html (/)
   ↓
2. tenant.js resuelve clientId desde hostname
   (Lectura pública a domains/{hostname})
   ↓
3. dataLayer.getPublicSettings(clientId)
   (Lectura pública a settings/public)
   ↓
4. pageRouter detecta slug, carga pages/{slug}
   (Lectura pública si status='published', DENY si draft)
   ↓
5. sectionRenderer renderiza secciones a HTML
   (No toca Firestore, todo client-side)
   ↓
6. Usuario ve contenido publicado
```

### Admin Edita Página

```
1. Accede a admin-builder.html
   ↓
2. auth.js verifica Firebase Auth + custom claims
   (Si no está logueado o sin role=admin, → /login.html)
   ↓
3. dataLayer.getPage(clientId, slug)
   (Lectura privada, ALLOW si clientId == auth.clientId && (published || draft))
   ↓
4. Admin edita secciones en UI
   (Todo en JavaScript, sin tocar Firestore)
   ↓
5. Admin hace click en "Guardar Draft"
   (savePage() → Firestore write, ALLOW si auth.clientId == clientId && role=admin)
   ↓
6. Draft actualizado en Firestore
   (Otros editores ven cambios en tiempo real)
   ↓
7. Admin hace click en "Publicar"
   (savePage() → UPDATE status='published', ALLOW si admin)
   ↓
8. Página disponible públicamente
```

### Visitor Envía Formulario

```
1. Usuario rellena formulario de contacto en /contacto
   ↓
2. Form submit → POST /api/leads (Cloud Function o Worker)
   ↓
3. Backend valida y crea doc en leads/{leadId}
   (Firestore rule: allow create if true)
   ↓
4. Admin ve lead en admin panel
   (Firestore rule: allow read if isAdmin)
   ↓
5. Admin marca como atendido (update status='handled')
   (Firestore rule: allow update if isAdmin)
```

---

## ✅ Checklist de Seguridad Pre-Deploy

- [ ] Firestore rules están en https://console.firebase.google.com
- [ ] Simulator de rules pasa todos los test cases
- [ ] Custom claims están configuradas para admins
- [ ] Todas las escrituras validadas en client + server
- [ ] HTML escapado en todos los renderers
- [ ] CORS headers configurados en _headers
- [ ] Rate limiting en leads form (backend)
- [ ] Backups automáticos habilitados en Firestore
- [ ] Audit logging habilitado (Firebase Logs)

---

## 📚 Referencias

- **Firestore Security Rules:** https://firebase.google.com/docs/firestore/security/start
- **Custom Claims:** https://firebase.google.com/docs/auth/admin-setup
- **OWASP:** https://owasp.org/www-project-top-ten/

---

**Próximo paso:** Validar que las rules se ejecutan correctamente en el simulador.
