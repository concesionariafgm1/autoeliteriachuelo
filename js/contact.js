import { db } from './firebase.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

function $(sel) { return document.querySelector(sel); }

function setStatus(el, type, msg) {
  if (!el) return;
  el.style.display = 'block';
  el.dataset.type = type;
  el.textContent = msg;
  el.classList.remove('ok','err','info');
  el.classList.add(type === 'ok' ? 'ok' : type === 'err' ? 'err' : 'info');
}

function buildWhatsappUrl() {
  const SITE = window.SITE || {};
  const wa = SITE.branding?.links?.whatsapp || {};
  const phone = String(wa.phoneE164 || '').replace(/\+/g,'');
  const text = encodeURIComponent(wa.defaultText || 'Hola!');
  return phone ? `https://wa.me/${phone}?text=${text}` : '';
}

async function saveLeadToFirestore({ clientId, nombre, email, mensaje, page }) {
  const ref = collection(db, `clients/${clientId}/leads`);
  return addDoc(ref, {
    nombre: nombre || '',
    email: email || '',
    mensaje: mensaje || '',
    page: page || window.location.pathname,
    userAgent: navigator.userAgent || '',
    createdAt: serverTimestamp()
  });
}

async function sendToFormSubmit(form) {
  const action = form.getAttribute('action');
  if (!action) return { ok: true };
  const data = new FormData(form);
  const res = await fetch(action, {
    method: form.getAttribute('method') || 'POST',
    headers: { 'Accept': 'application/json' },
    body: data
  });
  return { ok: res.ok };
}

function validate({ nombre, email, mensaje }) {
  if (!nombre || nombre.trim().length < 2) return 'Ingresá tu nombre.';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Ingresá un email válido.';
  if (!mensaje || mensaje.trim().length < 5) return 'Contanos tu consulta (mín. 5 caracteres).';
  return null;
}

async function onSubmit(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const status = $('#contactStatus');
  const honey = form.querySelector('input[name="_honey"]');
  if (honey && honey.value) {
    // bot
    return;
  }

  const clientId = window.SITE_CLIENT_ID || window.SITE?.clientId;
  if (!clientId) {
    setStatus(status, 'err', 'Configuración del sitio incompleta (clientId).');
    return;
  }

  const nombre = form.querySelector('[name="nombre"]')?.value || '';
  const email = form.querySelector('[name="email"]')?.value || '';
  const mensaje = form.querySelector('[name="mensaje"]')?.value || '';

  const err = validate({ nombre, email, mensaje });
  if (err) {
    setStatus(status, 'err', err);
    return;
  }

  setStatus(status, 'info', 'Enviando...');
  form.querySelector('button[type="submit"]')?.setAttribute('disabled','disabled');

  let firestoreOk = false;
  let emailOk = false;

  try {
    await saveLeadToFirestore({ clientId, nombre, email, mensaje, page: window.location.pathname });
    firestoreOk = true;
  } catch (ex) {
    if (window.SITE?.env?.debug) console.warn('[Contact] Firestore lead save failed:', ex);
  }

  try {
    const res = await sendToFormSubmit(form);
    emailOk = !!res.ok;
  } catch (ex) {
    if (window.SITE?.env?.debug) console.warn('[Contact] FormSubmit failed:', ex);
  }

  // UX final
  if (firestoreOk || emailOk) {
    setStatus(status, 'ok', '¡Listo! Recibimos tu mensaje. Te respondemos a la brevedad.');
    form.reset();
  } else {
    const waUrl = buildWhatsappUrl();
    if (waUrl) {
      setStatus(status, 'err', 'No pudimos enviar el formulario. Probá escribirnos por WhatsApp.');
      const wa = $('#contactWhatsAppFallback');
      if (wa) {
        wa.href = waUrl;
        wa.style.display = 'inline-flex';
      }
    } else {
      setStatus(status, 'err', 'No pudimos enviar el formulario. Intentá nuevamente en unos minutos.');
    }
  }

  form.querySelector('button[type="submit"]')?.removeAttribute('disabled');
}

function init() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  // UI containers (si no existen, los creamos debajo del form)
  let status = document.getElementById('contactStatus');
  if (!status) {
    status = document.createElement('div');
    status.id = 'contactStatus';
    status.style.display = 'none';
    status.style.marginTop = '12px';
    status.style.padding = '10px 12px';
    status.style.borderRadius = '10px';
    status.style.fontSize = '14px';
    status.style.lineHeight = '1.4';
    status.style.border = '1px solid rgba(255,255,255,0.12)';
    form.appendChild(status);
  }
  let wa = document.getElementById('contactWhatsAppFallback');
  if (!wa) {
    wa = document.createElement('a');
    wa.id = 'contactWhatsAppFallback';
    wa.href = '#';
    wa.target = '_blank';
    wa.rel = 'noopener';
    wa.textContent = 'Escribir por WhatsApp';
    wa.style.display = 'none';
    wa.style.marginTop = '10px';
    wa.style.alignItems = 'center';
    wa.style.gap = '8px';
    wa.style.padding = '10px 12px';
    wa.style.borderRadius = '10px';
    wa.style.textDecoration = 'none';
    wa.style.border = '1px solid rgba(255,255,255,0.12)';
    form.appendChild(wa);
  }

  // status theming (sin tocar CSS global)
  const style = document.createElement('style');
  style.textContent = `
    #contactStatus.ok { background: rgba(46, 204, 113, 0.12); }
    #contactStatus.err { background: rgba(231, 76, 60, 0.12); }
    #contactStatus.info { background: rgba(52, 152, 219, 0.12); }
  `;
  document.head.appendChild(style);

  form.addEventListener('submit', onSubmit);
}

document.addEventListener('DOMContentLoaded', init);
