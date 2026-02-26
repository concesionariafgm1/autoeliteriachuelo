# 📦 Guía de Bloques - Cómo Agregar Nuevos Tipos de Secciones

## 🎯 Objetivo

Esta guía explica cómo agregar un nuevo tipo de bloque (ej: "testimonials", "priceTable", "customHTML") al renderer sin tocar el core.

---

## 🏗️ Anatomía de un Bloque

Un bloque tiene 4 partes:

```javascript
{
  // 1. REGISTRO
  type: "myBlock",
  label: "Mi Bloque",
  icon: "icon.svg",

  // 2. SCHEMA (validación)
  schema: {
    title: { type: "string", required: true, label: "Título" },
    bgColor: { type: "color", default: "#ffffff" },
    items: { type: "array", of: "object" }
  },

  // 3. RENDERER (renderizar a HTML)
  render: (props) => {
    // Validación defensiva
    // Escape HTML
    // Lazy-load si tiene imágenes
    return `<section>...</section>`;
  },

  // 4. ADMIN INSPECTOR (formulario GUI)
  formFields: [
    { name: "title", type: "text", label: "Título", required: true },
    { name: "bgColor", type: "color", label: "Color de fondo" },
    { name: "items", type: "array", of: { type: "object", fields: [...] } }
  ]
}
```

---

## 📋 Paso a Paso: Agregar un Bloque

### Ejemplo: Bloque "PriceTable"

Un bloque que muestra tabla de precios con planes (Starter, Pro, Enterprise).

#### **1. Agregar a Registry** (`js/blockRegistry.js`)

```javascript
// En archivo NUEVO: js/blockRegistry.js
export const BLOCK_REGISTRY = {
  // ... bloques existentes ...

  priceTable: {
    // Metadata para el admin
    label: "Tabla de Precios",
    icon: "price-table.svg",
    description: "Mostrar planes con precios comparativos",
    category: "ecommerce",
    
    // Schema: describe propiedades esperadas
    schema: {
      title: {
        type: "string",
        required: true,
        label: "Título",
        default: "Planes"
      },
      subtitle: {
        type: "string",
        label: "Subtítulo (opcional)"
      },
      columns: {
        type: "number",
        default: 3,
        min: 1,
        max: 4,
        label: "Número de columnas"
      },
      plans: {
        type: "array",
        label: "Planes",
        itemsSchema: {
          name: { type: "string", required: true, label: "Nombre del plan" },
          price: { type: "string", required: true, label: "Precio" },
          features: { type: "array", of: "string", label: "Características" },
          cta: {
            type: "object",
            label: "Botón CTA",
            properties: {
              text: { type: "string", label: "Texto" },
              link: { type: "string", label: "URL" }
            }
          },
          highlighted: { type: "boolean", default: false, label: "Destacar" }
        }
      }
    },

    // Renderer: HTML output
    render: (props = {}) => {
      try {
        const {
          title = "Planes",
          subtitle = "",
          columns = 3,
          plans = []
        } = props;

        // Validación defensiva
        if (!Array.isArray(plans) || plans.length === 0) {
          return errorFallback("No hay planes configurados");
        }

        // Escape HTML para seguridad
        const titleHtml = escapeHtml(title);
        const subtitleHtml = subtitle ? escapeHtml(subtitle) : "";

        // Construir tabla
        let plansHtml = plans.map((plan, idx) => {
          const name = escapeHtml(plan.name || "Plan");
          const price = escapeHtml(plan.price || "$0");
          const highlighted = plan.highlighted ? "highlighted" : "";
          
          const features = Array.isArray(plan.features)
            ? plan.features.map(f => `<li>${escapeHtml(f)}</li>`).join("")
            : "";

          let ctaHtml = "";
          if (plan.cta && plan.cta.text && plan.cta.link) {
            ctaHtml = `
              <a href="${escapeHtml(plan.cta.link)}" class="btn btn-primary">
                ${escapeHtml(plan.cta.text)}
              </a>
            `;
          }

          return `
            <div class="price-card ${highlighted}" style="flex: 1; min-width: 200px; border: 1px solid #ddd; border-radius: 8px; padding: 20px; text-align: center;">
              <h3 style="margin-bottom: 10px;">${name}</h3>
              <div class="price" style="font-size: 2rem; font-weight: bold; margin: 15px 0;">${price}</div>
              <ul style="list-style: none; padding: 0; margin: 20px 0; text-align: left;">
                ${features}
              </ul>
              ${ctaHtml}
            </div>
          `;
        }).join("");

        return `
          <section class="section-price-table" style="padding: 60px 20px; background: #f9f9f9;">
            <div class="container" style="max-width: 1200px; margin: 0 auto;">
              <h2 style="text-align: center; margin-bottom: 10px;">${titleHtml}</h2>
              ${subtitleHtml ? `<p style="text-align: center; color: #666; margin-bottom: 40px;">${subtitleHtml}</p>` : ""}
              
              <div style="display: flex; gap: 20px; flex-wrap: wrap; justify-content: center;">
                ${plansHtml}
              </div>
            </div>
          </section>
        `;

      } catch (err) {
        return errorFallback(`renderPriceTable: ${err.message}`);
      }
    }
  },

  // ... más bloques
};

// Helpers compartidos
function escapeHtml(text) {
  if (!text) return "";
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function errorFallback(message) {
  return `<div style="padding: 20px; background: #fee; color: #c33; border: 1px solid #f99; border-radius: 4px;">⚠️ ${message}</div>`;
}
```

#### **2. Actualizar Renderer**

En `js/sectionRenderer.js`, cambiar para usar registry:

```javascript
import { BLOCK_REGISTRY } from "./blockRegistry.js";

export function renderSection(section, clientId) {
  if (!section || !section.type) return errorFallback("Section sin type");

  const block = BLOCK_REGISTRY[section.type];
  if (!block) {
    return errorFallback(`Tipo de bloque desconocido: ${section.type}`);
  }

  // Ejecutar renderer del bloque
  return block.render(section.props || {});
}

export function getSectionSchema(type) {
  const block = BLOCK_REGISTRY[type];
  return block ? block.schema : null;
}

export function getAvailableBlocks() {
  return Object.entries(BLOCK_REGISTRY).map(([type, block]) => ({
    type,
    label: block.label,
    icon: block.icon,
    description: block.description,
    category: block.category
  }));
}
```

#### **3. Admin Form Generator** (`js/formBuilder.js`)

El admin usa el schema para generar form:

```javascript
import { BLOCK_REGISTRY } from "./blockRegistry.js";

export function generateFormForBlock(blockType, initialProps = {}) {
  const block = BLOCK_REGISTRY[blockType];
  if (!block) return null;

  const schema = block.schema;
  const form = document.createElement("form");

  Object.entries(schema).forEach(([fieldName, fieldSchema]) => {
    const fieldGroup = createFormField(fieldName, fieldSchema, initialProps[fieldName]);
    form.appendChild(fieldGroup);
  });

  return form;
}

function createFormField(name, schema, value = null) {
  const group = document.createElement("div");
  group.className = "form-group";

  const label = document.createElement("label");
  label.textContent = schema.label || name;
  group.appendChild(label);

  let input;
  switch (schema.type) {
    case "string":
      input = document.createElement("input");
      input.type = "text";
      input.name = name;
      input.value = value || schema.default || "";
      if (schema.required) input.required = true;
      break;

    case "number":
      input = document.createElement("input");
      input.type = "number";
      input.name = name;
      input.value = value ?? schema.default ?? 0;
      if (schema.min !== undefined) input.min = schema.min;
      if (schema.max !== undefined) input.max = schema.max;
      break;

    case "color":
      input = document.createElement("input");
      input.type = "color";
      input.name = name;
      input.value = value || schema.default || "#ffffff";
      break;

    case "boolean":
      input = document.createElement("input");
      input.type = "checkbox";
      input.name = name;
      input.checked = value || schema.default || false;
      break;

    case "array":
      // Para arrays complejos, renderizar tabla editable o JSON
      input = createArrayField(name, schema, value);
      break;

    // ... más tipos
  }

  if (input) group.appendChild(input);
  return group;
}

function createArrayField(name, schema, value = []) {
  const container = document.createElement("div");
  container.className = "array-field";

  const table = document.createElement("table");
  table.innerHTML = `
    <thead>
      <tr>
        ${Object.keys(schema.itemsSchema).map(k => `<th>${k}</th>`).join("")}
        <th>Acciones</th>
      </tr>
    </thead>
    <tbody id="${name}-rows">
    </tbody>
  </table>

  const tbody = table.querySelector(`#${name}-rows`);
  
  (value || []).forEach((item, idx) => {
    const row = createArrayRow(item, schema.itemsSchema, name, idx);
    tbody.appendChild(row);
  });

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.textContent = `+ Agregar`;
  addBtn.onclick = () => {
    const newRow = createArrayRow({}, schema.itemsSchema, name, tbody.children.length);
    tbody.appendChild(newRow);
  };

  container.appendChild(table);
  container.appendChild(addBtn);
  return container;
}

function createArrayRow(item, itemSchema, arrayName, idx) {
  const tr = document.createElement("tr");
  
  Object.entries(itemSchema).forEach(([fieldName, fieldSchema]) => {
    const td = document.createElement("td");
    const input = document.createElement("input");
    input.type = "text";
    input.name = `${arrayName}[${idx}].${fieldName}`;
    input.value = item[fieldName] || "";
    td.appendChild(input);
    tr.appendChild(td);
  });

  const actionTd = document.createElement("td");
  const delBtn = document.createElement("button");
  delBtn.type = "button";
  delBtn.textContent = "✕";
  delBtn.onclick = () => tr.remove();
  actionTd.appendChild(delBtn);
  tr.appendChild(actionTd);

  return tr;
}
```

#### **4. Admin UI Integration**

En `admin-builder.html`, selector de bloques:

```html
<select id="blockTypeSelect" onchange="addBlockOfType()">
  <option value="">-- Seleccionar tipo --</option>
  <option value="hero">Hero Banner</option>
  <option value="richText">Texto Rico</option>
  <option value="priceTable">Tabla de Precios</option>
  <!-- ... más bloques -->
</select>

<script type="module">
  import { getAvailableBlocks } from "./js/blockRegistry.js";
  
  const blocks = getAvailableBlocks();
  const select = document.querySelector('#blockTypeSelect');
  
  blocks.forEach(block => {
    const opt = document.createElement('option');
    opt.value = block.type;
    opt.textContent = block.label;
    select.appendChild(opt);
  });
</script>
```

---

## 📝 Estructura Mínima de un Bloque

```javascript
{
  // Requerido
  label: "Nombre del Bloque",
  schema: { /* propiedades esperadas */ },
  render: (props) => { /* HTML output */ },

  // Opcional
  icon: "icon.svg",
  description: "Descripción breve",
  category: "layout|content|ecommerce|etc",
  defaults: { /* valores por defecto */ }
}
```

---

## 🎨 Bloques Base Incluidos

| Tipo | Uso | Props |
|------|-----|-------|
| `hero` | Banner principal | title, subtitle, bgImage, cta |
| `richText` | Párrafos/HTML | html, alignment |
| `servicesGrid` | Grid de 3 servicios | items[], columns |
| `testimonials` | Testimonios con fotos | items[], columns |
| `gallery` | Galería de imágenes | images[], columns, lightbox |
| `faq` | Preguntas frecuentes | items[] |
| `contactForm` | Formulario de contacto | fields[], submitAction |
| `hours` | Horarios de atención | days[] |
| `callToAction` | Botón destacado | text, link, bgColor |
| `map` | Google Maps embed | lat, lng, zoom |
| `socialLinks` | Links redes sociales | items[] |
| `listingsGrid` | Grid dinámico de items | type, columns, filters |
| `banner` | Banner simple | bgColor, text |

---

## 🔒 Validación & Seguridad

### Reglas de Oro

1. **Siempre escape HTML** si sale de datos de usuario
   ```javascript
   escapeHtml(userInput) // ✓
   ```

2. **Valida schema antes de renderizar**
   ```javascript
   if (!Array.isArray(items)) return errorFallback("Items debe ser array");
   ```

3. **Usa defaults defensivos**
   ```javascript
   const { title = "Sin título" } = props;
   ```

4. **Maneja errores try-catch**
   ```javascript
   try { 
     return renderHtml(...);
   } catch (err) {
     return errorFallback(err.message);
   }
   ```

5. **Lazy-load imágenes**
   ```html
   <img src="..." loading="lazy" alt="...">
   ```

---

## 🧪 Testing de Bloques

### En `test-blocks.html`

```html
<section id="test-priceTable">
  <h3>Test: priceTable</h3>
  <div id="output"></div>
  <script type="module">
    import { renderSection } from "./js/sectionRenderer.js";
    
    const section = {
      type: "priceTable",
      props: {
        title: "Nuestros Planes",
        plans: [
          { name: "Starter", price: "$99", features: ["Feature 1"] },
          { name: "Pro", price: "$199", features: ["Feature 1", "Feature 2"] }
        ]
      }
    };
    
    document.querySelector('#output').innerHTML = renderSection(section);
  </script>
</section>
```

---

## 📚 Ejemplo Completo: "CountdownTimer"

Un bloque que muestra cuenta regresiva:

```javascript
// En blockRegistry.js
countdownTimer: {
  label: "Cuenta Regresiva",
  description: "Mostrar temporizador hasta una fecha",
  category: "content",
  
  schema: {
    title: { type: "string", label: "Título" },
    targetDate: { type: "string", required: true, label: "Fecha destino (ISO)" },
    message: { type: "string", label: "Mensaje" }
  },

  render: (props = {}) => {
    try {
      const { title = "", targetDate, message = "" } = props;

      if (!targetDate) {
        return errorFallback("targetDate es requerida");
      }

      const timestamp = new Date(targetDate).getTime();
      if (isNaN(timestamp)) {
        return errorFallback("Formato de fecha inválido");
      }

      const countdownId = `countdown-${Math.random().toString(36).slice(2, 9)}`;

      return `
        <section class="section-countdown" style="padding: 40px 20px; text-align: center; background: #f0f0f0;">
          <div class="container" style="max-width: 600px; margin: 0 auto;">
            ${title ? `<h2>${escapeHtml(title)}</h2>` : ""}
            ${message ? `<p>${escapeHtml(message)}</p>` : ""}
            
            <div id="${countdownId}" class="countdown" style="font-size: 2rem; font-weight: bold; margin: 20px 0;">
              <!-- Se carga con JS -->
            </div>
          </div>
        </section>

        <script>
          (function() {
            const el = document.querySelector('#${countdownId}');
            const targetTime = ${timestamp};

            function update() {
              const now = Date.now();
              const diff = targetTime - now;

              if (diff <= 0) {
                el.textContent = "¡Tiempo terminado!";
                return;
              }

              const days = Math.floor(diff / (1000 * 60 * 60 * 24));
              const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
              const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
              const secs = Math.floor((diff % (1000 * 60)) / 1000);

              el.textContent = \`\${days}d : \${hours}h : \${mins}m : \${secs}s\`;
            }

            update();
            setInterval(update, 1000);
          })();
        </script>
      `;
    } catch (err) {
      return errorFallback(\`renderCountdown: \${err.message}\`);
    }
  }
}
```

---

## ✅ Checklist para Agregar un Bloque

- [ ] Crear entrada en `blockRegistry.js`
- [ ] Definir `schema` con validación
- [ ] Implementar `render()` con try-catch
- [ ] Escape HTML en todo output
- [ ] Validar arrays/objects defensivamente
- [ ] Lazy-load imágenes si aplica
- [ ] Agregar test en `test-blocks.html`
- [ ] Documentar en `BLOCK_GUIDE.md`
- [ ] Actualizar selector en admin UI

---

**¿Necesitas agregar un bloque? Copia el template arriba y cámbialo a tu necesidad.**
