# Conexiones (Cloudflare Pages + Firebase + Cloudinary)

Este proyecto está preparado para **Cloudflare Pages** (con Functions) y para conectar **Firebase** (Auth + Firestore) y **Cloudinary** (uploads firmados).

## 1) Firebase

### A. Crear / elegir proyecto
1. Firebase Console → crear proyecto.
2. Authentication → habilitar el/los proveedores que uses (Email/Password recomendado para admin).
3. Firestore Database → crear base.

### B. Crear Web App
Firebase Console → Project settings → **Your apps** → Add app → Web.

Copiá la **Web app config** y pegala en:
- `assets/config/firebase-config.js`

> Nota: este archivo es público. La seguridad real la dan **las reglas de Firestore** y la lógica de admin.

### C. Reglas de Firestore
El repo incluye `firestore.rules`.
- Subilas desde Firebase Console → Firestore → Rules

## 2) Cloudinary (uploads firmados)

El upload usa un endpoint server-side en Cloudflare Pages Functions:
- `functions/api/cloudinary-sign.js`

### Variables de entorno en Cloudflare Pages
En Cloudflare Pages → Settings → Environment variables (Production y/o Preview):
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`  ✅ (solo server-side, no exponer en frontend)

El frontend llama a:
- `POST /api/cloudinary-sign`

## 3) Cloudflare Pages

### Deploy
- Subí el repo a GitHub
- Cloudflare Pages → Create project → conectá el repo

Build:
- Si es sitio estático: **no build command** (o vacío)
- Output: `/` (root)

### Routes sin .html
Este proyecto funciona con URLs con `.html` para evitar problemas en servidores simples.
En Pages, los rewrites ya están listos con:
- `_redirects`

## 4) Checklist rápida antes de producción

- `config/site.js`:
  - `env.mode = 'prod'`
  - `env.baseUrl = 'https://tu-dominio.com'`
  - `clientId`, `pack`, `layout`
- `assets/config/firebase-config.js` completado
- Variables de entorno Cloudinary cargadas en Pages
- Firestore rules publicadas
- Probar:
  - Home → Nosotros → Contacto → Ubicación
  - Login admin + CRUD
