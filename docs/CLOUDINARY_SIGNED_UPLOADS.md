# Cloudinary Signed Uploads - Setup

Este proyecto utiliza **Cloudinary Signed Uploads** para mayor seguridad. Los uploads no requieren exposición de credenciales en el frontend.

## ¿Por qué Signed Uploads?

- ❌ **Antes**: `upload_preset` público en JavaScript (visible en navegador)
- ✅ **Ahora**: Firma generada en servidor (segura, expira rápidamente)

## Configuración

### 1. Variables de Entorno en Cloudflare

Agregar en **Cloudflare Dashboard** o en `wrangler.toml`:

```toml
[env.production.vars]
CLOUDINARY_CLOUD_NAME = "dld69jrqg"
CLOUDINARY_API_KEY = "su_api_key_aqui"
CLOUDINARY_API_SECRET = "su_api_secret_aqui"
```

**⚠️ NO commitear `CLOUDINARY_API_SECRET` al repositorio**

### 2. Obtener Credenciales

1. Ir a [Cloudinary Dashboard](https://cloudinary.com/console/settings)
2. En **Account Settings**, copiar:
   - `Cloud Name`
   - `API Key`
   - `API Secret`

3. Setear en Cloudflare Pages:
   - Dashboard → Site → Settings → Environment variables
   - Agregar los 3 valores

### 3. Flujo de Signed Upload

```
Cliente (navegador)
  ↓ POST /api/cloudinary-sign
Servidor (Functions)
  ↓ genera firma SHA-1
Cliente
  ↓ POST a Cloudinary con firma + timestamp
Cloudinary
  ↓ valida firma
Resultado: secure_url
  ↓ guardado en Firestore
```

## Validación

La firma incluye:
- `api_key` de Cloudinary
- `timestamp` actual (válidad corta)
- `folder` seguro: `tenants/{clientId}/{folder}`
- `signature` SHA-1

**Sin firma válida = upload rechazado por Cloudinary**

## Carpetas de Almacenamiento

Todas las imágenes se guardan en:
```
tenants/{clientId}/vehicles/
```

Ejemplo:
```
tenants/autoelite/vehicles/abc123def456.jpg
```

## Troubleshooting

### Error: "CLOUDINARY_API_SECRET no configurado"
- Revisar que las env vars están en Cloudflare, no en `wrangler.toml` local

### Error: "No se pudo resolver el clientId"
- Asegurar que `CURRENT_CLIENT_ID` o `window.TENANT_CLIENT_ID` está configurado
- En admin: verificar que auth está ready
- En público: verificar que `resolveClientId()` funciona

### Error: "Fallo al subir la imagen a Cloudinary"
- Verificar credenciales en Cloudflare
- Revisar consola: qué error retorna Cloudinary

## Referencias

- [Cloudinary Signed Uploads](https://cloudinary.com/documentation/upload_images#authenticated_requests)
- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/)
