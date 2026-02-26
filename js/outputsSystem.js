/**
 * OUTPUTS SYSTEM
 * 
 * Sistema unificado para definir outputs en bloques:
 * 1. Validación (reglas + mensajes de error)
 * 2. Formularios (captura de datos de usuarios)
 * 3. Eventos (webhooks, triggers, acciones)
 * 4. Propiedades (qué datos produce cada bloque)
 */

// ============================================
// 1. VALIDATION OUTPUTS
// ============================================

export const ValidationRules = {
  string: (value, opts = {}) => {
    if (opts.required && !value) return { valid: false, error: opts.requiredMsg || "Campo requerido" };
    if (opts.minLength && value.length < opts.minLength) return { valid: false, error: opts.minLengthMsg || `Mínimo ${opts.minLength} caracteres` };
    if (opts.maxLength && value.length > opts.maxLength) return { valid: false, error: opts.maxLengthMsg || `Máximo ${opts.maxLength} caracteres` };
    if (opts.pattern && !new RegExp(opts.pattern).test(value)) return { valid: false, error: opts.patternMsg || "Formato inválido" };
    return { valid: true };
  },

  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return { valid: false, error: "Email inválido" };
    return { valid: true };
  },

  url: (value) => {
    try {
      new URL(value);
      return { valid: true };
    } catch {
      return { valid: false, error: "URL inválida" };
    }
  },

  number: (value, opts = {}) => {
    const num = parseFloat(value);
    if (isNaN(num)) return { valid: false, error: "Debe ser un número" };
    if (opts.min !== undefined && num < opts.min) return { valid: false, error: `Mínimo: ${opts.min}` };
    if (opts.max !== undefined && num > opts.max) return { valid: false, error: `Máximo: ${opts.max}` };
    return { valid: true };
  },

  image: (file, opts = {}) => {
    const maxSize = opts.maxSizeKB ? opts.maxSizeKB * 1024 : 5 * 1024 * 1024;
    const allowedTypes = opts.types || ['image/jpeg', 'image/png', 'image/webp'];
    
    if (file.size > maxSize) return { valid: false, error: `Máximo ${opts.maxSizeKB || 5120}KB` };
    if (!allowedTypes.includes(file.type)) return { valid: false, error: `Tipos permitidos: ${allowedTypes.join(", ")}` };
    return { valid: true };
  },

  file: (file, opts = {}) => {
    const maxSize = opts.maxSizeKB ? opts.maxSizeKB * 1024 : 10 * 1024 * 1024;
    const allowedExt = opts.extensions || ['pdf', 'doc', 'docx'];
    
    if (file.size > maxSize) return { valid: false, error: `Máximo ${opts.maxSizeKB || 10240}KB` };
    const ext = file.name.split('.').pop().toLowerCase();
    if (!allowedExt.includes(ext)) return { valid: false, error: `Tipos permitidos: ${allowedExt.join(", ")}` };
    return { valid: true };
  }
};

/**
 * Validar múltiples campos contra reglas definidas
 * @param {Object} data - {fieldName: value}
 * @param {Object} rules - {fieldName: {type: 'string', required: true, ...opts}}
 * @returns {Object} {isValid: bool, errors: {fieldName: "msg"}, warnings: []}
 */
export function validateBlock(data, rules) {
  const errors = {};
  const warnings = [];
  
  Object.entries(rules).forEach(([fieldName, rule]) => {
    const value = data[fieldName];
    const validator = ValidationRules[rule.type];
    
    if (!validator) {
      warnings.push(`Validador desconocido: ${rule.type}`);
      return;
    }
    
    const result = validator(value, rule.options || {});
    if (!result.valid) {
      errors[fieldName] = result.error;
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
    timestamp: new Date().toISOString()
  };
}

// ============================================
// 2. FORM OUTPUTS
// ============================================

export const FormFieldTypes = {
  text: { label: "Texto corto", defaultValue: "" },
  textarea: { label: "Texto largo", defaultValue: "" },
  email: { label: "Email", defaultValue: "" },
  phone: { label: "Teléfono", defaultValue: "" },
  number: { label: "Número", defaultValue: 0 },
  select: { label: "Selectable", defaultValue: "", requiresOptions: true },
  checkbox: { label: "Checkbox", defaultValue: false },
  date: { label: "Fecha", defaultValue: "" },
  file: { label: "Archivo", defaultValue: null, requiresConfig: true }
};

/**
 * Definir un formulario con campos y validaciones
 */
export function createFormOutput(name, fields) {
  return {
    type: "form",
    name,
    fields: fields.map(f => ({
      id: f.id || `field-${Date.now()}`,
      name: f.name,
      label: f.label,
      fieldType: f.fieldType, // 'text', 'email', etc.
      required: f.required || false,
      validation: f.validation || null, // reglas de validación
      placeholder: f.placeholder || "",
      options: f.options || [], // para select
      helpText: f.helpText || ""
    })),
    onSubmit: {
      saveToFirestore: true,
      collection: `content/forms/${name}`,
      sendEmail: false,
      emailTo: null,
      webhook: false,
      webhookUrl: null
    }
  };
}

/**
 * Procesar envío de formulario
 */
export async function submitForm(formData, formOutput, clientId) {
  // 1. Validar todos los campos
  const validation = {};
  formOutput.fields.forEach(field => {
    if (field.required && !formData[field.id]) {
      validation[field.id] = "Requerido";
    }
    if (field.validation) {
      const result = validateBlock({ [field.id]: formData[field.id] }, { [field.id]: field.validation });
      if (!result.isValid) {
        validation[field.id] = result.errors[field.id];
      }
    }
  });
  
  if (Object.keys(validation).length > 0) {
    return { success: false, validation };
  }
  
  // 2. Guardar en Firestore
  if (formOutput.onSubmit.saveToFirestore) {
    try {
      const { db } = await import('./firebase.js');
      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
      
      await addDoc(collection(db, formOutput.onSubmit.collection), {
        ...formData,
        clientId,
        submittedAt: serverTimestamp(),
        ipAddress: await getClientIP(),
        userAgent: navigator.userAgent
      });
    } catch (err) {
      return { success: false, error: `Error al guardar: ${err.message}` };
    }
  }
  
  // 3. Enviar email si está configurado
  if (formOutput.onSubmit.sendEmail) {
    await notifyViaEmail(formData, formOutput.onSubmit.emailTo);
  }
  
  // 4. Disparar webhook si está configurado
  if (formOutput.onSubmit.webhook) {
    await triggerWebhook(formData, formOutput.onSubmit.webhookUrl);
  }
  
  return { success: true, message: "Formulario enviado correctamente" };
}

async function getClientIP() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return "unknown";
  }
}

async function notifyViaEmail(data, emailTo) {
  // Integración con Cloudflare Worker o servicio de email
  return fetch('/api/send-email', {
    method: 'POST',
    body: JSON.stringify({ data, to: emailTo })
  });
}

async function triggerWebhook(data, url) {
  return fetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' }
  });
}

// ============================================
// 3. BLOCK OUTPUTS (Data Definition)
// ============================================

/**
 * Define qué datos produce cada tipo de bloque
 * Permite composition y reuso de data structures
 */
export const BlockOutputs = {
  hero: {
    outputs: {
      title: { type: 'string', description: 'Título del hero' },
      subtitle: { type: 'string', description: 'Subtítulo' },
      bgImage: { type: 'asset', description: 'Imagen de fondo' },
      ctaText: { type: 'string', description: 'Texto del botón' },
      ctaUrl: { type: 'url', description: 'URL del CTA' }
    }
  },

  servicesGrid: {
    outputs: {
      services: {
        type: 'array',
        items: {
          id: 'string',
          icon: 'string',
          title: 'string',
          description: 'string'
        }
      }
    }
  },

  contactForm: {
    outputs: {
      formFields: {
        type: 'array',
        items: {
          id: 'string',
          name: 'string',
          fieldType: 'enum(text|email|phone|textarea)',
          required: 'boolean'
        }
      },
      submissions: {
        type: 'collection',
        path: 'content/forms/{formId}',
        schema: 'Datos capturados por usuarios'
      }
    }
  },

  testimonials: {
    outputs: {
      testimonials: {
        type: 'array',
        items: {
          id: 'string',
          quote: 'string',
          author: 'string',
          role: 'string',
          photo: 'asset'
        }
      }
    }
  }
};

// ============================================
// 4. EVENT OUTPUTS (Webhooks & Triggers)
// ============================================

export const EventTriggers = {
  // Cuando se publica una página
  'page.published': {
    trigger: 'Página publicada',
    payload: {
      clientId: 'string',
      pageId: 'string',
      slug: 'string',
      publishedAt: 'timestamp'
    },
    actions: [
      { type: 'webhook', description: 'Enviar webhook POST' },
      { type: 'email', description: 'Notificar por email' },
      { type: 'slack', description: 'Notificar en Slack' }
    ]
  },

  // Cuando se recibe un form submission
  'form.submitted': {
    trigger: 'Formulario enviado',
    payload: {
      clientId: 'string',
      formId: 'string',
      formData: 'object',
      submittedAt: 'timestamp'
    },
    actions: [
      { type: 'webhook', description: 'Enviar al webhook del cliente' },
      { type: 'email', description: 'Email de confirmación' },
      { type: 'zap', description: 'Integración con Zapier' }
    ]
  },

  // Cuando cambia un listing
  'listing.updated': {
    trigger: 'Listing actualizado',
    payload: {
      clientId: 'string',
      listingId: 'string',
      changes: 'object',
      updatedAt: 'timestamp'
    },
    actions: [
      { type: 'webhook', description: 'Webhook POST' },
      { type: 'email', description: 'Notificación al admin' }
    ]
  }
};

/**
 * Registrar event listener para triggers
 */
export function onEvent(eventType, callback) {
  const event = new CustomEvent(`output:${eventType}`);
  window.addEventListener(`output:${eventType}`, callback);
  
  return () => window.removeEventListener(`output:${eventType}`, callback);
}

/**
 * Disparar un evento (usado internamente por dataLayer, sectionRenderer)
 */
export function emitEvent(eventType, payload) {
  const event = new CustomEvent(`output:${eventType}`, { detail: payload });
  window.dispatchEvent(event);
  
  // También loguear para debugging
  console.log(`[Event] ${eventType}`, payload);
}

/**
 * Registrar webhook handler para un cliente
 */
export async function registerWebhook(clientId, eventType, webhookUrl) {
  const { db } = await import('./firebase.js');
  const { doc, setDoc } = await import('firebase/firestore');
  
  await setDoc(doc(db, `clients/${clientId}/webhooks`, eventType), {
    eventType,
    url: webhookUrl,
    active: true,
    createdAt: new Date(),
    lastFired: null
  });
}

/**
 * Ejecutar webhooks registrados para un evento
 */
export async function executeWebhooks(clientId, eventType, payload) {
  const { db } = await import('./firebase.js');
  const { collection, query, where, getDocs } = await import('firebase/firestore');
  
  try {
    const webhooks = await getDocs(
      query(collection(db, `clients/${clientId}/webhooks`), where('active', '==', true))
    );
    
    const promises = webhooks.docs.map(doc => {
      const webhook = doc.data();
      if (webhook.eventType === eventType) {
        return fetch(webhook.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: eventType,
            timestamp: new Date().toISOString(),
            data: payload
          })
        }).catch(err => console.error(`Webhook failed: ${err}`));
      }
    });
    
    await Promise.all(promises.filter(Boolean));
  } catch (err) {
    console.error('Error executing webhooks:', err);
  }
}

// ============================================
// 5. COMPOSITE OUTPUTS
// ============================================

/**
 * Ejemplo: Bloque contactForm que combina:
 * - Formulario (captura de datos)
 * - Validación (reglas)
 * - Eventos (form.submitted trigger)
 */
export const ContactFormBlock = {
  type: 'contactForm',
  label: 'Formulario de Contacto',
  
  // Outputs: qué datos define este bloque
  outputs: BlockOutputs.contactForm,
  
  // Formulario: estructura de campos
  form: createFormOutput('contact', [
    { id: 'name', name: 'nombre', label: 'Tu Nombre', fieldType: 'text', required: true, validation: { type: 'string', options: { minLength: 2 } } },
    { id: 'email', name: 'email', label: 'Tu Email', fieldType: 'email', required: true },
    { id: 'phone', name: 'teléfono', label: 'Teléfono (opcional)', fieldType: 'phone', required: false },
    { id: 'message', name: 'mensaje', label: 'Mensaje', fieldType: 'textarea', required: true, validation: { type: 'string', options: { minLength: 10 } } }
  ]),
  
  // Schema: configuración del bloque en el builder
  schema: {
    title: { type: 'string', required: true, label: 'Título' },
    description: { type: 'string', label: 'Descripción' },
    submitButtonText: { type: 'string', default: 'Enviar', label: 'Texto del botón' },
    successMessage: { type: 'string', default: '¡Gracias! Nos pondremos en contacto pronto.' },
    webhookUrl: { type: 'url', label: 'Webhook (opcional)' }
  },
  
  // Eventos: qué disparar al enviar
  events: ['form.submitted'],
  
  // Validaciones: reglas del bloque
  validation: {
    title: { type: 'string', required: true, options: { minLength: 1 } },
    submitButtonText: { type: 'string', options: { minLength: 1 } }
  }
};

// ============================================
// 6. OUTPUTS REGISTRY
// ============================================

/**
 * Catalogo centralizado de todos los outputs posibles
 * Usado por admin-builder para generar formularios
 */
export const OutputsRegistry = {
  validation: ValidationRules,
  formFields: FormFieldTypes,
  blockOutputs: BlockOutputs,
  eventTriggers: EventTriggers,
  blocks: {
    contactForm: ContactFormBlock
    // ... más bloques con outputs
  }
};

export default OutputsRegistry;
