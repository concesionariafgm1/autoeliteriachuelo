/* ============================================
   MAIN.JS - Animaciones y UI general
   Maneja navbar, scroll, IntersectionObserver
   ============================================ */

// Importar funciones de tenant.js (como módulo ES)
import { resolveClientId, loadTenantPublicSettings } from './tenant.js';

// Exponer a window para compatibilidad con código no-módulo
window.resolveClientId = resolveClientId;
window.loadTenantPublicSettings = loadTenantPublicSettings;

document.addEventListener('DOMContentLoaded', function() {

 function applyConfig(config) {
    if (!config) return;

    document.querySelectorAll('.site-logo').forEach(function(el) {
      if (config.logo) el.src = config.logo;
      if (config.brandName) el.alt = config.brandName;
    });

    const heroTitle = document.querySelector('.hero h1');
    if (heroTitle && config.heroTitle) {
      heroTitle.textContent = config.heroTitle;
    }

    const heroSubtitle = document.querySelector('.hero p');
    if (heroSubtitle && config.heroSubtitle) {
      heroSubtitle.textContent = config.heroSubtitle;
    }

    const contactBlocks = document.querySelectorAll('.contact-info-text');
    contactBlocks.forEach(function(block) {
      const heading = block.querySelector('h4');
      const value = block.querySelector('p');
      if (!heading || !value) return;
      const label = heading.textContent.trim().toLowerCase();
      if (label === 'direccion' && config.address) {
        value.textContent = config.address;
      }
      if (label === 'whatsapp' && config.phone) {
        value.textContent = config.phone;
      }
      if (label === 'email' && config.email) {
        value.textContent = config.email;
      }
    });

    document.querySelectorAll('.footer-col').forEach(function(col) {
      const title = col.querySelector('h4');
      if (!title) return;
      if (title.textContent.trim().toLowerCase() === 'contacto') {
        const lines = col.querySelectorAll('p');
        if (lines[0] && config.address) lines[0].textContent = config.address;
        if (lines[1] && config.address) lines[1].textContent = config.address.split(',')[1]?.trim() || lines[1].textContent;
        if (lines[2] && config.phone) lines[2].textContent = `Tel: ${config.phone}`;
      }
    });

    document.querySelectorAll('.footer-brand').forEach(function(el) {
      if (!config.footerBrand) return;
      const span = el.querySelector('span');
      if (span) {
        const parts = config.footerBrand.split(' ');
        if (parts.length > 1) {
          span.textContent = parts.pop();
          el.childNodes[0].textContent = parts.join(' ') + ' ';
        } else {
          span.textContent = config.footerBrand;
          el.childNodes[0].textContent = '';
        }
      } else {
        el.textContent = config.footerBrand;
      }
    });

    const footerCopyright = document.querySelector('.footer-bottom p');
    if (footerCopyright && config.copyright) {
      footerCopyright.textContent = config.copyright;
    }

    if (config.whatsapp) {
      const waNumber = config.whatsapp.replace(/\D/g, '');
      document.querySelectorAll('a[href^="https://wa.me/"]').forEach(function(link) {
        try {
          const url = new URL(link.href);
          const query = url.search;
          link.href = `https://wa.me/${waNumber}${query}`;
        } catch (err) {
          link.href = `https://wa.me/${waNumber}`;
        }
      });
    }

    // Instagram links
    document.querySelectorAll('a[data-social="instagram"]').forEach(function(link) {
      if (config.instagram) {
        link.href = config.instagram;
        link.style.display = '';
      } else {
        link.style.display = 'none';
      }
    });
  }

  const defaultConfig = window.APP_CONFIG || null;

  // Helper: check debug mode
  function isDebugMode() {
    return new URLSearchParams(window.location.search).get('debug') === '1';
  }

  // Inicializar tenant: resolver clientId por dominio o ?client=
  (async function initTenant() {
    try {
      // Resolver clientId: primero ?client=, luego hostname en Firestore
      const resolvedClientId = await window.resolveClientId();
      
      if (isDebugMode()) {
        console.log("[Main][DEBUG] hostname:", window.location.hostname);
        console.log("[Main][DEBUG] resolvedClientId:", resolvedClientId);
      }
      
      if (resolvedClientId) {
        console.log("[Main] Resolved tenant clientId:", resolvedClientId);
        window.TENANT_CLIENT_ID = resolvedClientId;

        // Intento 1: Cargar settings públicos desde Firestore
        const tenantSettings = await window.loadTenantPublicSettings(resolvedClientId);
        
        if (tenantSettings) {
          // Fusionar settings de Firestore con defaultConfig
          window.APP_CONFIG = Object.assign({}, defaultConfig || {}, tenantSettings);
          if (isDebugMode()) {
            console.log("[Main][DEBUG] Applied config source: Firestore settings");
          }
          console.log("[Main] Applied tenant settings from Firestore");
          applyConfig(window.APP_CONFIG);
        } else {
          // Intento 2: Fallback a clients/{clientId}.json (compatibilidad)
          try {
            const response = await fetch(`clients/${resolvedClientId}.json`);
            if (response.ok) {
              const clientConfig = await response.json();
              window.APP_CONFIG = Object.assign({}, defaultConfig || {}, clientConfig);
              if (isDebugMode()) {
                console.log("[Main][DEBUG] Applied config source: clients/" + resolvedClientId + ".json");
              }
              console.log("[Main] Applied tenant settings from clients/" + resolvedClientId + ".json");
              applyConfig(window.APP_CONFIG);
            } else {
              // Fallback: usar defaultConfig
              if (isDebugMode()) {
                console.log("[Main][DEBUG] Applied config source: defaultConfig (JSON 404)");
              }
              console.log("[Main] No JSON config found, using default");
              applyConfig(defaultConfig);
            }
          } catch (err) {
            if (isDebugMode()) {
              console.log("[Main][DEBUG] Applied config source: defaultConfig (JSON fetch error)");
            }
            console.warn("[Main] Error fetching JSON config:", err);
            applyConfig(defaultConfig);
          }
        }
      } else {
        // No se pudo resolver clientId, usar defaultConfig
        if (isDebugMode()) {
          console.log("[Main][DEBUG] Applied config source: defaultConfig (no clientId resolved)");
        }
        console.log("[Main] No clientId resolved, using default config");
        applyConfig(defaultConfig);
      }
    } catch (error) {
      console.error("[Main] Error in tenant initialization:", error);
      applyConfig(defaultConfig);
    }
  })();

  /* ============================================
     NAVBAR - Scroll effect + sticky
     ============================================ */
  const navbar = document.querySelector('.navbar');

  function handleNavbarScroll() {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  let navbarTicking = false;
  function onNavbarScroll() {
    if (!navbarTicking) {
      window.requestAnimationFrame(function() {
        handleNavbarScroll();
        navbarTicking = false;
      });
      navbarTicking = true;
    }
  }

  window.addEventListener('scroll', onNavbarScroll);
  handleNavbarScroll();

  /* ============================================
     HAMBURGER MENU - Mobile toggle
     ============================================ */
  const hamburger = document.querySelector('.hamburger');
  const navMenu = document.querySelector('.navbar-menu');

  if (hamburger && navMenu) {
    hamburger.addEventListener('click', function() {
      hamburger.classList.toggle('active');
      navMenu.classList.toggle('active');
      /* Prevenir scroll del body cuando el menu esta abierto */
      document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    });

    /* Cerrar menu al hacer click en un enlace */
    navMenu.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', function() {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  /* ============================================
     ACTIVE NAV LINK - Resaltar pagina actual
     ============================================ */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.navbar-menu a');

  navLinks.forEach(function(link) {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  /* ============================================
     INTERSECTION OBSERVER - Fade-in animations
     ============================================ */
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const fadeObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        /* Dejar de observar una vez animado */
        fadeObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  /* Observar todos los elementos con clase fade-in */
  function initFadeAnimations() {
    const fadeElements = document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right');
    fadeElements.forEach(function(el) {
      fadeObserver.observe(el);
    });
  }

  initFadeAnimations();

  /* Exponer funcion para re-inicializar animaciones (usado despues de renderizar vehiculos) */
  window.initFadeAnimations = initFadeAnimations;

  /* ============================================
     SMOOTH SCROLL - Para links internos
     ============================================ */
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const navHeight = navbar.offsetHeight;
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight;
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  /* ============================================
     MODAL HANDLER - Abrir/cerrar modales
     ============================================ */
  window.openModal = async function(vehicleId) {
  try {
    const vehicle = await getVehicleById(vehicleId);

    if (!vehicle) {
      console.error("No se encontro vehiculo:", vehicleId);
      return;
    }

    console.log("MODAL DATA:", vehicle);

    let overlay = document.querySelector('.modal-overlay');

    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = renderVehicleModal(vehicle);
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    if (typeof trackVehicleView === 'function') {
      trackVehicleView(vehicle);
    }

    /* Inicializar galeria */
    initModalGallery(vehicle);

    /* Cerrar modal */
    overlay.querySelector('.modal-close').addEventListener('click', closeModal);
    const closeBtn = overlay.querySelector('.modal-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closeModal();
    });

    /* Cerrar con ESC */
    document.addEventListener('keydown', handleEscClose);
  } catch (err) {
    console.error("Error abriendo modal:", err);
  }
};

  function closeModal() {
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
    document.removeEventListener('keydown', handleEscClose);
  }

  function handleEscClose(e) {
    if (e.key === 'Escape') closeModal();
  }

  /* Delegacion de eventos para botones "Ver mas" */
  document.addEventListener('click', function(e) {
    const verMasBtn = e.target.closest('.btn-ver-mas');
    if (verMasBtn) {
      e.preventDefault();
      const vehicleId = verMasBtn.dataset.id;
      window.openModal(vehicleId);
    }
  });

  const whatsappFloat = document.querySelector('.whatsapp-float');
  if (whatsappFloat) {
    whatsappFloat.addEventListener('click', function() {
      if (typeof gtag === 'function') {
        const leadValue = typeof window.lastVehiclePrice === 'number' ? window.lastVehiclePrice : 0;
        gtag('event', 'whatsapp_click', {
          event_category: 'engagement',
          event_label: 'floating_button'
        });
        gtag('event', 'generate_lead', {
          method: 'whatsapp',
          value: leadValue,
          currency: 'ARS'
        });
      }
    });
  }

  /* ============================================
     CONTACT FORM - Manejo frontend
     ============================================ */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();

      const nombre = contactForm.querySelector('[name="nombre"]').value.trim();
      const email = contactForm.querySelector('[name="email"]').value.trim();
      const mensaje = contactForm.querySelector('[name="mensaje"]').value.trim();

      const msgEl = document.querySelector('.form-message');
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const textEl = submitBtn ? submitBtn.querySelector('.btn-text') : null;
      const originalText = textEl ? textEl.textContent : '';

      const nombreInput = contactForm.querySelector('[name="nombre"]');
      const emailInput = contactForm.querySelector('[name="email"]');
      const mensajeInput = contactForm.querySelector('[name="mensaje"]');

      function setFieldState(field, isValid) {
        if (!field) return;
        field.classList.toggle('is-valid', isValid);
        field.classList.toggle('is-invalid', !isValid);
      }

      function setLoading(isLoading) {
        if (!submitBtn) return;
        submitBtn.classList.toggle('is-loading', isLoading);
        submitBtn.disabled = isLoading;
        if (textEl) {
          textEl.textContent = isLoading ? 'Enviando...' : originalText;
        }
      }

      function showMessage(text, isSuccess) {
        if (!msgEl) return;
        msgEl.textContent = text;
        msgEl.classList.toggle('success', isSuccess);
        msgEl.style.display = 'block';
        setTimeout(function() {
          msgEl.style.display = 'none';
          msgEl.classList.remove('success');
        }, 5000);
      }

      const nombreValid = Boolean(nombre);
      const emailValid = Boolean(email) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      const mensajeValid = Boolean(mensaje);

      setFieldState(nombreInput, nombreValid);
      setFieldState(emailInput, emailValid);
      setFieldState(mensajeInput, mensajeValid);

      if (!nombreValid || !emailValid || !mensajeValid) {
        showMessage('Por favor completa todos los campos obligatorios.', false);
        return;
      }

      const formData = new FormData(contactForm);
      const actionUrl = contactForm.getAttribute('action');

      setLoading(true);

      fetch(actionUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      }).then(function(response) {
        if (response.ok) {
          showMessage('Mensaje enviado correctamente! Nos pondremos en contacto pronto.', true);
          if (typeof gtag === 'function') {
            const leadValue = typeof window.lastVehiclePrice === 'number' ? window.lastVehiclePrice : 0;
            gtag('event', 'generate_lead', {
              method: 'formulario',
              value: leadValue,
              currency: 'ARS'
            });
          }
          if (typeof gtag === 'function') {
            gtag('event', 'lead', {
              event_category: 'contacto',
              event_label: 'form_submit'
            });
          }
          contactForm.reset();
          setFieldState(nombreInput, false);
          setFieldState(emailInput, false);
          setFieldState(mensajeInput, false);
          return;
        }
        return response.json().then(function(data) {
          const errorText = data && data.message ? data.message : 'No pudimos enviar el mensaje. Intenta nuevamente.';
          showMessage(errorText, false);
        });
      }).catch(function() {
        showMessage('No pudimos enviar el mensaje. Revisa tu conexion e intenta nuevamente.', false);
      }).finally(function() {
        setLoading(false);
      });
    });
  }

/* ============================================
   FEATURED VEHICLES - Home page
   ============================================ */
const featuredGrid = document.getElementById('featuredVehicles');
if (featuredGrid) {
  function renderFeatured(vehicles) {
    var featured = (Array.isArray(vehicles) ? vehicles : []).slice(0, 3);
    if (featured.length > 0) {
      featuredGrid.innerHTML = featured.map(renderVehicleCard).join('');
      initFadeAnimations();
    } else {
      featuredGrid.innerHTML = '<div class="no-vehicles"><p>No hay vehiculos disponibles actualmente.</p></div>';
    }
  }

  if (typeof onVehiclesChange === 'function') {
    onVehiclesChange(renderFeatured);
  }
}

/* ============================================
   VEHICLES PAGE - Grid + Filtros
   ============================================ */
const vehiclesGrid = document.getElementById('vehiclesGrid');
const filterMarca = document.getElementById('filterMarca');
const filterAno = document.getElementById('filterAño');
const searchInput = document.getElementById('searchInput');

if (vehiclesGrid) {
  /* Llenar filtros */
  function populateFilters(vehicles) {
    vehicles = Array.isArray(vehicles) ? vehicles : [];
    const brands = getUniqueBrands(vehicles);
    const years = getUniqueYears(vehicles);

    if (filterMarca) {
        filterMarca.innerHTML = '<option value="todas">Todas las marcas</option>';
        brands.forEach(function(brand) {
          filterMarca.innerHTML += `<option value="${brand}">${brand}</option>`;
        });
      }

      if (filterAno) {
        filterAno.innerHTML = '<option value="todos">Todos los anos</option>';
        years.forEach(function(year) {
          filterAno.innerHTML += `<option value="${year}">${year}</option>`;
        });
      }
    }

    /* Renderizar grilla */
    function renderVehiclesGrid(vehicles) {
      vehicles = Array.isArray(vehicles) ? vehicles : [];
      const filters = {
        marca: filterMarca ? filterMarca.value : 'todas',
        ano: filterAno ? filterAno.value : 'todos'
      };

      var filtered = filterVehicles(vehicles, filters);

      /* Client-side text search */
      if (searchInput && searchInput.value.trim()) {
        var query = searchInput.value.trim().toLowerCase();
        filtered = filtered.filter(function(v) {
          var normalized = window.normalizeVehicleData ? window.normalizeVehicleData(v) : v;
          var searchable = (normalized.brand + ' ' + normalized.model + ' ' + normalized.year).toLowerCase();
          return searchable.indexOf(query) !== -1;
        });
      }

      if (filtered.length > 0) {
        vehiclesGrid.innerHTML = filtered.map(renderVehicleCard).join('');
        initFadeAnimations();
      } else {
        vehiclesGrid.innerHTML = `
          <div class="no-vehicles" style="grid-column: 1 / -1;">
            <p>No se encontraron vehiculos con los filtros seleccionados.</p>
            <button class="btn btn-outline btn-sm" aria-label="Limpiar filtros" onclick="document.getElementById('filterMarca').value='todas';document.getElementById('filterAno').value='todos';document.getElementById('searchInput').value='';renderPage();">
              Limpiar filtros
            </button>
          </div>
        `;
      }
    }

    /* Exponer renderPage para uso externo */
    window.renderPage = function() {
      const vehicles = window.currentVehicles || [];
      populateFilters(vehicles);
      renderVehiclesGrid(vehicles);
    };

    function setupVehicles(vehicles) {
      window.currentVehicles = vehicles;
      populateFilters(vehicles);
      renderVehiclesGrid(vehicles);
    }

    if (typeof onVehiclesChange === 'function') {
      onVehiclesChange(setupVehicles);
    }

    /* Event listeners de filtros */
    if (filterMarca) filterMarca.addEventListener('change', function() {
      const vehicles = window.currentVehicles || [];
      renderVehiclesGrid(vehicles);
    });
    if (filterAno) filterAno.addEventListener('change', function() {
      const vehicles = window.currentVehicles || [];
      renderVehiclesGrid(vehicles);
    });

    /* Instant search with debounce */
    if (searchInput) {
      var searchTimeout = null;
      searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(function() {
          const vehicles = window.currentVehicles || [];
          renderVehiclesGrid(vehicles);
        }, 200);
      });
    }
  };
});

