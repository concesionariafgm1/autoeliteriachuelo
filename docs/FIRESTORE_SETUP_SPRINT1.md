# Guía: Crear Documentos de Páginas en Firestore (Sprint 1)

**Para:** Testers, desarrolladores que quieren validar Sprint 1

---

## Paso 1: Acceder a Firestore Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Firestore Database**
4. Selecciona la base de datos (`(default)`)

---

## Paso 2: Crear Documento HOME

### Navegación en Firestore:
1. Expande colección `clients`
2. Selecciona tu cliente (ej: `autoelite-concesionaria`)
3. Busca o crea colección: `pages`
4. Haz clic en **"Agregar documento"**
5. En el campo "ID de documento", escribe: `home`
6. En los campos del documento, copia-pega el JSON de abajo

### JSON para pages/home:

```json
{
  "id": "home",
  "slug": "home",
  "title": "Inicio - AutoElite",
  "status": "published",
  "sections": [
    {
      "id": "hero-1",
      "type": "hero",
      "props": {
        "title": "AutoElite - Vehículos de Calidad",
        "subtitle": "Las mejores opciones en vehículos premium",
        "bgImage": "",
        "cta": {
          "text": "Ver Catálogo",
          "link": "/catalogo"
        }
      }
    },
    {
      "id": "services-1",
      "type": "servicesGrid",
      "props": {
        "title": "Nuestros Servicios",
        "services": [
          {
            "id": "svc-1",
            "icon": "🔧",
            "title": "Financiación",
            "description": "Planes flexibles de pago"
          },
          {
            "id": "svc-2",
            "icon": "🛡️",
            "title": "Garantía",
            "description": "Garantía de fábrica incluida"
          },
          {
            "id": "svc-3",
            "icon": "🚗",
            "title": "Entrega Rápida",
            "description": "Disponible en 24 horas"
          }
        ]
      }
    },
    {
      "id": "listings-1",
      "type": "listingsGrid",
      "props": {
        "title": "Catálogo de Vehículos",
        "type": "vehicle",
        "columns": 3,
        "filters": {}
      }
    },
    {
      "id": "contact-1",
      "type": "contactForm",
      "props": {
        "title": "Contáctanos",
        "description": "Completa el formulario y nos comunicaremos pronto"
      }
    }
  ],
  "metadata": {
    "title": "AutoElite - Vehículos Premium",
    "description": "Los mejores vehículos de calidad a precios competitivos",
    "ogImage": ""
  },
  "createdAt": 1740153600000,
  "updatedAt": 1740153600000,
  "publishedAt": 1740153600000
}
```

**Nota:** En Firestore Console, puedes copiar el JSON como texto o agregarlo campo por campo. Si usas importación de JSON, usa la estructura de arriba.

---

## Paso 3: Crear Documento CATALOGO

Mismo proceso, pero con ID de documento: `catalogo`

### JSON para pages/catalogo:

```json
{
  "id": "catalogo",
  "slug": "catalogo",
  "title": "Catálogo Completo - AutoElite",
  "status": "published",
  "sections": [
    {
      "id": "hero-cat",
      "type": "hero",
      "props": {
        "title": "Nuestro Catálogo",
        "subtitle": "Todos nuestros vehículos disponibles",
        "bgImage": "",
        "cta": {
          "text": "Contactar",
          "link": "#contacto"
        }
      }
    },
    {
      "id": "listings-cat",
      "type": "listingsGrid",
      "props": {
        "title": "Todos los Vehículos",
        "type": "vehicle",
        "columns": 4,
        "filters": {}
      }
    }
  ],
  "metadata": {
    "title": "Catálogo Completo - AutoElite",
    "description": "Todos nuestros vehículos disponibles en una sola página",
    "ogImage": ""
  },
  "createdAt": 1740153600000,
  "updatedAt": 1740153600000,
  "publishedAt": 1740153600000
}
```

---

## Paso 4: Verificar Estructura

Después de crear ambos documentos, verifica:

```
clients/
  └── autoelite-concesionaria/
      └── pages/
          ├── home
          │   ├── id: "home"
          │   ├── slug: "home"
          │   ├── status: "published"
          │   ├── sections: [...]
          │   └── metadata: {...}
          └── catalogo
              ├── id: "catalogo"
              ├── slug: "catalogo"
              ├── status: "published"
              ├── sections: [...]
              └── metadata: {...}
```

---

## Paso 5: Probar en el Sitio

1. Abre tu navegador en `https://autoelite.com/` (o dominio local)
   - Deberías ver la página HOME con:
     - Hero banner con título
     - Grid de servicios (3 items)
     - Grid de vehículos (listingsGrid)
     - Formulario de contacto

2. Abre `https://autoelite.com/catalogo`
   - Deberías ver la página CATALOGO con:
     - Hero banner
     - Grid de vehículos (4 columnas)

3. Abre DevTools (F12) y busca en Console:
   - `[DataLayer] ✓ getPagePublished cache MISS (loaded):`
   - `[PageRouter] ✓ Meta tags applied`
   - Sin errores rojos

---

## Paso 6: Verificar Caché

1. Carga https://autoelite.com/ (primer load)
   - Verás: `cache MISS (loaded)`
2. Recarga (segunda carga)
   - Verás: `cache HIT`
3. Espera 5+ minutos, recarga
   - Verás de nuevo: `cache MISS` (TTL expiró)

---

## Alternativa: Importar vía Script

Si prefieres no hacerlo manualmente, puedes usar el script en `FIRESTORE_SEED.js`:

```bash
# Terminal Node.js
node admin-tools/assignAdminByEmail.js   # Primero setup admin
node FIRESTORE_SEED.js                   # Luego seed data
```

Pero eso está fuera del scope de Sprint 1. Usa el manual si tienes dudas.

---

## Troubleshooting

| Problema | Solución |
|----------|----------|
| Documento no aparece en Firestore | Verifica que estés en la BD `(default)` y colección `clients/{tuClienteId}/pages` |
| Página muestra "Página en construcción" | Significa que getPagePublished retornó null. Verifica que `status: "published"` en el documento |
| Bloques no renderizan | Abre DevTools → Console. Busca errores rojos. Verifica que el `type` bloque existe en blockRegistry.js |
| "Grid de Vehículos" vacío | Eso es normal en Sprint 1. El listingsGrid se cargará dinámicamente en Sprint 2 |

---

## Próximos Pasos

Después de validar que home y catalogo se renderizan:

1. **Sprint 2:** Implementar admin-builder (edición visual)
2. **Sprint 3:** Implementar dynamiclistingsGrid (cargar datos reales desde content/listings)

---

**Responsable:** Developer  
**Actualizado:** 21 de febrero de 2026
