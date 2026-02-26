/* ============================================
   VEHICLES.JS - Gestión de vehículos y CRUD
   Maneja Firestore, carga inicial, filtros
   ============================================ */

import { db } from "./firebase.js";
import { collection, getDocs, addDoc, doc, setDoc, deleteDoc, onSnapshot, writeBatch, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { app } from "./firebase.js";

const auth = getAuth(app);

/* ============================================
   CLOUDINARY UPLOAD FUNCTION
   ============================================ */

/* Validar tamaño máximo de imagen (5MB) */
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB en bytes
const MAX_IMAGES_PER_VEHICLE = 10;

async function uploadToCloudinary(file) {
  // Validar tamaño
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(`La imagen supera 5MB. Tamaño: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  }

  // Obtener clientId
  const clientId = CURRENT_CLIENT_ID || window.TENANT_CLIENT_ID;
  if (!clientId) {
    throw new Error('No se pudo resolver el clientId para la firma de upload');
  }

  try {
    // Paso 1: Obtener firma del servidor
    const signRes = await fetch('/api/cloudinary-sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: clientId,
        folder: 'vehicles'
      })
    });

    if (!signRes.ok) {
      const error = await signRes.text();
      console.error('Error obteniendo firma:', error);
      throw new Error('No se pudo obtener la firma del servidor');
    }

    const signData = await signRes.json();
    const { cloudName, apiKey, timestamp, folder, signature } = signData;

    // Paso 2: Subir archivo con firma
    const form = new FormData();
    form.append('file', file);
    form.append('api_key', apiKey);
    form.append('timestamp', timestamp);
    form.append('signature', signature);
    form.append('folder', folder);

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: form
      }
    );

    if (!uploadRes.ok) {
      const error = await uploadRes.text();
      console.error('Error en upload de Cloudinary:', error);
      throw new Error('Fallo al subir la imagen a Cloudinary');
    }

    const uploadData = await uploadRes.json();
    return uploadData.secure_url;
  } catch (error) {
    console.error('Error en uploadToCloudinary:', error);
    throw error;
  }
}

/* Verificar si una URL es de Cloudinary */
function isCloudinaryUrl(url) {
  if (!url) return false;
  return url.includes('cloudinary.com') || url.includes('res.cloudinary.com');
}

/* Generar URL transformada para Cloudinary (cards) */
function getCloudinaryCardUrl(url) {
  if (!isCloudinaryUrl(url)) return url;
  // Insertar transformación antes de /upload/
  return url.replace(
    '/upload/',
    '/upload/w_600,f_auto,q_auto,c_fill,g_auto/'
  );
}

/* Generar URL transformada para Cloudinary (detalle) */
function getCloudinaryDetailUrl(url) {
  if (!isCloudinaryUrl(url)) return url;
  // Insertar transformación antes de /upload/
  return url.replace(
    '/upload/',
    '/upload/w_1200,f_auto,q_auto,c_limit/'
  );
}

/* ============================================
   DATA NORMALIZATION FUNCTION
   ============================================ */
// NORMALIZADOR CENTRAL
function normalizeVehicleData(v) {
  if (!v) return {};

  const images = [];

  // Compatibilidad vieja
  if (v.imageUrl) images.push(v.imageUrl);

  // Compatibilidad nueva
  if (Array.isArray(v.images)) {
    v.images.forEach(img => {
      if (img) images.push(img);
    });
  }

  return {
    id: v.id || "",
    brand: v.brand || v.marca || "",
    model: v.model || v.modelo || "",
    year: v.year || v.año || "",
    km: Number(v.km || v.kilometraje || 0),
    price: Number(v.price || v.precio || 0),
    engine: v.engine || v.motor || "",
    transmission: v.transmission || v.transmision || "",
    fuel: v.fuel || v.combustible || "",
    estado: v.estado || "",

    images,
    mainImage: images[0] || ""
  };
}

// HACERLA GLOBAL
window.normalizeVehicleData = normalizeVehicleData;


/* ============================================
   SAVE NORMALIZATION FUNCTION
   ============================================ */
function normalizeForSave(vehicleData) {
  const normalized = {
    brand: String(vehicleData.marca || vehicleData.brand || "").trim(),
    model: String(vehicleData.modelo || vehicleData.model || "").trim(),
    year: Number(vehicleData.año || vehicleData.year || 0),
    km: Number(vehicleData.kilometraje || vehicleData.km || 0),
    price: Number(vehicleData.precio || vehicleData.price || 0),
    engine: String(vehicleData.motor || vehicleData.engine || "").trim(),
    fuel: String(vehicleData.combustible || vehicleData.fuel || "").trim(),
    transmission: String(vehicleData.transmision || vehicleData.transmission || "").trim(),
    estado: String(vehicleData.estado || "").trim(),
    images: Array.isArray(vehicleData.images) ? vehicleData.images : [],
    mainImage: ""
  };
  
  // Set mainImage to first image if available
  if (normalized.images.length > 0) {
    normalized.mainImage = normalized.images[0];
  }
  
  console.log("SAVE:", normalized);
  return normalized;
}

/* ============================================
   SAFE VALUE HELPER
   ============================================ */
let CURRENT_CLIENT_ID = null;

const safe = v => v || "";

/* ============================================
   TENANT INITIALIZATION - Public vs Admin
   ============================================ */

// Detectar si estamos en admin.html
const isAdminPage = window.location.pathname.includes('admin.html') || 
                   (document.querySelector('[data-admin-page]') !== null);

if (isAdminPage) {
  console.log("[Vehicles] Admin page detected. Using auth with admin claims.");
  
  // Importar e inicializar auth listener para admin
  import('./auth.js').then(({ initAuthListener }) => {
    initAuthListener({
      requireAdmin: true,
      onUnauthorized: function() {
        console.warn("[Vehicles] Admin unauthorized. Redirecting to login.");
        window.location.href = 'login.html';
      },
      onReady: function(authState) {
        if (authState.currentUser) {
          CURRENT_CLIENT_ID = authState.clientId || window.SITE_CLIENT_ID || null;
          if (CURRENT_CLIENT_ID) {
            console.log("[Vehicles] Admin ready with clientId:", CURRENT_CLIENT_ID);
            fetchVehiclesFromFirestore(CURRENT_CLIENT_ID);
          } else {
            console.error("[Vehicles] No clientId available. Set window.SITE_CLIENT_ID in /config/site.js");
          }
        }
      }
    });
  }).catch(err => console.error("[Vehicles] Error importing auth.js:", err));
} else {
  console.log("[Vehicles] Public page detected. Using single-site clientId.");
  
  // En página pública: resolver clientId por dominio y no requiere login
  (async function initPublicTenant() {
    try {
      const clientId = window.SITE_CLIENT_ID || (typeof window.resolveClientId === 'function' ? await window.resolveClientId() : null);
      if (!clientId) {
        console.warn("[Vehicles] No SITE_CLIENT_ID configured. Vehicles will not load.");
        return;
      }
      CURRENT_CLIENT_ID = clientId;
      console.log("[Vehicles] ClientId:", CURRENT_CLIENT_ID);
      fetchVehiclesFromFirestore(CURRENT_CLIENT_ID);
    } catch (error) {
      console.error("[Vehicles] Error initializing public tenant:", error);
    }
  })();
}




async function seedDemoVehiclesIfEmpty() {
  if (!CURRENT_CLIENT_ID) {
    console.warn('[Vehicles] seedDemoVehiclesIfEmpty: CURRENT_CLIENT_ID not set');
    return false;
  }

  try {
    const snapshot = await getDocs(collection(db, 'clients', CURRENT_CLIENT_ID, 'vehicles'));
    if (!snapshot.empty) return false;

    const demoVehicles = [
      {
        brand: 'Fiat',
        model: 'Cronos',
        year: 2022,
        price: 9800000,
        images: ['assets/images/placeholder.jpg'],
        estado: '0km',
        km: 0,
        engine: '1.3',
        transmission: 'Manual',
        fuel: 'Nafta'
      },
      {
        brand: 'Volkswagen',
        model: 'Golf',
        year: 2019,
        price: 13500000,
        images: ['assets/images/placeholder.jpg'],
        estado: 'Usado',
        km: 42000,
        engine: '1.4 TSI',
        transmission: 'Automática',
        fuel: 'Nafta'
      },
      {
        brand: 'Toyota',
        model: 'Corolla',
        year: 2021,
        price: 16200000,
        images: ['assets/images/placeholder.jpg'],
        estado: 'Usado',
        km: 28000,
        engine: '2.0',
        transmission: 'Automática',
        fuel: 'Nafta'
      }
    ];

    for (let i = 0; i < demoVehicles.length; i++) {
      await addDoc(collection(db, 'clients', CURRENT_CLIENT_ID, 'vehicles'), demoVehicles[i]);
    }

    return true;
  } catch (e) {
    console.error(e);
    alert(e.message);
    return false;
  }
}


/* Generar imagen SVG placeholder para vehículos */
function generateCarSVG(color, label) {
  var bgColor, accentColor;
  switch(color) {
    case 'Azul':  bgColor = '#1a3a5c'; accentColor = '#2980b9'; break;
    case 'Rojo':  bgColor = '#5c1a1a'; accentColor = '#e74c3c'; break;
    case 'Gris':  bgColor = '#3a3a3a'; accentColor = '#7f8c8d'; break;
    default:      bgColor = '#2c2c2c'; accentColor = '#888888'; break;
  }
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">'
    + '<defs><linearGradient id="bg_' + color + '" x1="0%" y1="0%" x2="100%" y2="100%">'
    + '<stop offset="0%" style="stop-color:' + bgColor + '"/>'
    + '<stop offset="100%" style="stop-color:#0a0a0a"/>'
    + '</linearGradient></defs>'
    + '<rect width="800" height="500" fill="url(#bg_' + color + ')"/>'
    + '<g transform="translate(400,220)">'
    + '<ellipse cx="0" cy="80" rx="200" ry="15" fill="rgba(0,0,0,0.3)"/>'
    + '<path d="M-180,40 L-160,-10 L-100,-60 L-30,-75 L80,-75 L140,-50 L180,-10 L190,40 Z" fill="' + accentColor + '" opacity="0.9"/>'
    + '<path d="M-100,-55 L-70,-70 L30,-70 L80,-55 Z" fill="rgba(255,255,255,0.15)"/>'
    + '<rect x="-95" y="-52" width="70" height="35" rx="3" fill="rgba(150,220,255,0.25)"/>'
    + '<rect x="0" y="-52" width="75" height="35" rx="3" fill="rgba(150,220,255,0.25)"/>'
    + '<circle cx="-110" cy="45" r="30" fill="#1a1a1a" stroke="#333" stroke-width="4"/>'
    + '<circle cx="-110" cy="45" r="15" fill="#444"/>'
    + '<circle cx="130" cy="45" r="30" fill="#1a1a1a" stroke="#333" stroke-width="4"/>'
    + '<circle cx="130" cy="45" r="15" fill="#444"/>'
    + '<rect x="155" y="-5" width="30" height="15" rx="4" fill="rgba(255,200,50,0.7)"/>'
    + '<rect x="-175" y="-5" width="25" height="12" rx="4" fill="rgba(255,50,50,0.7)"/>'
    + '</g>'
    + '<text x="400" y="380" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" font-weight="bold" fill="rgba(255,255,255,0.6)" letter-spacing="4">' + label + '</text>'
    + '<text x="400" y="415" text-anchor="middle" font-family="Arial,sans-serif" font-size="14" fill="rgba(255,255,255,0.25)" letter-spacing="6">AUTOELITE</text>'
    + '</svg>';
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

/* Vehículos precargados (primera carga) */
const DEFAULT_VEHICLES = [
  {
    id: 'v1',
    brand: 'Chevrolet',
    model: 'Onix',
    year: 2023,
    km: 15000,
    price: 18500000,
    estado: 'Usado',
    engine: '1.2L Turbo',
    transmission: 'Manual',
    fuel: 'Nafta',
    images: [generateCarSVG('Azul', 'TOYOTA YARIS AZUL')],
    color: 'Azul'
  },
  {
    id: 'v2',
    brand: 'Chevrolet',
    model: 'Onix',
    year: 2024,
    km: 0,
    price: 22000000,
    estado: '0km',
    engine: '1.2L Turbo',
    transmission: 'Automática',
    fuel: 'Nafta',
    images: [generateCarSVG('Rojo', 'CHEVROLET ONIX ROJO')],
    color: 'Rojo'
  },
  {
    id: 'v3',
    brand: 'Fiat',
    model: 'Cronos',
    year: 2023,
    km: 28000,
    price: 16800000,
    estado: 'Usado',
    engine: '1.3L',
    transmission: 'Manual',
    fuel: 'Nafta',
    images: [generateCarSVG('Gris', 'FIAT CRONOS GRIS')],
    color: 'Gris'
  }
];

/* ============================================
   FUNCIONES CRUD
   ============================================ */


let vehicleListeners = [];
let unsubscribeSnapshot = null;

function onVehiclesChange(callback) {
  if (typeof callback === 'function') {
    vehicleListeners.push(callback);
  }
}

function notifyListeners(vehicles) {
  vehicleListeners.forEach(function(cb) {
    try { cb(vehicles); } catch (e) { console.warn('Listener error:', e); }
  });
}

/* ============================================
   VALIDATION FUNCTIONS
   ============================================ */
function validateVehicle(payload) {
  const errors = [];
  const currentYear = new Date().getFullYear();

  // Validar marca
  if (!payload.brand || typeof payload.brand !== 'string' || payload.brand.trim() === '') {
    errors.push('Marca es requerida');
  }

  // Validar modelo
  if (!payload.model || typeof payload.model !== 'string' || payload.model.trim() === '') {
    errors.push('Modelo es requerido');
  }

  // Validar año (si existe)
  if (payload.year) {
    const year = Number(payload.year);
    if (isNaN(year) || year < 1950 || year > currentYear + 1) {
      errors.push(`Año debe estar entre 1950 y ${currentYear + 1}`);
    }
  }

  // Validar precio
  if (payload.price !== undefined && payload.price !== null && payload.price !== '') {
    const price = Number(payload.price);
    if (isNaN(price) || price < 0) {
      errors.push('Precio debe ser un número ≥ 0');
    }
  }

  // Validar imágenes: al menos una imagen
  if (!payload.images || !Array.isArray(payload.images) || payload.images.length === 0) {
    errors.push('Se requiere al menos una imagen (foto)');
  }

  return {
    ok: errors.length === 0,
    errors: errors
  };
}

/* Mostrar errores en el formulario admin */
function renderAdminError(errors) {
  const errorsContainer = document.getElementById('adminFormErrors');
  const errorsList = document.getElementById('adminErrorsList');
  
  if (!errorsContainer || !errorsList) {
    console.warn('[Vehicles] Admin error elements not found');
    return;
  }

  if (!errors || errors.length === 0) {
    errorsContainer.style.display = 'none';
    errorsList.innerHTML = '';
    return;
  }

  errorsContainer.style.display = 'block';
  errorsList.innerHTML = errors.map(err => `<li>${err}</li>`).join('');
  
  // Scroll a los errores
  errorsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* Limpiar errores de validación */
function clearAdminErrors() {
  renderAdminError([]);
}

function fetchVehiclesFromFirestore(clientId) {
  if (unsubscribeSnapshot) {
    unsubscribeSnapshot();
    unsubscribeSnapshot = null;
  }

  // Si no se proporciona clientId, intentar del estado actual
  if (!clientId) {
    clientId = CURRENT_CLIENT_ID;
  }

  if (!clientId) {
    // Solo debug warn si ?debug=1
    if (window.isDebug && window.isDebug()) {
      console.trace("[Vehicles][TRACE] fetchVehiclesFromFirestore called without clientId");
      console.warn("[Vehicles][DEBUG] fetchVehiclesFromFirestore: No clientId provided or resolved");
    }
    return Promise.resolve([]);
  }

  console.log("[Vehicles] Loading vehicles for clientId:", clientId);
  
  // Debug logging: path y otros detalles
  if (window.isDebug && window.isDebug()) {
    console.log("[Vehicles][DEBUG] reading collection: clients/" + clientId + "/vehicles");
  }

  var resolved = false;

  return new Promise(function(resolve) {
    unsubscribeSnapshot = onSnapshot(
      collection(db, 'clients', clientId, 'vehicles'),
      function(snapshot) {
        if (window.isDebug && window.isDebug()) {
          console.log("[Vehicles][DEBUG] snapshot.size:", snapshot.size);
        }
        const vehicles = snapshot.empty ? [] : snapshot.docs.map(function(docSnap) {
  const raw = docSnap.data() || {};

  // Unificar ID real
  const withId = {
    ...raw,
    id: docSnap.id
  };

  // Normalizar SIEMPRE al leer
  const normalized = normalizeVehicleData(withId);

  console.log("LOAD:", normalized);

  return normalized;
});

        window.currentVehicles = vehicles;
        notifyListeners(vehicles);
        if (!resolved) { resolved = true; resolve(vehicles); }
      },
      function(error) {
        console.error('Error escuchando vehículos:', error);
        notifyListeners([]);
        if (!resolved) { resolved = true; resolve([]); }
      }
    );
  });
}

window.getVehicles = function getVehicles() {
  const auth = getAuth();
  if (!auth.currentUser) {
    console.error('Auth no listo para getVehicles');
    return [];
  }
  const uid = auth.currentUser.uid;
  // Return cached vehicles from listener if available
  return window.currentVehicles || [];
}

async function saveVehicles(vehicles) {
  const auth = getAuth();
  if (!auth.currentUser) {
    console.error('Auth no listo para saveVehicles');
    return;
  }
  if (!CURRENT_CLIENT_ID) {
    console.error('[Vehicles] CURRENT_CLIENT_ID not set for saveVehicles');
    return;
  }
  const batch = writeBatch(db);
  vehicles.forEach(vehicle => {
    batch.set(doc(db, 'clients', CURRENT_CLIENT_ID, 'vehicles', vehicle.id), vehicle);
  });
  try {
    await batch.commit();
  } catch (error) {
    console.error('Error guardando vehículos:', error);
    alert('Error al guardar vehículos');
  }
}

/* Obtener un vehículo por ID */
async function getVehicleById(id) {
  if (!CURRENT_CLIENT_ID) {
    console.warn('[Vehicles] getVehicleById: CURRENT_CLIENT_ID not set');
    return null;
  }
  const snap = await getDoc(doc(db, 'clients', CURRENT_CLIENT_ID, 'vehicles', id));
  const vehicle = snap.exists() ? { id: snap.id, ...snap.data() } : null;
  if (vehicle) {
    console.log("LOAD:", vehicle);
  }
  return vehicle;
}

/* Crear nuevo vehículo */
async function createVehicle(vehicleData) {
  const auth = getAuth();
  if (!auth.currentUser) throw new Error('No auth');
  if (!CURRENT_CLIENT_ID) throw new Error('No CURRENT_CLIENT_ID set');
  const id = vehicleData.id || 'v' + Date.now();
  const payload = { ...vehicleData };
  await setDoc(doc(db, 'clients', CURRENT_CLIENT_ID, 'vehicles', id), payload);
  return payload;
}

/* Alias: addVehicle (API pública) */
async function addVehicle(vehicleData) {
  const auth = getAuth();
  if (!auth.currentUser) {
    alert("Auth no listo. Recargá admin.");
    return;
  }
  if (!CURRENT_CLIENT_ID) {
    alert('CURRENT_CLIENT_ID not set');
    return;
  }
  
  // Normalize data before saving
  const normalized = normalizeForSave(vehicleData);
  
  // Validate vehicle data
  const validation = validateVehicle(normalized);
  if (!validation.ok) {
    renderAdminError(validation.errors);
    return;
  }
  
  // Limpiar errores previos
  clearAdminErrors();
  
  const payload = { ...normalized };
  delete payload.id;
  
  try {
    const docRef = await addDoc(collection(db, 'clients', CURRENT_CLIENT_ID, 'vehicles'), payload);
    const created = { id: docRef.id, ...payload };
    return created;
  } catch (error) {
    console.error('Error agregando vehículo:', error);
    renderAdminError(['Error al guardar el vehículo. Intentá de nuevo.']);
    return;
  }
}

/* Actualizar vehículo existente */
async function updateVehicle(id, vehicleData) {
  const auth = getAuth();
  if (!auth.currentUser) {
    alert("Auth no listo. Recargá admin.");
    return;
  }
  if (!CURRENT_CLIENT_ID) {
    alert('CURRENT_CLIENT_ID not set');
    return;
  }
  
  // Normalize data before saving
  const normalized = normalizeForSave(vehicleData);
  
  // Validate vehicle data
  const validation = validateVehicle(normalized);
  if (!validation.ok) {
    renderAdminError(validation.errors);
    return;
  }
  
  // Limpiar errores previos
  clearAdminErrors();
  
  const payload = { ...normalized };
  
  try {
    await setDoc(doc(db, 'clients', CURRENT_CLIENT_ID, 'vehicles', id), payload, { merge: true });
    return payload;
  } catch (error) {
    console.error('Error actualizando vehículo:', error);
    renderAdminError(['Error al guardar el vehículo. Intentá de nuevo.']);
    return;
  }
}

/* Eliminar vehículo */
async function deleteVehicle(id) {
  const auth = getAuth();
  if (!auth.currentUser) {
    alert("Auth no listo. Recargá admin.");
    return;
  }
  if (!CURRENT_CLIENT_ID) {
    alert('CURRENT_CLIENT_ID not set');
    return;
  }
  try {
    await deleteDoc(doc(db, 'clients', CURRENT_CLIENT_ID, 'vehicles', id));
    return true;
  } catch (error) {
    console.error('Error eliminando vehículo:', error);
    alert('Error al eliminar vehículo');
    return;
  }
}

/* Obtener marcas únicas */
function getUniqueBrands(vehicles) {
  if (!Array.isArray(vehicles)) return [];
  const brands = [...new Set(vehicles.map(v => {
    const normalized = normalizeVehicleData(v);
    return normalized.brand;
  }).filter(Boolean))];
  return brands.sort();
}

/* Obtener años únicos */
function getUniqueYears(vehicles) {
  if (!Array.isArray(vehicles)) return [];
  const years = [...new Set(vehicles.map(v => {
    const normalized = normalizeVehicleData(v);
    return normalized.year;
  }).filter(Boolean))];
  return years.sort((a, b) => b - a);
}

/* Filtrar vehículos */
function filterVehicles(vehicles, filters) {
  let filtered = vehicles;

  if (filters.marca && filters.marca !== 'todas') {
    filtered = filtered.filter(v => {
      const normalized = normalizeVehicleData(v);
      return normalized.brand === filters.marca;
    });
  }

  if (filters.año && filters.año !== 'todos') {
    filtered = filtered.filter(v => {
      const normalized = normalizeVehicleData(v);
      return normalized.year === parseInt(filters.año);
    });
  }

  return filtered;
}

/* Formatear precio argentino */
function formatPrice(price) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(price);
}

/* Formatear kilometraje */
function formatKm(km) {
  if (km === 0) return '0 km';
  return new Intl.NumberFormat('es-AR').format(km) + ' km';
}

window.formatKm = formatKm;

/* Generar HTML de tarjeta de vehículo */
function renderVehicleCard(vehicle) {
  // Normalize vehicle data
  const normalized = normalizeVehicleData(vehicle);
  
  const imgSrc = getCloudinaryCardUrl(
    normalized.mainImage || normalized.images[0] || 'assets/images/placeholder.jpg'
  );
  const vehicleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: safe(normalized.brand) + ' ' + safe(normalized.model) + ' ' + safe(normalized.year),
    brand: { '@type': 'Brand', name: safe(normalized.brand) },
    model: safe(normalized.model),
    productionDate: String(safe(normalized.year)),
    description: safe(normalized.brand) + ' ' + safe(normalized.model) + ' ' + safe(normalized.year) + ' en Corrientes Capital - ' + safe(normalized.estado),
    offers: {
      '@type': 'Offer',
      price: normalized.price,
      priceCurrency: 'ARS',
      availability: 'https://schema.org/InStock',
      itemCondition: normalized.estado === '0km' ? 'https://schema.org/NewCondition' : 'https://schema.org/UsedCondition'
    },
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Kilometraje', value: normalized.km, unitCode: 'KMT' },
      { '@type': 'PropertyValue', name: 'Combustible', value: safe(normalized.fuel) },
      { '@type': 'PropertyValue', name: 'Motor', value: safe(normalized.engine) },
      { '@type': 'PropertyValue', name: 'Transmisión', value: safe(normalized.transmission) }
    ]
  };

  return `
    <article class="vehicle-card fade-in" data-id="${vehicle.id}">
      <div class="vehicle-card-img">
        <img src="${imgSrc}" alt="${safe(normalized.brand)} ${safe(normalized.model)} ${safe(normalized.year)} en Corrientes Capital" loading="lazy" decoding="async" fetchpriority="low" width="800" height="500">
        <span class="vehicle-card-badge">${safe(normalized.estado)}</span>
      </div>
      <div class="vehicle-card-body">
        <h3>${safe(normalized.brand)} ${safe(normalized.model)}</h3>
        <p class="vehicle-year">${safe(normalized.year)} · ${formatKm(normalized.km)}</p>
        <p class="vehicle-price">${formatPrice(normalized.price)}</p>
        <div class="vehicle-card-footer">
          <button class="btn btn-primary btn-sm btn-ver-mas" data-id="${vehicle.id}">Ver más</button>
          <a href="https://wa.me/543794286684?text=Hola, me interesa el ${safe(normalized.brand)} ${safe(normalized.model)} ${safe(normalized.year)}" 
             class="btn btn-whatsapp btn-sm" target="_blank" rel="noopener">
            WhatsApp
          </a>
        </div>
      </div>
    </article>
    <script type="application/ld+json">${JSON.stringify(vehicleJsonLd)}</script>
  `;
}

function trackVehicleView(vehicle) {
  if (typeof gtag !== 'function' || !vehicle) return;
  
  // Normalize vehicle data
  const normalized = normalizeVehicleData(vehicle);
  
  const itemName = `${safe(normalized.brand)} ${safe(normalized.model)} ${safe(normalized.year)}`;
  const priceValue = normalized.price || 0;
  const itemId = vehicle.id != null ? String(vehicle.id) : '';
  window.lastVehiclePrice = priceValue;
  gtag('event', 'select_item', {
    item_list_name: 'vehiculos',
    item_category: safe(normalized.estado)
  });
  gtag('event', 'view_item', {
    currency: 'ARS',
    value: priceValue,
    items: [
      {
        item_id: itemId,
        item_name: itemName,
        item_brand: safe(normalized.brand),
        item_category: safe(normalized.estado),
        price: priceValue
      }
    ]
  });
}

/* Generar HTML del modal de vehículo */
function renderVehicleModal(vehicle) {
  // Normalize vehicle data
console.log("RAW VEHICLE:", vehicle);

  const normalized = normalizeVehicleData(vehicle);

  console.log("NORMALIZED:", normalized);
  
  const images = normalized.images.length > 0 
    ? normalized.images.map(img => getCloudinaryDetailUrl(img))
    : ['assets/images/placeholder.jpg'];

  let galleryDotsHTML = '';
  images.forEach((_, i) => {
    galleryDotsHTML += `<span class="gallery-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`;
  });

  let specsHTML = `
    <div class="modal-spec-item">
      <span class="modal-spec-label">Año</span>
      <span class="modal-spec-value">${safe(normalized.year)}</span>
    </div>
    <div class="modal-spec-item">
      <span class="modal-spec-label">Kilometraje</span>
      <span class="modal-spec-value">${formatKm(normalized.km)}</span>
    </div>
    <div class="modal-spec-item">
      <span class="modal-spec-label">Estado</span>
      <span class="modal-spec-value">${safe(normalized.estado)}</span>
    </div>
    <div class="modal-spec-item">
      <span class="modal-spec-label">Motor</span>
      <span class="modal-spec-value">${safe(normalized.engine)}</span>
    </div>
    <div class="modal-spec-item">
      <span class="modal-spec-label">Transmisión</span>
      <span class="modal-spec-value">${safe(normalized.transmission)}</span>
    </div>
    <div class="modal-spec-item">
      <span class="modal-spec-label">Combustible</span>
      <span class="modal-spec-value">${safe(normalized.fuel)}</span>
    </div>
  `;

  return `
    <div class="modal">
      <button class="modal-close" aria-label="Cerrar">&times;</button>
      <div class="modal-gallery">
        <img src="${images[0]}" alt="${safe(normalized.brand)} ${safe(normalized.model)} ${safe(normalized.year)} en Corrientes Capital" id="modalGalleryImg" loading="lazy" decoding="async" fetchpriority="low" width="800" height="500">
        ${images.length > 1 ? `
          <button class="gallery-nav gallery-prev" aria-label="Anterior">&#10094;</button>
          <button class="gallery-nav gallery-next" aria-label="Siguiente">&#10095;</button>
          <div class="gallery-dots">${galleryDotsHTML}</div>
        ` : ''}
      </div>
      <div class="modal-body">
        <h2>${safe(normalized.brand)} ${safe(normalized.model)}</h2>
        <p class="modal-price">${formatPrice(normalized.price)}</p>
        <div class="modal-specs">
          ${specsHTML}
        </div>
        <div class="modal-actions">
          <a href="https://wa.me/543794286684?text=Hola, me interesa el ${safe(normalized.brand)} ${safe(normalized.model)} ${safe(normalized.year)} publicado en su sitio web." 
             class="btn btn-whatsapp" target="_blank" rel="noopener">
            Consultar por WhatsApp
          </a>
          <button class="btn btn-outline modal-close-btn">Cerrar</button>
        </div>
      </div>
    </div>
  `;
}

/* Inicializar galería del modal */
function initModalGallery(vehicle) {
  // Normalize vehicle data
  const normalized = normalizeVehicleData(vehicle);
  
  const images = normalized.images.length > 0 
    ? normalized.images.map(img => getCloudinaryDetailUrl(img))
    : ['assets/images/placeholder.jpg'];

  if (images.length <= 1) return;

  let currentIndex = 0;
  const img = document.getElementById('modalGalleryImg');
  const dots = document.querySelectorAll('.gallery-dot');
  const prevBtn = document.querySelector('.gallery-prev');
  const nextBtn = document.querySelector('.gallery-next');

  function updateGallery(index) {
    currentIndex = index;
    img.src = images[currentIndex];
    img.alt = `${safe(normalized.brand)} ${safe(normalized.model)} ${safe(normalized.year)} en Corrientes Capital`;
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentIndex);
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      const newIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
      updateGallery(newIndex);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      const newIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
      updateGallery(newIndex);
    });
  }

  dots.forEach(dot => {
    dot.addEventListener('click', function(e) {
      e.stopPropagation();
      updateGallery(parseInt(this.dataset.index));
    });
  });
}

/* Convertir archivo a base64 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

window.fileToBase64 = fileToBase64;
window.uploadToCloudinary = uploadToCloudinary;
window.isCloudinaryUrl = isCloudinaryUrl;
window.getCloudinaryCardUrl = getCloudinaryCardUrl;
window.getCloudinaryDetailUrl = getCloudinaryDetailUrl;
window.getVehicles = getVehicles;
window.saveVehicles = saveVehicles;
window.getVehicleById = getVehicleById;
window.createVehicle = createVehicle;
window.addVehicle = addVehicle;
window.updateVehicle = updateVehicle;
window.deleteVehicle = deleteVehicle;
window.validateVehicle = validateVehicle;
window.renderAdminError = renderAdminError;
window.clearAdminErrors = clearAdminErrors;
window.getUniqueBrands = getUniqueBrands;
window.getUniqueYears = getUniqueYears;
window.filterVehicles = filterVehicles;
window.formatPrice = formatPrice;
window.formatKm = formatKm;
window.renderVehicleCard = renderVehicleCard;
window.renderVehicleModal = renderVehicleModal;
window.initModalGallery = initModalGallery;
window.trackVehicleView = trackVehicleView;
window.normalizeVehicleData = normalizeVehicleData;
window.normalizeForSave = normalizeForSave;
window.fetchVehiclesFromFirestore = fetchVehiclesFromFirestore;
window.onVehiclesChange = onVehiclesChange;
window.seedDemoVehiclesIfEmpty = seedDemoVehiclesIfEmpty;
