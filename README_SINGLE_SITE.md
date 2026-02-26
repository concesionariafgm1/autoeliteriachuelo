# Single-site template (1 cliente = 1 web)

Este proyecto fue simplificado para **NO usar multi-tenant por dominio**.

## Lo más importante

1. **ClientId fijo**: editá `config/site.js`
   - `window.SITE_CLIENT_ID = "autoelite";`
2. **Branding/textos**: editá `config/config.js`
3. **Firebase**: se carga desde `assets/config/firebase-config.js`
   - Este script **debe estar incluido en el HTML antes** de cualquier módulo que importe `js/firebase.js`.
4. **Cloudinary firmado**: endpoint `functions/api/cloudinary-sign.js`
   - Usa variables de entorno (no hay secretos hardcodeados).

## Admin

El admin usa Firebase Auth.

### Opción A (recomendada): custom claims

- `role = "admin"`
- `clientId = "autoelite"`

### Opción B (fallback rápido): allowlist por email

En `config/site.js`:

```js
window.SITE_ADMIN_EMAILS = ["tuemail@dominio.com"];
```

## Colecciones Firestore

- Vehículos: `clients/{SITE_CLIENT_ID}/vehicles`
- Settings públicos (opcional, editable desde admin): `clients/{SITE_CLIENT_ID}/settings/public`

## Checklist antes de clonar para otro cliente

- Cambiar `SITE_CLIENT_ID`
- Cambiar branding en `config/config.js`
- Cargar logo en `assets/logo/`
- (Opcional) seed de vehículos / datos demo
