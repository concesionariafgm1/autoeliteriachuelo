import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Leer configuración desde window.__FIREBASE_CONFIG__ (definido en assets/config/firebase-config.js)
// En producción (Cloudflare Pages), este objeto debe estar disponible en el HTML antes de este script
const firebaseConfig = window.__FIREBASE_CONFIG__ || {
  apiKey: undefined,
  authDomain: undefined,
  projectId: undefined,
  messagingSenderId: undefined,
  appId: undefined
};

// Validar que la configuración esté disponible
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error(
    "[Firebase] Configuration missing. Make sure firebase-config.js is loaded BEFORE this module. " +
    "Check that window.__FIREBASE_CONFIG__ is defined."
  );
  throw new Error(
    "Firebase config not found. Ensure <script src=\"/assets/config/firebase-config.js\"></script> is in HTML."
  );
}

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

if (window.SITE && window.SITE.env && window.SITE.env.debug) {
  console.log("[Firebase] Initialized successfully with project:", firebaseConfig.projectId);
}

