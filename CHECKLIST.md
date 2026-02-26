# Checklist de Deploy (por cliente)

## 1) Branding / Config (config/site.js)
- [ ] clientId correcto
- [ ] pack correcto (vehicles | consulting)
- [ ] env.mode = prod (staging solo para pruebas)
- [ ] env.baseUrl = https://tudominio.com (sin barra final)
- [ ] logo + textos + links (WhatsApp/Instagram/Facebook)
- [ ] metaTitle / metaDescription correctos

## 2) Firebase
- [ ] assets/config/firebase-config.js cargado ANTES de scripts module
- [ ] Firestore rules deployadas (firestore.rules)
- [ ] Admin:
  - [ ] custom claims role=admin (recomendado) **o**
  - [ ] SITE.admin.allowedEmails completo (solo si no usás claims)

## 3) Formularios (no perder leads)
- [ ] Contacto funciona:
  - [ ] guarda en Firestore (clients/{clientId}/leads)
  - [ ] envía por FormSubmit (action del form)
  - [ ] fallback WhatsApp visible si falla
- [ ] Revisar spam: honeypot _honey activo

## 4) SEO / Indexación
- [ ] robots.txt OK
- [ ] sitemap.xml actualizado (reemplazar __BASE__)
- [ ] OpenGraph/Twitter: logo/ogImage OK
- [ ] En staging: noindex activo (env.mode = staging)

## 5) Cloudflare Pages
- [ ] _redirects ok (URLs sin .html)
- [ ] Probar en Preview + Dominio final:
  - [ ] /login
  - [ ] /admin
  - [ ] /vehiculos (si pack vehicles)
  - [ ] /contacto

## 6) Smoke test final
- [ ] Consola sin errores
- [ ] Mobile OK
- [ ] Links a WhatsApp/IG funcionan
