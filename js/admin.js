/* ============================================
   ADMIN.JS - Login y panel de administración
   CRUD de vehículos desde el panel admin
   ============================================ */

import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { app } from "./firebase.js";
import { db } from "./firebase.js";
import { initAuthListener } from "./auth.js";

document.addEventListener('DOMContentLoaded', function() {

  /* ============================================
    CONSTANTES
    ============================================ */
  const auth = getAuth(app);

  /* ============================================
     ELEMENTOS DOM
     ============================================ */
  const loginSection = document.getElementById('loginSection');
  const adminPanel = document.getElementById('adminPanel');
  const logoutBtn = document.getElementById('logoutBtn');

  /* Form elements */
  const adminForm = document.getElementById('adminVehicleForm');
  const editingIdInput = document.getElementById('editingId');
  const marcaInput = document.getElementById('adminMarca');
  const modeloInput = document.getElementById('adminModelo');
  const añoInput = document.getElementById('adminAño');
  const kmInput = document.getElementById('adminKm');
  const precioInput = document.getElementById('adminPrecio');
  const estadoInput = document.getElementById('adminEstado');
  const motorInput = document.getElementById('adminMotor');
  const transmisionInput = document.getElementById('adminTransmision');
  const combustibleInput = document.getElementById('adminCombustible');
  const imageInput = document.getElementById('adminImages');
  const imageUploadArea = document.getElementById('imageUploadArea');

  const btnCrear = document.getElementById('btnCrear');
  const btnEditar = document.getElementById('btnEditar');
  const btnLimpiar = document.getElementById('btnLimpiar');

  /* Config form elements */
  const configForm = document.getElementById('configForm');
  const configEmailInput = document.getElementById('configEmail');
  const configPhoneInput = document.getElementById('configPhone');
  const configAddressInput = document.getElementById('configAddress');
  const configInstagramInput = document.getElementById('configInstagram');
  const btnSaveConfig = document.getElementById('btnSaveConfig');

  const vehicleTableBody = document.getElementById('vehicleTableBody');
  const previewContainer = document.getElementById('previewContainer');
  const imagePreviewGrid = document.getElementById('imagePreviewGrid');

  /* Almacenar imágenes temporales para nuevo/editar */
  let tempImages = [];
  let originalImageUrls = [];

  /* ============================================
    AUTENTICACIÓN
    ============================================ */

  initAuthListener({
  requireAdmin: true,
  onUnauthorized: function() {
    window.location.href = 'login.html';
  },
  onReady: async function(state) {
    if (!state.isAdmin) return;

    // ❌ Quitado seed demo

    await showAdminPanel();
  }
});


  async function showAdminPanel() {
    if (loginSection) loginSection.style.display = 'none';
    if (adminPanel) adminPanel.classList.add('active');
    await loadConfigForm();
    await refreshVehicles();
  }

  async function refreshVehicles() {
    if (typeof fetchVehiclesFromFirestore === 'function') {
      await fetchVehiclesFromFirestore();
    }
    await loadVehicleTable();
    await updateDashboardStats();
  }

  /* Logout */
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      signOut(auth).then(function() {
        window.location.href = 'login.html';
      });
    });
  }

  /* ============================================
     CONFIGURACIÓN DE CONTACTO/REDES SOCIALES
     ============================================ */

  let CURRENT_TENANT_CLIENT_ID = null;

  // Obtener el clientId actual (desde window si está disponible, o resolverlo)
  async function getTenantClientId() {
    if (CURRENT_TENANT_CLIENT_ID) return CURRENT_TENANT_CLIENT_ID;

    // Single-site default
    if (window.SITE_CLIENT_ID) {
      CURRENT_TENANT_CLIENT_ID = window.SITE_CLIENT_ID;
      return CURRENT_TENANT_CLIENT_ID;
    }
    
    // Intenta obtener desde window.currentUser (auth.js)
    if (window.__AUTH_STATE && window.__AUTH_STATE.clientId) {
      CURRENT_TENANT_CLIENT_ID = window.__AUTH_STATE.clientId;
      return CURRENT_TENANT_CLIENT_ID;
    }

    // Fallback legacy
    if (typeof window.resolveClientId === 'function') {
      CURRENT_TENANT_CLIENT_ID = await window.resolveClientId();
    }

    return CURRENT_TENANT_CLIENT_ID;
  }

  // Cargar configuración de contacto
  async function loadConfigForm() {
    const clientId = await getTenantClientId();
    if (!clientId) {
      console.warn('[Admin] No clientId para cargar configuración');
      return;
    }

    try {
      const settingsRef = doc(db, 'clients', clientId, 'settings', 'public');
      const settingsDoc = await getDoc(settingsRef);

      if (settingsDoc.exists()) {
        const settings = settingsDoc.data();
        
        // Cargar valores en el formulario
        if (configEmailInput && settings.email) {
          configEmailInput.value = settings.email;
        }
        if (configPhoneInput && settings.phone) {
          configPhoneInput.value = settings.phone;
        }
        if (configAddressInput && settings.address) {
          configAddressInput.value = settings.address;
        }
        if (configInstagramInput && settings.instagram) {
          configInstagramInput.value = settings.instagram;
        }
      }
    } catch (err) {
      console.error('[Admin] Error cargando configuración:', err);
    }
  }

  // Validar y normalizar Instagram URL
  function normalizeInstagramUrl(value) {
    if (!value || typeof value !== 'string') return null;
    
    const trimmed = value.trim();
    if (!trimmed) return null;
    
    // Si comienza con @, convertir a URL
    if (trimmed.startsWith('@')) {
      return `https://instagram.com/${trimmed.slice(1)}`;
    }
    
    // Si ya es una URL válida, devolverla
    if (trimmed.startsWith('http')) {
      return trimmed;
    }
    
    // Si es solo un usuario, construir URL
    if (!trimmed.includes('/')) {
      return `https://instagram.com/${trimmed}`;
    }
    
    return trimmed;
  }

  // Guardar configuración de contacto
  async function saveConfigForm() {
    const clientId = await getTenantClientId();
    if (!clientId) {
      showToast('Error: No se pudo identificar el tenant', 'error');
      return;
    }

    try {
      // Preparar datos
      const configData = {};
      
      if (configEmailInput && configEmailInput.value.trim()) {
        configData.email = configEmailInput.value.trim();
      }
      if (configPhoneInput && configPhoneInput.value.trim()) {
        configData.phone = configPhoneInput.value.trim();
      }
      if (configAddressInput && configAddressInput.value.trim()) {
        configData.address = configAddressInput.value.trim();
      }
      if (configInstagramInput && configInstagramInput.value.trim()) {
        const instaUrl = normalizeInstagramUrl(configInstagramInput.value);
        if (instaUrl) {
          configData.instagram = instaUrl;
        }
      }

      // Guardar en Firestore
      const settingsRef = doc(db, 'clients', clientId, 'settings', 'public');
      await setDoc(settingsRef, configData, { merge: true });

      showToast('Configuración guardada', 'success');
    } catch (err) {
      console.error('[Admin] Error guardando configuración:', err);
      showToast('Error al guardar configuración', 'error');
    }
  }

  // Event listener para guardar configuración
  if (btnSaveConfig) {
    btnSaveConfig.addEventListener('click', function(e) {
      e.preventDefault();
      saveConfigForm();
    });
  }

  /* ============================================
     IMAGE UPLOAD
     ============================================ */

  if (imageUploadArea) {
    imageUploadArea.addEventListener('click', function() {
      if (imageInput) imageInput.click();
    });

    /* Drag and drop */
    imageUploadArea.addEventListener('dragover', function(e) {
      e.preventDefault();
      imageUploadArea.style.borderColor = 'var(--color-primary)';
    });

    imageUploadArea.addEventListener('dragleave', function() {
      imageUploadArea.style.borderColor = '';
    });

    imageUploadArea.addEventListener('drop', function(e) {
      e.preventDefault();
      imageUploadArea.style.borderColor = '';
      const files = e.dataTransfer.files;
      handleImageFiles(files);
    });
  }

  if (imageInput) {
    imageInput.addEventListener('change', function() {
      handleImageFiles(this.files);
    });
  }

  async function handleImageFiles(files) {
    const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
    const MAX_IMAGES = 10;
    const imageErrors = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      // Validar tamaño
      if (file.size > MAX_IMAGE_SIZE) {
        imageErrors.push(`"${file.name}": ${(file.size / 1024 / 1024).toFixed(2)}MB supera 5MB`);
        continue;
      }

      // Validar límite total
      if (tempImages.length >= MAX_IMAGES) {
        imageErrors.push(`Máximo ${MAX_IMAGES} imágenes por vehículo`);
        break;
      }

      try {
        const preview = URL.createObjectURL(file);
        tempImages.push({ preview: preview, file: file, url: null });
      } catch (err) {
        console.error('Error al procesar imagen:', err, 'File:', file);
        imageErrors.push(`Error procesando "${file.name}"`);
      }
    }

    // Mostrar errores si los hay
    if (imageErrors.length > 0) {
      renderAdminError(imageErrors);
    } else {
      clearAdminErrors();
    }

    renderImagePreviews();
    updateLivePreview();
  }

  function renderImagePreviews() {
    if (!imagePreviewGrid) return;

    if (tempImages.length === 0) {
      imagePreviewGrid.innerHTML = '';
      return;
    }

    imagePreviewGrid.innerHTML = tempImages.map(function(img, index) {
      return `
        <div class="image-preview-item">
          <img src="${img.preview}" alt="Preview ${index + 1}">
          <div class="image-preview-actions">
            <button type="button" class="image-preview-move" data-direction="up" data-index="${index}" aria-label="Subir">&#9650;</button>
            <button type="button" class="image-preview-move" data-direction="down" data-index="${index}" aria-label="Bajar">&#9660;</button>
            <button type="button" class="image-preview-remove" data-index="${index}" aria-label="Eliminar">&times;</button>
          </div>
        </div>
      `;
    }).join('');

    /* Event delegation para acciones */
    imagePreviewGrid.querySelectorAll('.image-preview-remove').forEach(function(btn) {
      btn.addEventListener('click', function() {
        const idx = parseInt(this.dataset.index);
        tempImages.splice(idx, 1);
        renderImagePreviews();
        updateLivePreview();
      });
    });

    imagePreviewGrid.querySelectorAll('.image-preview-move').forEach(function(btn) {
      btn.addEventListener('click', function() {
        const idx = parseInt(this.dataset.index);
        const direction = this.dataset.direction;
        const targetIndex = direction === 'up' ? idx - 1 : idx + 1;
        if (targetIndex < 0 || targetIndex >= tempImages.length) return;
        const moved = tempImages.splice(idx, 1)[0];
        tempImages.splice(targetIndex, 0, moved);
        renderImagePreviews();
        updateLivePreview();
      });
    });
  }

  /* ============================================
     LIVE PREVIEW
     ============================================ */

  function updateLivePreview() {
    if (!previewContainer) return;

    const marca = marcaInput ? marcaInput.value : '';
    const modelo = modeloInput ? modeloInput.value : '';
    const año = añoInput ? añoInput.value : '';
    const km = kmInput ? kmInput.value : '';
    const precio = precioInput ? precioInput.value : '';
    const estado = estadoInput ? estadoInput.value : '';

    if (!marca && !modelo) {
      previewContainer.innerHTML = '<p style="color: var(--color-gray); text-align: center;">Completá los campos para ver la vista previa.</p>';
      return;
    }

    const imgSrc = tempImages.length > 0
      ? tempImages[0].preview
      : 'assets/images/placeholder.jpg';

    previewContainer.innerHTML = `
      <div class="preview-card">
        <div class="vehicle-card" style="transform: none;">
          <div class="vehicle-card-img">
            <img src="${imgSrc}" alt="Preview">
            ${estado ? `<span class="vehicle-card-badge">${estado}</span>` : ''}
          </div>
          <div class="vehicle-card-body">
            <h3>${marca || ''} ${modelo || ''}</h3>
            <p class="vehicle-year">${año || '----'} · ${km ? formatKm(parseInt(km) || 0) : '--- km'}</p>
            <p class="vehicle-price">${precio ? formatPrice(parseInt(precio) || 0) : '$---'}</p>
          </div>
        </div>
      </div>
    `;
  }

  /* Escuchar cambios en los inputs para live preview */
  const formInputs = [marcaInput, modeloInput, añoInput, kmInput, precioInput, estadoInput];
  formInputs.forEach(function(input) {
    if (input) {
      input.addEventListener('input', updateLivePreview);
    }
  });

  async function uploadVehicleImage(file) {
    if (!file) return null;
    try {
      // Use global uploadToCloudinary function from vehicles.js
      const imageUrl = await window.uploadToCloudinary(file);
      return imageUrl;
    } catch (error) {
      console.error('Error al subir imagen a Cloudinary:', error, 'File:', file);
      return null;
    }
  }

  function setLoadingState(isLoading) {
    if (btnCrear) btnCrear.disabled = isLoading;
    if (btnEditar) btnEditar.disabled = isLoading;
  }

  async function prepareVehicleImages(vehicleId) {
    const images = [];

    for (let i = 0; i < tempImages.length; i++) {
      const entry = tempImages[i];
      if (entry.file) {
        const imageUrl = await uploadVehicleImage(entry.file);
        if (!imageUrl) {
          throw new Error("Failed to upload image");
        }
        images.push(imageUrl);
      } else if (entry.url) {
        images.push(entry.url);
      }
    }

    return images;
  }

  function getRemovedImages(nextImages) {
    if (!originalImageUrls || originalImageUrls.length === 0) return [];
    const nextSet = new Set(nextImages || []);
    return originalImageUrls.filter(function(url) {
      return url && !nextSet.has(url);
    });
  }

  /* ============================================
     CRUD OPERATIONS
     ============================================ */

  /* Crear vehículo */
  if (btnCrear) {
    btnCrear.addEventListener('click', async function(e) {
      e.preventDefault();
      if (!validateForm()) return;

      setLoadingState(true);

      try {
        const vehicleId = 'v' + Date.now();
        const images = await prepareVehicleImages(vehicleId);
        const vehicleData = getFormData();
        vehicleData.id = vehicleId;
        // Use images array for Cloudinary URLs
        vehicleData.images = images;
        // normalizeForSave will handle mainImage and field conversion
        if (typeof addVehicle === 'function') {
          await addVehicle(vehicleData);
        }
        clearForm();
        await refreshVehicles();
        showToast('Guardado', 'success');
      } catch (error) {
        console.error('Error subiendo imagen:', error);
        console.error(error);
        showToast('Error al guardar', 'error');
      } finally {
        setLoadingState(false);
      }
    });
  }

  /* Editar vehículo */
  if (btnEditar) {
    btnEditar.addEventListener('click', async function(e) {
      e.preventDefault();
      const editingId = editingIdInput ? editingIdInput.value : '';
      if (!editingId) {
        showNotification('Seleccioná un vehículo de la tabla para editar.', true);
        return;
      }
      if (!validateForm()) return;

      setLoadingState(true);

      try {
        const images = await prepareVehicleImages(editingId);
        const vehicleData = getFormData();
        // Use images array for Cloudinary URLs
        vehicleData.images = images;
        // normalizeForSave will handle mainImage and field conversion
        if (typeof updateVehicle === 'function') {
          await updateVehicle(editingId, vehicleData);
        }
        clearForm();
        await refreshVehicles();
        showToast('Guardado', 'success');
      } catch (error) {
        console.error('Error subiendo imagen:', error);
        console.error(error);
        showToast('Error al guardar', 'error');
      } finally {
        setLoadingState(false);
      }
    });
  }

  /* Limpiar formulario */
  if (btnLimpiar) {
    btnLimpiar.addEventListener('click', function(e) {
      e.preventDefault();
      clearForm();
    });
  }

  /* Obtener datos del formulario */
  function getFormData() {
    return {
      marca: marcaInput ? marcaInput.value.trim() : '',
      modelo: modeloInput ? modeloInput.value.trim() : '',
      año: añoInput ? parseInt(añoInput.value) || 0 : 0,
      kilometraje: kmInput ? parseInt(kmInput.value) || 0 : 0,
      precio: precioInput ? parseInt(precioInput.value) || 0 : 0,
      estado: estadoInput ? estadoInput.value : '',
      motor: motorInput ? motorInput.value.trim() : '',
      transmision: transmisionInput ? transmisionInput.value : '',
      combustible: combustibleInput ? combustibleInput.value : ''
    };
  }

  /* Validar formulario */
  function validateForm() {
    if (!marcaInput || !marcaInput.value.trim()) {
      showNotification('Ingresá la marca del vehículo.', true);
      return false;
    }
    if (!modeloInput || !modeloInput.value.trim()) {
      showNotification('Ingresá el modelo del vehículo.', true);
      return false;
    }
    if (!añoInput || !añoInput.value) {
      showNotification('Ingresá el año del vehículo.', true);
      return false;
    }
    if (!precioInput || !precioInput.value) {
      showNotification('Ingresá el precio del vehículo.', true);
      return false;
    }
    if (tempImages.length === 0) {
      showNotification('Debes subir al menos una imagen.', true);
      return false;
    }
    return true;
  }

  /* Limpiar formulario */
  function clearForm() {
    if (adminForm) adminForm.reset();
    if (editingIdInput) editingIdInput.value = '';
    tempImages = [];
    originalImageUrls = [];
    renderImagePreviews();
    updateLivePreview();
    if (btnEditar) btnEditar.style.display = 'none';
    if (btnCrear) btnCrear.style.display = '';

    /* Reset editing indicator */
    const editingIndicator = document.getElementById('editingIndicator');
    const formModeBadge = document.getElementById('formModeBadge');
    if (editingIndicator) editingIndicator.classList.remove('show');
    if (formModeBadge) { formModeBadge.textContent = 'CREAR'; formModeBadge.style.background = ''; formModeBadge.style.color = ''; }
  }

  /* ============================================
     VEHICLE TABLE
     ============================================ */

  async function loadVehicleTable() {
    if (!vehicleTableBody) return;

    const vehicles = window.currentVehicles || [];


    if (vehicles.length === 0) {
      vehicleTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--color-gray); padding: 30px;">
            No hay vehículos cargados.
          </td>
        </tr>
      `;
      return;
    }

    /* Update count badge */
    const countBadge = document.getElementById('vehicleCountBadge');
    if (countBadge) countBadge.textContent = vehicles.length;

    const editingId = editingIdInput ? editingIdInput.value : '';

    vehicleTableBody.innerHTML = vehicles.map(function(v) {
      // Use normalizeVehicleData from vehicles.js
      const normalized = window.normalizeVehicleData ? window.normalizeVehicleData(v) : {
        brand: v.marca || v.brand || "",
        model: v.modelo || v.model || "",
        year: v.año || v.year || "",
        km: v.kilometraje || v.km || 0,
        price: v.precio || v.price || 0,
        estado: v.estado || "",
        images: Array.isArray(v.images) ? v.images : (v.imageUrl ? [v.imageUrl] : [])
      };
      
      const imgSrc = normalized.images.length > 0 ? normalized.images[0] : 'assets/images/placeholder.jpg';
      const isEditing = v.id === editingId;
      return `
        <tr data-id="${v.id}" class="${isEditing ? 'editing' : ''}">
          <td><img src="${imgSrc}" alt="${(normalized.brand || '') + ' ' + (normalized.model || '')}" class="table-img"></td>
          <td>${(normalized.brand || '') + ' ' + (normalized.model || '')}</td>
          <td>${normalized.year || ''}</td>
          <td>${formatKm(normalized.km || 0)}</td>
          <td>${formatPrice(normalized.price || 0)}</td>
          <td>${normalized.estado || ''}</td>
          <td>
            <div class="table-actions">
              <button class="btn btn-warning btn-sm btn-table-edit" data-id="${v.id}">Editar</button>
              <button class="btn btn-danger btn-sm btn-table-delete" data-id="${v.id}">Eliminar</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  /* Event delegation para acciones de la tabla */
  if (vehicleTableBody) {
    vehicleTableBody.addEventListener('click', async function(e) {
      const editBtn = e.target.closest('.btn-table-edit');
      const deleteBtn = e.target.closest('.btn-table-delete');

      if (editBtn) {
        const id = editBtn.dataset.id;
        loadVehicleToForm(id);
      }

      if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        if (confirm('¿Estás seguro de que querés eliminar este vehículo?')) {
          if (typeof deleteVehicle === 'function') {
            await deleteVehicle(id);
          }
          clearForm();
          await refreshVehicles();
          showToast('Eliminado', 'success');
        }
      }
    });
  }

  /* Cargar vehículo en el formulario para editar */
  function loadVehicleToForm(id) {
    const vehicle = getVehicleById(id);
    if (!vehicle) return;

    console.log("LOAD:", vehicle);

    // Normalize vehicle data
    const normalized = window.normalizeVehicleData ? window.normalizeVehicleData(vehicle) : {
      brand: vehicle.marca || vehicle.brand || "",
      model: vehicle.modelo || vehicle.model || "",
      year: vehicle.año || vehicle.year || "",
      km: vehicle.kilometraje || vehicle.km || 0,
      price: vehicle.precio || vehicle.price || 0,
      estado: vehicle.estado || "",
      motor: vehicle.motor || vehicle.engine || "",
      transmision: vehicle.transmision || vehicle.transmission || "",
      combustible: vehicle.combustible || vehicle.fuel || "",
      images: Array.isArray(vehicle.images) ? vehicle.images : (vehicle.imageUrl ? [vehicle.imageUrl] : [])
    };

    if (editingIdInput) editingIdInput.value = vehicle.id;
    if (marcaInput) marcaInput.value = normalized.brand || "";
    if (modeloInput) modeloInput.value = normalized.model || "";
    if (añoInput) añoInput.value = normalized.year || "";
    if (kmInput) kmInput.value = normalized.km || 0;
    if (precioInput) precioInput.value = normalized.price || 0;
    if (estadoInput) estadoInput.value = normalized.estado || "";
    if (motorInput) motorInput.value = normalized.engine || "";
    if (transmisionInput) transmisionInput.value = normalized.transmission || "";
    if (combustibleInput) combustibleInput.value = normalized.fuel || "";

    /* Cargar imágenes existentes */
    originalImageUrls = normalized.images || [];
    tempImages = (normalized.images || []).map(function(url) {
      return { preview: url, file: null, url: url };
    });
    renderImagePreviews();
    updateLivePreview();

    /* Mostrar botón editar, ocultar crear */
    if (btnEditar) btnEditar.style.display = '';
    if (btnCrear) btnCrear.style.display = 'none';

    /* Mostrar indicador de edición */
    const editingIndicator = document.getElementById('editingIndicator');
    const editingName = document.getElementById('editingName');
    const formModeBadge = document.getElementById('formModeBadge');
    if (editingIndicator) editingIndicator.classList.add('show');
    if (editingName) editingName.textContent = normalized.brand + ' ' + normalized.model + ' ' + normalized.year;
    if (formModeBadge) { formModeBadge.textContent = 'EDITAR'; formModeBadge.style.background = 'var(--color-warning)'; formModeBadge.style.color = 'var(--color-black)'; }

    /* Highlight row in table */
    loadVehicleTable();

    /* Scroll al formulario */
    const formCard = document.querySelector('.admin-form-card');
    if (formCard) {
      formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /* ============================================
     NOTIFICACIONES
     ============================================ */

  function showToast(message, type) {
    var bg = 'rgba(40,167,69,0.95)';
    if (type === 'error') bg = 'rgba(229,9,20,0.95)';
    else if (type === 'warn') bg = 'rgba(255,165,0,0.95)';

    var existing = document.getElementById('adminToast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.id = 'adminToast';
    toast.style.cssText = 'position:fixed;top:24px;right:24px;padding:14px 28px;border-radius:10px;font-size:0.95rem;font-weight:600;z-index:9999;color:#fff;pointer-events:none;opacity:0;transform:translateY(-12px);transition:opacity 0.3s,transform 0.3s;background:' + bg + ';box-shadow:0 4px 20px rgba(0,0,0,0.25);';
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(function() {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    });

    setTimeout(function() {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-12px)';
      setTimeout(function() { toast.remove(); }, 300);
    }, 2500);
  }

  function showNotification(message, isError) {
    showToast(message, isError ? 'error' : 'success');
  }

  /* ============================================
     DASHBOARD STATS
     ============================================ */

  async function updateDashboardStats() {
    const vehicles = window.currentVehicles || [];
    const statTotal = document.getElementById('statTotal');
    const statUsados = document.getElementById('statUsados');
    const stat0km = document.getElementById('stat0km');
    const statMarcas = document.getElementById('statMarcas');
    const countBadge = document.getElementById('vehicleCountBadge');

    if (statTotal) statTotal.textContent = vehicles.length;
    if (statUsados) statUsados.textContent = vehicles.filter(function(v) { return v.estado === 'Usado'; }).length;
    if (stat0km) stat0km.textContent = vehicles.filter(function(v) { return v.estado === '0km'; }).length;
    if (statMarcas) statMarcas.textContent = new Set(vehicles.map(function(v) { 
  const normalized = window.normalizeVehicleData ? window.normalizeVehicleData(v) : v;
  return normalized.brand; 
})).size;
    if (countBadge) countBadge.textContent = vehicles.length;
  }

  /* ============================================
     CANCEL EDIT BUTTON
     ============================================ */

  const cancelEditBtn = document.getElementById('cancelEdit');
  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', function() {
      clearForm();
      loadVehicleTable();
    });
  }

  /* ============================================
     ENHANCED LIVE PREVIEW
     ============================================ */

  /* Override live preview to include specs grid */
  const origUpdateLivePreview = updateLivePreview;
  updateLivePreview = function() {
    if (!previewContainer) return;

    const marca = marcaInput ? marcaInput.value : '';
    const modelo = modeloInput ? modeloInput.value : '';
    const año = añoInput ? añoInput.value : '';
    const km = kmInput ? kmInput.value : '';
    const precio = precioInput ? precioInput.value : '';
    const estado = estadoInput ? estadoInput.value : '';
    const motor = motorInput ? motorInput.value : '';
    const transmision = transmisionInput ? transmisionInput.value : '';
    const combustible = combustibleInput ? combustibleInput.value : '';

    if (!marca && !modelo) {
      previewContainer.innerHTML = '<p style="color: var(--color-gray); text-align: center; padding: 40px 0;">Completá los campos para ver la vista previa del vehículo.</p>';
      return;
    }

    const imgSrc = tempImages.length > 0 && tempImages[0].preview
      ? tempImages[0].preview
      : 'assets/images/placeholder.jpg';

    previewContainer.innerHTML = `
      <div class="preview-card">
        <div class="vehicle-card" style="transform: none;">
          <div class="vehicle-card-img">
            <img src="${imgSrc}" alt="Preview">
            ${estado ? '<span class="vehicle-card-badge">' + estado + '</span>' : ''}
          </div>
          <div class="vehicle-card-body">
            <h3>${marca} ${modelo}</h3>
            <p class="vehicle-year">${año || '----'} · ${km ? formatKm(parseInt(km)) : '--- km'}</p>
            <p class="vehicle-price">${precio ? formatPrice(parseInt(precio)) : '$---'}</p>
            <div class="preview-specs">
              <div class="preview-spec"><span class="preview-spec-label">Motor</span><br><span class="preview-spec-value">${motor || '---'}</span></div>
              <div class="preview-spec"><span class="preview-spec-label">Transmisión</span><br><span class="preview-spec-value">${transmision || '---'}</span></div>
              <div class="preview-spec"><span class="preview-spec-label">Combustible</span><br><span class="preview-spec-value">${combustible || '---'}</span></div>
              <div class="preview-spec"><span class="preview-spec-label">Estado</span><br><span class="preview-spec-value">${estado || '---'}</span></div>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  /* Re-bind input listeners to the new updateLivePreview */
  formInputs.forEach(function(input) {
    if (input) {
      input.removeEventListener('input', origUpdateLivePreview);
      input.addEventListener('input', updateLivePreview);
    }
  });
  /* Also listen to motor, transmision, combustible */
  [motorInput, transmisionInput, combustibleInput].forEach(function(input) {
    if (input) {
      input.addEventListener('input', updateLivePreview);
      input.addEventListener('change', updateLivePreview);
    }
  });

  /* ============================================
     INICIALIZACIÓN
     ============================================ */

  /* Ocultar botón editar inicialmente */
  if (btnEditar) btnEditar.style.display = 'none';

  /* Live preview inicial */
  updateLivePreview();

});
function formatKm(km) {
  if (km === 0) return '0 km';
  if (!km) return '';
  return Number(km).toLocaleString('es-AR');
}

function formatPrice(price) {
  if (!price) return '$---';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(price);
}

// Export functions for global access
window.formatKm = formatKm;
window.formatPrice = formatPrice;
