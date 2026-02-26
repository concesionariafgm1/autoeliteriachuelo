# Plantilla Single‑Client (Clonar + Layout modular)

Este proyecto quedó armado para **1 cliente = 1 web**, pero con una base que te permite:

- **Clonar un cliente** en minutos.
- **Reordenar / activar / desactivar secciones** (layout) sin tocar HTML.

---

## 0) Elegir rubro (pack)

En `config/site.js`:
- `pack: 'vehicles'` para concesionaria/catálogo
- `pack: 'consulting'` para consultora/servicios

Los packs agregan secciones opcionales. El layout define cuáles aparecen.

## 1) Dónde se configura TODO

Editás **solo**:

- `config/site.js`

Ahí cambiás:

- `SITE.clientId` (Firestore: `clients/{clientId}/...`)
- branding (nombre, logo, dirección, links)
- WhatsApp / redes
- `pages.home.layout` (orden de secciones)
- `sections.*` (texto y botones de cada sección)

---

## 2) Clonar un cliente (paso a paso)

1. Copiá el proyecto en una nueva carpeta.
2. Editá `config/site.js`:
   - `clientId`
   - `branding.name`
   - `branding.logo`
   - links (WhatsApp / Instagram)
   - textos
3. Deploy.

> Importante: el `clientId` debe coincidir con cómo guardás los datos en Firestore.

---

## 3) Reorganizar el layout (sin sufrir)

Abrí `config/site.js` y cambiá:

```js
pages: {
  home: {
    layout: ["hero", "seoLocal", "featuredVehicles", "values", "cta"]
  }
}
```

Ejemplos:

- Sacar una sección: borrala del array.
- Cambiar el orden: movela arriba/abajo.

---

## 4) Agregar una sección nueva

1. Creá el archivo en: `js/site/sections/miSeccion.js`
2. Registrala en: `js/site/registry.js`
3. Agregala al layout en: `config/site.js`

---

## 5) Cómo está armada la Home

`index.html` es un "shell" que renderiza todo por JS:

- Header: `js/site/sections/header.js`
- Secciones: `js/site/sections/*`
- Footer: `js/site/sections/footer.js`

Entrada:

- `js/site/main.js`

---

## 6) Nota sobre admin

Podés manejar admin de 2 formas:

- **Custom claims** (ideal): `role=admin`
- **Allowlist** rápido: agregá correos en `SITE.admin.allowedEmails`

