# Restricciones Arquitectónicas del Proyecto

**Fecha:** 21 de Febrero, 2026  
**Estado:** Documento Vinculante para Todos los Desarrollos

## 1. Stack Tecnológico: Vanilla JS/HTML

**Restricción:**
- ✅ Mantener vanilla JavaScript/HTML como stack base
- ❌ NO migrar a React, Vue, Next.js, Svelte, etc. sin justificación explícita
- ❌ NO introducir build tools complejos (webpack, vite, etc.)

**Razón:**
- Proyecto actual funciona sin dependencias pesadas
- Cloudflare Pages + Service Worker requieren bundle mínimo
- Reduce complejidad de deployment y mantenimiento

**Excepciones:**
- Librerías pequeñas (<50KB): `sortablejs` (drag-drop), `chart.js` (gráficos)
- Herramientas de build: Solo si el proyecto crece > 10K LOC
- Componentes: Solo librerias Web Components vanilla (sin framework)

---

## 2. Gestión de Dependencias: Cero Inflación

**Restricción:**
- ✅ Usar solo librerías que el proyecto YA usa (Firebase, ninguna más)
- ❌ NO añadir npm packages sin evaluación de impacto
- ❌ NO instalar dependencias CLI (salvo dev tools estrictamente necesarias)

**Dependencias Actuales Permitidas:**
- `firebase` - Ya en uso (Auth + Firestore)
- `wrangler` - Para Cloudflare Workers (dev)

**Evaluación antes de añadir:**
- [ ] ¿Resuelve un problema que vanilla JS no puede?
- [ ] ¿Es <50KB minificado?
- [ ] ¿Tiene soporte activo (commits en últimos 6 meses)?
- [ ] ¿Requiere build step?

---

## 3. Base de Datos: Firestore Exclusivamente

**Restricción:**
- ✅ Firestore como única fuente de verdad
- ❌ NO migrar a otras BDs (MongoDB, PostgreSQL, etc.)
- ❌ NO introducir caché centralizado (Redis, Memcached)

**Alcance de Firestore:**
- Datos de tenant (clientes, páginas, contenido)
- Configuración dinamica (presets, blocks)
- Audit logs (para compliance)
- Assets metadata (no files - usar Cloudinary/Storage)

**Optimizaciones Dentro de Firestore:**
- ✅ Indexación estratégica (para queries lentas)
- ✅ Data layer cache en cliente (actual: 5 min TTL)
- ✅ Denormalización selectiva (si query < 100ms)
- ❌ NO replicar a otra BD

**Archivos:**
- ✅ Usar Cloudinary para images (transformations + CDN)
- ✅ Usar Signed URLs para uploads seguros
- ❌ NO subir a Firestore Storage (es para backups, no para arquitectura)

---

## 4. Hosting: Cloudflare Pages (Sin Backend Tradicional)

**Restricción:**
- ✅ Cloudflare Pages para hosting estático
- ✅ Cloudflare Workers para serverless endpoints (si aplica)
- ❌ NO usar servidores Express/Node.js tradicionales
- ❌ NO usar serverless externo (AWS Lambda, Google Cloud Functions, etc.)

**Arquitetura Permitida:**
```
Cloudflare Pages (HTML/CSS/JS)
    ↓
Cloudflare Workers (serverless endpoints)
    ↓
Firestore + Cloudinary + Auth0/Firebase
```

**Casos de Uso para Workers:**
- Rate limiting (proteger Firestore)
- Image proxy (Cloudinary con token privado)
- Email triggers (sendgrid via webhook)
- Webhooks (Stripe, etc. → Firestore)
- NOT: Database queries (eso es client + Firestore)

**NO permitido:**
- ❌ Node.js tradicional (Heroku, Railway, etc.)
- ❌ Python backend (Django, FastAPI)
- ❌ .NET/Java monolitos
- ❌ Contenedores Docker en Kubernetes

---

## 5. Si se Requiere Backend: Cloudflare Workers Only

**Arquitectura Workers:**

```javascript
// wrangler.toml
[env.production]
routes = [
  { pattern = "api/*", zone_id = "..." }
]
```

**Patrón Permitido:**
```javascript
// Cloudflare Worker
export default {
  async fetch(request) {
    const url = new URL(request.url);
    
    if (url.pathname === '/api/send-email') {
      // Validate auth
      const auth = request.headers.get('Authorization');
      // Call third-party service
      await sendEmail(...);
      return new Response(JSON.stringify({ok: true}));
    }
  }
}
```

**Limitaciones Inherentes:**
- Timeout: 30 segundos (worker), 50 segundos (paid tier)
- Memory: 128MB
- Ejecución: Stateless (sin sesiones persistentes)

**Implicaciones para Diseño:**
- ✅ Queries cortas a Firestore (index optimizado)
- ✅ Transformaciones de datos ligeras
- ✅ Llamadas a servicios externos (rate limiting)
- ❌ Procesamiento pesado (ML, video encoding)
- ❌ Polling o background jobs largos

---

## 6. Matriz de Decisiones (Guía de Diseño)

| Necesidad | Solución | Razón |
|-----------|----------|-------|
| Autenticación | Firebase Auth | Ya en uso |
| Base de datos | Firestore | Ya en use |
| Images/Media | Cloudinary | CDN + transformaciones |
| Forms | Vanilla HTML + Firestore | Sin servidor |
| PDF generation | Worker → tercero (pdfkit) | Sin almacenaje |
| Email | Worker → Sendgrid/Resend | Webhook seguro |
| Analytics | Firestore + Cliente | Dashboard en admin |
| Rate limiting | Cloudflare Rules + Worker | Protege Firestore |
| Drag-drop UI | SortableJS (<50KB) | Vanilla compatible |
| Real-time sync | Firestore listeners | Arquitectura nativa |

---

## 7. Violaciones de Restricciones: Proceso

**Si se descubre que una restricción limita el proyecto:**

1. **Documentar el caso límite**
   ```markdown
   ### Caso: Necesitamos procesar X
   - Restricción actual: [cuál]
   - Por qué vanilla JS falla: [explicación técnica]
   - Solución propuesta: [alternativa]
   - Impacto: [tamaño, complejidad, dependency]
   ```

2. **Evaluación por equipo**
   - ¿Las restricciones son obsoletas?
   - ¿Hay alternativa vanilla?
   - ¿El impacto requiere cambio arquitectónico?

3. **Documentar decisión**
   - Si se aprueba → actualizar este documento
   - Si se rechaza → explorar alternativas
   - Nunca hacer excepciones no documentadas

---

## 8. Revisión de Restricciones

**Próxima revisión:** Agosto 2026 (post-Fase 3)

**Triggers para revisión anticipada:**
- Proyecto excede 20K LOC
- Proyecto requiere 5+ endpoints Workers
- Firestore costs > $500/mes
- Usuarios concurrentes > 1000/día
- Performance: P95 latency > 3 segundos

---

## 9. Checklist para PRs/Commits

Antes de mergear código nuevo, verificar:

- [ ] ¿Introduce nueva dependency? (si es sí, ¿evaluó punto 2?)
- [ ] ¿Accede a otra BD/servicio que no sea Firestore? (sí = violación)
- [ ] ¿Requiere Node.js backend? (sí → revisar Cloudflare Workers)
- [ ] ¿Usa framework JS que no sea vanilla? (sí = violación, excepto librerías <50KB)
- [ ] ¿El código compila en Cloudflare Pages sin build step? (no = problema)

---

## 10. Referencias

- **Firestore Rules:** `/docs/FIRESTORE_RULES.md`
- **Cloudflare Setup:** `wrangler.toml`
- **Data Layer:** `js/dataLayer.js` (patrón a seguir)
- **Architecture:** `/docs/ARCHITECTURE.md`

---

**Responsable de mantener este documento:** Tech Lead  
**Última actualización:** 21 de febrero de 2026
