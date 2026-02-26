# Outputs System - Guía de Uso

**Archivo:** `js/outputsSystem.js`  
**Módulo:** Unificado de validación, formularios, eventos y propiedades de bloques

## 📋 Índice

1. [Validación (Validation Outputs)](#1-validation-outputs)
2. [Formularios (Form Outputs)](#2-form-outputs)
3. [Bloques (Block Outputs)](#3-block-outputs)
4. [Eventos (Event Outputs)](#4-event-outputs)
5. [Casos de Uso](#casos-de-uso)

---

## 1. Validation Outputs

**Propósito:** Definir reglas de validación reutilizables + mostrar mensajes de error personalizados

### Validadores Disponibles
```javascript
import { ValidationRules, validateBlock } from "./js/outputsSystem.js";

// Validadores integrados
ValidationRules.string(value, { minLength: 5, maxLength: 100, pattern: "^[a-z]+$" })
ValidationRules.email(value)
ValidationRules.url(value)
ValidationRules.number(value, { min: 0, max: 100 })
ValidationRules.image(file, { maxSizeKB: 5120, types: ['image/jpeg', 'image/png'] })
ValidationRules.file(file, { maxSizeKB: 10240, extensions: ['pdf', 'doc', 'docx'] })
```

### Validar Múltiples Campos
```javascript
const validationRules = {
  title: { type: 'string', options: { required: true, minLength: 5 } },
  email: { type: 'email', options: {} },
  age: { type: 'number', options: { min: 18, max: 120 } }
};

const result = validateBlock(data, validationRules);
// Retorna: { isValid: true/false, errors: {fieldName: "msg"}, warnings: [] }

if (!result.isValid) {
  Object.entries(result.errors).forEach(([field, msg]) => {
    console.error(`${field}: ${msg}`);
  });
}
```

### En Admin Builder
```javascript
// El inspector dinámico valida mientras escribes
function updateInspector(sectionId) {
  const section = window.currentPage.sections.find(s => s.id === sectionId);
  const schema = blockRegistry[section.type].schema;
  
  // Mostrar campos + validaciones en tiempo real
  const validation = validateBlock(section.props, schema.validation || {});
  
  if (!validation.isValid) {
    document.querySelector('#validationErrors').innerHTML = 
      Object.entries(validation.errors)
        .map(([field, msg]) => `<div class="error">${field}: ${msg}</div>`)
        .join('');
  }
}
```

---

## 2. Form Outputs

**Propósito:** Capturar datos de usuarios (contacto, leads, pedidos) + guardar en Firestore + webhooks

### Definir un Formulario
```javascript
import { createFormOutput, submitForm } from "./js/outputsSystem.js";

const contactForm = createFormOutput('contact_v1', [
  {
    id: 'nombre',
    name: 'nombre',
    label: 'Tu Nombre',
    fieldType: 'text',
    required: true,
    placeholder: 'Juan Pérez',
    validation: { type: 'string', options: { minLength: 2 } }
  },
  {
    id: 'email',
    name: 'email',
    label: 'Email',
    fieldType: 'email',
    required: true,
    validation: { type: 'email' }
  },
  {
    id: 'asunto',
    name: 'asunto',
    label: 'Asunto',
    fieldType: 'select',
    required: true,
    options: [
      { value: 'soporte', label: 'Soporte' },
      { value: 'ventas', label: 'Ventas' },
      { value: 'consulta', label: 'Consulta General' }
    ]
  },
  {
    id: 'mensaje',
    name: 'mensaje',
    label: 'Tu Mensaje',
    fieldType: 'textarea',
    required: true,
    validation: { type: 'string', options: { minLength: 10, maxLength: 1000 } },
    helpText: 'Mínimo 10 caracteres'
  }
]);

// Configurar dónde guardar + webhooks + emails
contactForm.onSubmit = {
  saveToFirestore: true,
  collection: 'content/forms/contact_v1',
  sendEmail: true,
  emailTo: 'admin@empresa.com',
  webhook: true,
  webhookUrl: 'https://example.com/api/contact'
};
```

### Procesar Envío
```javascript
// En el event listener del formulario HTML
document.querySelector('#contactForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = {
    nombre: document.querySelector('#nombre').value,
    email: document.querySelector('#email').value,
    asunto: document.querySelector('#asunto').value,
    mensaje: document.querySelector('#mensaje').value
  };
  
  const result = await submitForm(formData, contactForm, window.currentClientId);
  
  if (result.success) {
    alert(result.message); // ✓ Formulario enviado correctamente
    document.querySelector('#contactForm').reset();
  } else {
    // Mostrar errores de validación
    Object.entries(result.validation || {}).forEach(([field, error]) => {
      document.querySelector(`#${field}`).classList.add('error');
      document.querySelector(`#${field}-error`).textContent = error;
    });
  }
});
```

### Campos Disponibles
```
text, textarea, email, phone, number, select, checkbox, date, file
```

---

## 3. Block Outputs

**Propósito:** Definir qué datos PRODUCE cada tipo de bloque (propiedades, estructura)

### Registrar Outputs de un Bloque
```javascript
import { BlockOutputs } from "./js/outputsSystem.js";

// Consultar qué outputs tiene un bloque
const heroOutputs = BlockOutputs.hero;
console.log(heroOutputs.outputs);
/*
{
  title: { type: 'string', description: 'Título del hero' },
  subtitle: { type: 'string', description: 'Subtítulo' },
  bgImage: { type: 'asset', description: 'Imagen de fondo' },
  ctaText: { type: 'string', description: 'Texto del botón' },
  ctaUrl: { type: 'url', description: 'URL del CTA' }
}
*/
```

### Usar Outputs para Composition
```javascript
// Bloque 1: Hero genera datos
const hero = { type: 'hero', props: {title: "Hola", bgImage: "..." } };

// Bloque 2: Puede LEER outputs del hero para pre-rellenar
const contactForm = { 
  type: 'contactForm',
  props: {
    // Pre-rellenar asunto desde texto del hero
    defaultMessage: `Interesado en: ${hero.props.title}`
  }
};
```

### Definir Outputs Nuevas
```javascript
// Para bloques custom, extender BlockOutputs
BlockOutputs.customGallery = {
  outputs: {
    images: {
      type: 'array',
      items: {
        id: 'string',
        url: 'asset',
        title: 'string',
        alt: 'string'
      }
    },
    galleryConfig: {
      type: 'object',
      columns: 'number',
      spacing: 'string'
    }
  }
};
```

---

## 4. Event Outputs

**Propósito:** Webhooks, triggers y integraciones (Zapier, Slack, etc.)

### Event Triggers Disponibles
```javascript
import { EventTriggers, onEvent, emitEvent, registerWebhook } from "./js/outputsSystem.js";

// Eventos built-in
EventTriggers['page.published']     // Cuando se publica una página
EventTriggers['form.submitted']     // Cuando se recibe un form
EventTriggers['listing.updated']    // Cuando se actualiza un item
```

### Escuchar Eventos
```javascript
// En dataLayer.js o sectionRenderer.js
import { onEvent } from "./js/outputsSystem.js";

// Cuando se publica una página
onEvent('page.published', ({ detail: payload }) => {
  console.log('Página publicada:', payload);
  // { clientId, pageId, slug, publishedAt }
  // → Ejecutar webhooks registrados
});

// Cuando se envía un formulario
onEvent('form.submitted', ({ detail: payload }) => {
  console.log('Form enviado:', payload);
  // { clientId, formId, formData, submittedAt }
  // → Ejecutar webhooks + emails
});
```

### Disparar Eventos
```javascript
// En savePage() después de publicar
import { emitEvent, executeWebhooks } from "./js/outputsSystem.js";

async function savePage(clientId, page) {
  // ... guardar en Firestore
  
  if (page.status === 'published') {
    // Disparar evento
    emitEvent('page.published', {
      clientId,
      pageId: page.id,
      slug: page.slug,
      publishedAt: new Date()
    });
    
    // Ejecutar webhooks registrados
    await executeWebhooks(clientId, 'page.published', {
      pageId: page.id,
      slug: page.slug
    });
  }
}
```

### Registrar Webhooks
```javascript
import { registerWebhook } from "./js/outputsSystem.js";

// Cliente registra su webhook en Firestore
await registerWebhook(clientId, 'form.submitted', 'https://api.cliente.com/webhooks/forms');

// Cuando llega un form submission:
// 1. Se guarda en Firestore
// 2. Se dispara evento 'form.submitted'
// 3. Se ejecutan webhooks registrados (POST a URLs del cliente)
```

### Webhook Payload Ejemplo
```json
{
  "event": "form.submitted",
  "timestamp": "2026-02-21T10:30:00Z",
  "data": {
    "clientId": "autoelite-concesionaria",
    "formId": "contact_v1",
    "formData": {
      "nombre": "Juan Pérez",
      "email": "juan@example.com",
      "asunto": "ventas",
      "mensaje": "Me interesa..."
    },
    "submittedAt": "2026-02-21T10:30:00Z"
  }
}
```

---

## 5. Casos de Uso

### Caso 1: Contact Form con Validación
```javascript
import { createFormOutput, submitForm, validateBlock } from "./js/outputsSystem.js";
import { ContactFormBlock } from "./js/outputsSystem.js";

// Usar bloque predefinido
const contactForm = ContactFormBlock;

// Usuario envía formulario
const formData = { name: "Juan", email: "juan@example.com", message: "..." };

// Validar
const validation = validateBlock(formData, {
  name: { type: 'string', options: { minLength: 2 } },
  email: { type: 'email' },
  message: { type: 'string', options: { minLength: 10 } }
});

if (validation.isValid) {
  // Enviar con webhooks
  await submitForm(formData, contactForm, clientId);
} else {
  // Mostrar errores
  console.error(validation.errors);
}
```

### Caso 2: Admin Valida Propiedades de Bloque
```javascript
import { blockRegistry } from "./js/blockRegistry.js";
import { validateBlock } from "./js/outputsSystem.js";

// Usuario edita "Hero" en el inspector
const sectionProps = {
  title: "Mi Empresa",
  bgImage: "asset-123"
};

// Validar contra schema del bloque
const heroSchema = blockRegistry.hero.schema;
const result = validateBlock(sectionProps, heroSchema.validation);

if (!result.isValid) {
  // Mostrar errores en el inspector
  updateInspectorErrors(result.errors);
}
```

### Caso 3: Webhook → Integración con CRM
```javascript
import { registerWebhook, onEvent } from "./js/outputsSystem.js";

// Cliente registra webhook de CRM
await registerWebhook(clientId, 'form.submitted', 'https://crm.client.com/api/leads');

// El sistema automáticamente:
// 1. Escucha eventos 'form.submitted'
// 2. Ejecuta webhooks POST a la URL del cliente
// 3. Incluye validación y metadata

// El cliente recibe:
// POST https://crm.client.com/api/leads
// {
//   "event": "form.submitted",
//   "data": { formData },
//   "timestamp": "..."
// }
```

### Caso 4: Bloque con Salida Múltiple (Composite)
```javascript
// Bloque "Catalogo de Servicios"
const servicesBlock = {
  type: 'servicesGrid',
  props: {
    title: "Nuestros Servicios",
    services: [
      { id: 1, title: "Asesoría", description: "...", icon: "💼" },
      { id: 2, title: "Implementación", description: "...", icon: "⚙️" }
    ]
  },
  // Este bloque PRODUCE outputs:
  outputs: BlockOutputs.servicesGrid,
  // Que otros bloques pueden CONSUMIR
};
```

---

## 6. Integración con Admin Builder

### Template Actualizado (admin-builder-template.html)
```html
<script type="module">
  import { validateBlock, submitForm } from "./js/outputsSystem.js";
  import { blockRegistry } from "./js/blockRegistry.js";
  
  // Cuando usuario cambia un campo en el inspector
  function handlePropertyChange(sectionId, propName, propValue) {
    const section = window.currentPage.sections.find(s => s.id === sectionId);
    section.props[propName] = propValue;
    window.isDirty = true;
    
    // Validar en tiempo real
    const blockType = section.type;
    const schema = blockRegistry[blockType].schema;
    const validation = validateBlock(section.props, schema.validation);
    
    // Mostrar errores si existen
    showValidationErrors(validation.errors);
    
    // Re-renderizar preview
    renderPagePreview();
  }
</script>
```

---

## 7. Desarrollo Futuro

**Extensiones planeadas:**
- [ ] Flujos condicionales (if/then para bloques)
- [ ] Outputs async (llamadas a API antes de renderizar)
- [ ] Validaciones custom por tenant
- [ ] Webhooks con retry + logging
- [ ] Integración nativa: Zapier, Make, Slack
- [ ] Observables (RxJS) para outputs en tiempo real

---

## 📝 Checklist para Implementar

- [ ] Importar `outputsSystem.js` en `blockRegistry.js`
- [ ] Añadir `validation` a cada definición de bloque
- [ ] Actualizar `admin-builder-template.html` para mostrar errores
- [ ] Implementar `submitForm()` en contactForm block
- [ ] Registrar event listeners en `dataLayer.js`
- [ ] Implementar webhook execution en `savePage()`
- [ ] Documentar en DEVELOPER_REFERENCE.md
