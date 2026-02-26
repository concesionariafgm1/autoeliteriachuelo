# Próximos Pasos - SaaS Website Builder Multi-Tenant

## 🎯 Estatus Actual (Fase 1 Completada)

✅ **Completado:**
- Análisis de acoplamientos y arquitectura
- Data Layer (`js/dataLayer.js`) con todas funciones CRUD
- Section Renderer (`js/sectionRenderer.js`) con 12 tipos de bloques
- Page Router (`js/pageRouter.js`) con navegación dinámica
- Modelo de datos Firestore documentado
- HTML genérico dinámico (`index-dynamic.html`)
- FIRESTORE_SEED.js con ejemplos de datos
- Guía de implementación completa
- Test suite (`test-blocks.html`) para verificación

## 📋 Tareas Próximas (Orden de Prioridad)

### FASE 2: Validación & Setup Inicial

#### 2.1 Cargar datos de ejemplo en Firestore
**Tiempo estimado:** 30 min

**Descripción:**
El código está completo pero sin datos. Necesitas:
1. Crear la estructura de dominios, tenants, páginas en Firestore
2. Insertar los ejemplos del FIRESTORE_SEED.js
3. Configurar el dominio localhost para apuntar a "autoelite"

**Pasos:**
```bash
# Opción A: Manual en Firebase Console
# 1. Ir a Firestore Console
# 2. Crear collection "domains"
# 3. Crear documento "localhost" con { clientId: "autoelite" }
# 4. Crear collection clients/autoelite/settings/
# 5. Crear documento "public" con datos de clientSettingsPublic
# ... etc (ver FIRESTORE_SEED.js)

# Opción B: Con Firebase Admin SDK (RECOMENDADO)
# En admin-tools/ crear populate-firestore.js:
const admin = require('firebase-admin');
const seed = require('../FIRESTORE_SEED.js');

const db = admin.firestore();
// Insertar datos del seed...
```

**Verificación:**
```
- Abrir test-blocks.html en navegador
- Ejecutar "EJECUTAR TODOS LOS TESTS"
- Todos deben pasar (6/6 ✓)
```

---

#### 2.2 Probar index-dynamic.html con datos reales
**Tiempo estimado:** 20 min

**Descripción:**
Una vez que tengas datos en Firestore, prueba que el sitio dinámico carga:

**Pasos:**
```
1. Navegar a http://localhost:port/index-dynamic.html
2. Debería cargar página "home" desde Firestore
3. Verificar que:
   - Meta tags se inyectan correctamente
   - Secciones se renderizan
   - Imágenes cargan
   - Navegación funciona
```

**Checklist:**
- [ ] Página carga sin errores
- [ ] Meta tags (title, description) cambian según página
- [ ] Secciones hero se renderiza
- [ ] ListingsGrid carga y muestra items
- [ ] Navegación a `/vehiculos` funciona

---

### FASE 3: Admin Genérico (SIN CÓDIGO AÚN)

#### 3.1 Crear estructurausername admin básico
**Tiempo estimado:** 4-6 horas

**Descripción:**
Panel donde admins puedan:
- Ver lista de páginas
- Crear/editar/publicar páginas
- Agregar/reordenar/editar secciones
- Editar props de cada sección

**Estructura:**
```html
<!-- admin-blocks.html (nuevO) -->
<!DOCTYPE html>
<html>
  <head>...</head>
  <body>
    <nav>Admin</nav>
    
    <!-- Pages Manager -->
    <section id="pages-manager">
      <h2>Páginas</h2>
      <table>
        <tr><th>Slug</th><th>Título</th><th>Status</th><th>Acciones</th></tr>
        <!-- Listing dinámico de páginas -->
      </table>
      <button onclick="newPage()">+ Nueva Página</button>
    </section>
    
    <!-- Page Editor Modal -->
    <dialog id="page-editor">
      <form onsubmit="savePage()">
        <input name="slug" />
        <input name="title" />
        <select name="status">
          <option>draft</option>
          <option>published</option>
        </select>
        
        <!-- Sections Editor -->
        <div id="sections-list">
          <!-- Drag-drop de secciones -->
        </div>
        
        <button type="button" onclick="addSection()">+ Agregar Sección</button>
        <button type="submit">Guardar Página</button>
      </form>
    </dialog>
    
    <!-- Section Props Editor Modal -->
    <dialog id="section-editor">
      <!-- Formulario dinámico según section.type -->
    </dialog>
  </body>
</html>
```

**Módulos a crear:**
- `js/admin-blocks.js` - Lógica principal del admin
- `js/admin-pages.js` - CRUD de páginas
- `js/admin-sections.js` - Editor de secciones
- `css/admin-blocks.css` - Estilos del admin

**APIs Firestore:**
```javascript
// Agregar a dataLayer.js o crear adminLayer.js:
async function createPage(clientId, page)
async function updatePage(clientId, slug, page)
async function deletePage(clientId, slug)
async function publishPage(clientId, slug)
async function getPagesList(clientId)
```

**Checklist:**
- [ ] Listar páginas existentes
- [ ] Crear página nueva (draft)
- [ ] Editar metadatos de página
- [ ] Editar secciones (CRUD)
- [ ] Reordenar secciones (drag)
- [ ] Editar props por tipo
- [ ] Publicar/despublicar
- [ ] Preview en vivo

---

#### 3.2 Crear "Branding Manager"
**Tiempo estimado:** 2-3 horas

**Descripción:**
Formulario para editar `clients/{clientId}/settings/public`:

```html
<form onsubmit="saveSettings()">
  <fieldset>
    <legend>Branding</legend>
    <input type="text" name="brandName" required />
    <input type="text" name="logo" placeholder="URL de logo" />
    <input type="color" name="colorPrimary" />
    <input type="color" name="colorSecondary" />
  </fieldset>
  
  <fieldset>
    <legend>Contacto</legend>
    <input type="tel" name="phone" />
    <input type="email" name="email" />
    <input type="text" name="address" />
    <input type="tel" name="whatsapp" />
  </fieldset>
  
  <fieldset>
    <legend>Redes Sociales</legend>
    <input type="url" name="instagram" placeholder="https://instagram.com/..." />
    <input type="url" name="facebook" />
  </fieldset>
  
  <fieldset>
    <legend>Publicación</legend>
    <label>
      <input type="checkbox" name="published" />
      Sitio publicado
    </label>
  </fieldset>
  
  <button type="submit">Guardar Configuración</button>
</form>
```

---

### FASE 4: Módulo Listings/Productos (SIN CÓDIGO AÚN)

#### 4.1 CRUD de Listings
**Tiempo estimado:** 3-4 horas

**Descripción:**
Interfaz para gestionar productos:
- Listado de items
- Crear/editar/eliminar
- Upload de imágenes (Cloudinary)
- Vista previa

```html
<!-- admin-listings.html (nuevo) -->
<section id="listings-manager">
  <table>
    <tr>
      <th>Thumbnail</th>
      <th>Título</th>
      <th>Precio</th>
      <th>Status</th>
      <th>Acciones</th>
    </tr>
    <!-- Items: editar, eliminar, ver -->
  </table>
  <button onclick="newListing()">+ Nuevo Producto</button>
</section>

<!-- Editor Modal -->
<dialog id="listing-editor">
  <form onsubmit="saveListing()">
    <input name="title" />
    <input name="price" type="number" />
    <select name="category">
      <option value="vehicles">Vehículos</option>
      <option value="services">Servicios</option>
      <option value="products">Productos</option>
    </select>
    
    <!-- Image Upload. -->
    <div id="image-upload">
      <input type="file" accept="image/*" multiple />
      <!-- Cloudinary preview -->
    </div>
    
    <!-- Atributos dinámicos según category -->
    <div id="attributes-editor">
      <!-- Se genera según el rubro -->
    </div>
    
    <button type="submit">Guardar Producto</button>
  </form>
</dialog>
```

**Trabajo a hacer:**
- Integración Cloudinary para uploads
- Form dinámico según category (vehículos: marca/modelo/año, etc)
- Preview en tiempo real
- Rate limiting & validaciones

---

#### 4.2 Migración: vehículos antiguos → listings nuevos
**Tiempo estimado:** 1-2 horas

**Descripción:**
Script que convierte documentos de vehicles → content/listings:

```javascript
// admin-tools/migrateVehicles.js
const admin = require('firebase-admin');

async function migrateVehicles() {
  const db = admin.firestore();
  const vehiclesRef = db.collection('vehicles');
  const vehiclesDocs = await vehiclesRef.getDocs();

  for (const doc of vehiclesDocs.docs) {
    const vehicle = doc.data();
    
    // Convertir a listing
    const listing = {
      status: 'published',
      category: 'vehicles',
      title: `${vehicle.marca} ${vehicle.modelo} ${vehicle.año}`,
      price: vehicle.precio,
      mainImage: vehicle.images?.[0] || '',
      media: (vehicle.images || []).map(url => ({
        url,
        alt: 'Imagen del vehículo'
      })),
      attributes: {
        brand: vehicle.marca,
        model: vehicle.modelo,
        year: vehicle.año,
        km: vehicle.km,
        engine: vehicle.motor,
        fuel: vehicle.combustible,
        transmission: vehicle.transmision
      },
      tags: ['migracion'],
      createdAt: doc.createTime?.toMillis() || Date.now(),
      updatedAt: Date.now()
    };
    
    // Guardar en nueva colección
    await db.collection('clients/autoelite/content/listings')
      .doc(doc.id)
      .set(listing);
  }
  
  console.log('✓ Migración completada');
}
```

---

### FASE 5: Formularios Dinámicos (SIN CÓDIGO AÚN)

#### 5.1 Block "contactForm"
**Tiempo estimado:** 2-3 horas

**Descripción:**
- Tipo de bloque que renderiza un formulario dinámico
- Envía datos a Firestore (collection leads)
- Validación y rate limiting
- Webhook a email/WhatsApp

```javascript
// js/sectionRenderer.js - agregar:
function renderContactForm(props = {}) {
  const { fields = [], submitText = 'Enviar' } = props;
  // Generar formulario HTML
  // Attach event listeners para submit
}
```

**Props:**
```javascript
{
  type: 'contactForm',
  props: {
    fields: [
      { name: 'nombre', type: 'text', required: true, placeholder: 'Tu nombre' },
      { name: 'email', type: 'email', required: true },
      { name: 'mensaje', type: 'textarea', required: true }
    ],
    submitText: 'Enviar',
    successMessage: 'Gracias, pronto te contactaremos'
  }
}
```

---

#### 5.2 Backend: Cloud Function para leads
**Tiempo estimado:** 1-2 horas

**Descripción:**
Cloud Function (Cloudflare Worker) que:
- Valida datos del formulario
- Rate-limits por IP
- Guarda en Firestore (leads collection)
- Envía email/WhatsApp webhook

```javascript
// functions/submitLead.js (Cloud Function)
export async function handleLead(request) {
  const { clientId, nombre, email, mensaje } = await request.json();
  
  // Validar
  if (!nombre || !email || !mensaje) {
    return { error: 'Campos requeridos' };
  }
  
  // Rate limit por IP
  const ip = request.headers.get('cf-connecting-ip');
  // ... check rate limit
  
  // Guardar en Firestore
  const leadDoc = {
    clientId,
    nombre,
    email,
    mensaje,
    ipAddress: ip,
    status: 'new',
    createdAt: Date.now()
  };
  
  await db.collection(`clients/${clientId}/leads`).add(leadDoc);
  
  // Webhook (opcional)
  if (settings.webhookUrl) {
    await fetch(settings.webhookUrl, {
      method: 'POST',
      body: JSON.stringify(leadDoc)
    });
  }
  
  return { success: true };
}
```

---

### FASE 6: Presets Verticales (SIN CÓDIGO AÚN)

#### 6.1 Crear Preset "Cars" (Concesionaria)
**Tiempo estimado:** 2-3 horas

**Descripción:**
Script que setea un nuevo tenant como "concesionaria de autos":

```javascript
// admin-tools/createPresetCars.js
async function createPresetCars(clientId) {
  // Crear páginas:
  // - home (con hero + services grid)
  // - vehiculos (con listingsGrid)
  // - contacto (con map + hours)
  // - nosotros (con testimonials)
  
  // Crear colección listings con schema autos:
  // { brand, model, year, km, price, engine, fuel, ... }
}
```

---

#### 6.2 Crear Preset "Clinic"
**Tiempo estimado:** 2-3 horas

**Descripción:**
Para consultorios médicos:
- Páginas: home, servicios, equipo, turnos, contacto
- Listings como "servicios" (consultas, tratamientos)
- Schema: serviceName, duration, price, description

---

#### 6.3 Crear Preset "Shop"
**Tiempo estimado:** 2-3 horas

**Descripción:**
Para tiendas de e-commerce:
- Páginas: home, productos, about, contacto
- Listings como "productos" con inventario
- Schema: sku, stock, categoria, descripción

---

## 🔑 Keywords para Próximo Trabajo

**Antes de empezar Fase 2:**

1. **Firestore Rules** - Asegurar acceso público/privado
2. **Firebase Auth Integration** - admin.js + claims
3. **Cloudinary Upload** - Integrar en admin
4. **Rate Limiting** - Para leads/submissions
5. **Error Handling** - Manejo defensivo de props nulos

**Herramientas recomendadas:**
- Firebase Admin SDK (para scripts)
- Cloudflare Workers (para Cloud Functions)
- DOMPurify (para sanitización de HTML en richText)
- PDF library (para exportar reportes)

---

## 📊 Roadmap Completo (Timeline)

| Fase | Tarea | Duración | Status |
|------|-------|----------|--------|
| 1 | Arquitectura + Data Layer | 8h | ✅ HECHO |
| 2 | Validación & Setup | 1.5h | ⏳ SIGUIENTE |
| 3 | Admin Genérico | 10h | ⏹️ Planificado |
| 4 | Módulo Listings | 5h | ⏹️ Planificado |
| 5 | Formularios Dinámicos | 4h | ⏹️ Planificado |
| 6 | Presets Verticales | 8h | ⏹️ Planificado |
| 7 | Optimizaciones | 4h | ⏹️ Planificado |
| **TOTAL** | | **40h** | |

---

## 🎁 Archivos Nuevos Creados

✅ **Módulos Principales:**
- [js/dataLayer.js](./js/dataLayer.js) - 260 líneas
- [js/sectionRenderer.js](./js/sectionRenderer.js) - 550 líneas
- [js/pageRouter.js](./js/pageRouter.js) - 300 líneas

✅ **HTML & Tests:**
- [index-dynamic.html](./index-dynamic.html) - HTML genérico
- [test-blocks.html](./test-blocks.html) - Suite de tests

✅ **Documentación:**
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Diseño detallado
- [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - Guía de uso
- [FIRESTORE_SEED.js](./FIRESTORE_SEED.js) - Datos de ejemplo
- [NEXT_STEPS.md](./NEXT_STEPS.md) - Este archivo

---

## 🚨 Checklist Pre-Fase 2

Antes de cargar datos en Firestore:

- [ ] Leer arquitectura completa (ARCHITECTURE.md)
- [ ] Entender modelos de datos
- [ ] Revisar FIRESTORE_SEED.js
- [ ] Verificar que Firebase está inicializado
- [ ] Tenes acceso a Firestore Console
- [ ] Entiendes el flujo: domain → tenant → pages → sections

---

**¿Dudas?** Lee IMPLEMENTATION_GUIDE.md sección "Troubleshooting"

**¿Listo para Fase 2?** Empeza por crear los datos de ejemplo en Firestore.

🚀 **¡Adelante con el SaaS!**
