# Packs por rubro (Vehicles / Consulting)

Este proyecto está armado como **constructor por secciones**:
- Secciones **core**: comunes a todos los rubros.
- Secciones **pack**: específicas por rubro (autos, consultora, etc).

## Elegir pack
En `config/site.js`:

- `pack: 'vehicles'`  (concesionaria / catálogo)
- `pack: 'consulting'` (consultora / servicios)

## Reordenar el layout
En `config/site.js`:
- `pages.home.layout` es un array con el orden de secciones.

Ejemplo consultora:
```js
pack: 'consulting',
pages: { home: { layout: ['hero','servicesDetailed','caseStudies','industries','bookCall','cta'] } }
```

## Agregar un pack nuevo
1. Crear carpeta `js/site/packs/<tu-pack>/sections`
2. Crear `js/site/packs/<tu-pack>/register.js` que llame `registerSections({...})`
3. Extender `registerPack` en `js/site/registry.js` con el nuevo nombre.
