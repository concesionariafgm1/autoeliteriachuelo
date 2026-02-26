/* ============================================
   FIRESTORE SEED DATA - Ejemplo de estructura para AutoElite
   
   Este archivo contiene ejemplos de documentos Firestore
   que se deben crear para que el sitio funcione con la
   nueva arquitectura de bloques.
   
   Usa Firebase Console o el admin CLI para insertar estos datos.
   ============================================ */

// 1. MAPEO DE DOMINIO A TENANT
export const domainsData = {
  // Para desarrollo local con localhost
  "localhost": {
    clientId: "autoelite"
  },
  "127.0.0.1": {
    clientId: "autoelite"
  },
  // En producción (ejemplo)
  "autoelite.com.ar": {
    clientId: "autoelite"
  },
  "www.autoelite.com.ar": {
    clientId: "autoelite"
  }
};

// 2. CONFIGURACIÓN PÚBLICA DEL TENANT
export const clientSettingsPublic = {
  clientId: "autoelite",
  
  // Branding
  brandName: "AutoElite",
  logo: "assets/logo/logo.png",
  legalName: "AutoElite Concesionaria",
  
  // Contacto
  phone: "+543794286684",
  email: "info@autoelite.com.ar",
  address: "Avenida Independencia 3047, Corrientes Capital, Argentina",
  
  // Redes sociales
  whatsapp: "+543794286684",
  instagram: "https://instagram.com/autoelitecorrientes",
  facebook: null,
  
  // Colores
  colorPrimary: "#E50914",
  colorSecondary: "#333333",
  
  // Footer
  copyright: "© 2025 AutoElite. Todos los derechos reservados.",
  footerBrand: "AutoElite",
  
  // Feature flags
  featureFlags: {
    enableVehicleModule: true,
    enableTestimonials: true,
    enableFAQ: true
  },
  
  // Publicado
  published: true,
  updatedAt: Math.floor(Date.now() / 1000)
};

// 3. PÁGINA HOME
export const pageHome = {
  slug: "home",
  status: "published",
  meta: {
    title: "AutoElite - Concesionaria de Autos en Corrientes Capital",
    description: "Concesionaria de vehículos usados y 0km en Corrientes. Compra y venta de autos con financiación.",
    ogImage: "assets/logo/logo.png"
  },
  nav: {
    showInNav: true,
    label: "Inicio",
    order: 1
  },
  sections: [
    {
      id: "hero-home",
      type: "hero",
      props: {
        title: "Tu próximo auto está acá",
        subtitle: "Vehículos seleccionados, financiación y entrega inmediata",
        bgImage: null,
        cta: {
          text: "Ver Vehículos",
          link: "/vehiculos"
        }
      }
    },
    {
      id: "services-home",
      type: "servicesGrid",
      props: {
        columns: 3,
        items: [
          {
            icon: "🚗",
            title: "Amplio Inventario",
            description: "Contamos con docenas de vehículos disponibles en diferentes marcas y precios."
          },
          {
            icon: "💳",
            title: "Financiación Disponible",
            description: "Ofertas de crédito con tasas competitivas y plazos flexibles."
          },
          {
            icon: "🔧",
            title: "Asesoramiento Experto",
            description: "Nuestro equipo te ayudará a encontrar el auto perfecto."
          }
        ]
      }
    },
    {
      id: "cta-home",
      type: "callToAction",
      props: {
        text: "¿Necesitas más información?",
        link: "/contacto",
        backgroundColor: "#E50914"
      }
    }
  ],
  updatedAt: Math.floor(Date.now() / 1000)
};

// 4. PÁGINA VEHÍCULOS
export const pageVehiculos = {
  slug: "vehiculos",
  status: "published",
  meta: {
    title: "Autos en Venta | AutoElite Concesionaria",
    description: "Explora nuestro stock de vehículos usados y 0km. Chevrolet, Fiat y más.",
    ogImage: "assets/logo/logo.png"
  },
  nav: {
    showInNav: true,
    label: "Vehículos",
    order: 2
  },
  sections: [
    {
      id: "hero-vehiculos",
      type: "hero",
      props: {
        title: "Nuestro Stock de Vehículos",
        subtitle: "Encontrá el auto que estás buscando"
      }
    },
    {
      id: "listings-vehiculos",
      type: "listingsGrid",
      props: {
        collectionPath: "content/listings",
        filters: {
          category: "vehicles",
          status: "published"
        },
        sort: {
          field: "createdAt",
          direction: "desc"
        }
      }
    }
  ],
  updatedAt: Math.floor(Date.now() / 1000)
};

// 5. PÁGINA CONTACTO
export const pageContacto = {
  slug: "contacto",
  status: "published",
  meta: {
    title: "Contacto | AutoElite",
    description: "Ponte en contacto con AutoElite. Estamos en Av. Independencia 3047, Corrientes.",
    ogImage: "assets/logo/logo.png"
  },
  nav: {
    showInNav: true,
    label: "Contacto",
    order: 4
  },
  sections: [
    {
      id: "hero-contacto",
      type: "hero",
      props: {
        title: "Contacto",
        subtitle: "Estamos aquí para ayudarte"
      }
    },
    {
      id: "hours-contacto",
      type: "hours",
      props: {
        schedule: [
          { day: "Lunes a Viernes", hours: "9:00 - 18:00" },
          { day: "Sábados", hours: "9:00 - 13:00" },
          { day: "Domingos", hours: "Cerrado" }
        ]
      }
    },
    {
      id: "richtext-contacto",
      type: "richText",
      props: {
        html: `
          <div style="text-align: center; margin-bottom: 30px;">
            <h2>¿Cómo encontrarnos?</h2>
            <p><strong>Avenida Independencia 3047, Corrientes Capital, Argentina</strong></p>
            <p>Teléfono: +54 379 4286684</p>
            <p>Email: info@autoelite.com.ar</p>
          </div>
        `,
        alignment: "center"
      }
    },
    {
      id: "map-contacto",
      type: "map",
      props: {
        address: "Avenida Independencia 3047, Corrientes, Argentina",
        embedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3540.5!2d-58.8344!3d-27.4678!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94456ca6d1d4a1ef%3A0x0!2sAv.%20Independencia%203047%2C%20Corrientes!5e0!3m2!1ses-419!2sar!4v1700000000000!5m2!1ses-419!2sar"
      }
    },
    {
      id: "social-contacto",
      type: "socialLinks",
      props: {
        links: [
          { name: "Instagram", url: "https://instagram.com/autoelitecorrientes" },
          { name: "WhatsApp", url: "https://wa.me/543794286684" }
        ]
      }
    }
  ],
  updatedAt: Math.floor(Date.now() / 1000)
};

// 6. PÁGINA NOSOTROS
export const pageNosotros = {
  slug: "nosotros",
  status: "published",
  meta: {
    title: "Quiénes Somos | AutoElite",
    description: "Conoce la historia de AutoElite, una concesionaria con más de 10 años de experiencia.",
    ogImage: "assets/logo/logo.png"
  },
  nav: {
    showInNav: true,
    label: "Nosotros",
    order: 3
  },
  sections: [
    {
      id: "hero-nosotros",
      type: "hero",
      props: {
        title: "Quiénes Somos",
        subtitle: "Una concesionaria con vocación de servicio"
      }
    },
    {
      id: "richtext-nosotros",
      type: "richText",
      props: {
        html: `
          <h2>Nuestra Historia</h2>
          <p>AutoElite es una concesionaria de autos con más de 10 años de experiencia en Corrientes. Nos especializamos en la venta de vehículos usados y 0km, comprometidos con la calidad y el servicio al cliente.</p>
          <h3>Nuestra Misión</h3>
          <p>Ofrecer los mejores vehículos con financiación flexible y asesoramiento profesional.</p>
          <h3>Nuestros Valores</h3>
          <ul>
            <li><strong>Honestidad:</strong> Transparencia en cada transacción</li>
            <li><strong>Calidad:</strong> Solo vehículos en buen estado</li>
            <li><strong>Servicio:</strong> Atención personalizada y profesional</li>
          </ul>
        `,
        alignment: "left"
      }
    },
    {
      id: "testimonials-nosotros",
      type: "testimonials",
      props: {
        items: [
          {
            text: "Excelente atención y calidad de vehículos. Muy recomendado.",
            author: "Juan García",
            role: "Cliente desde 2022"
          },
          {
            text: "El mejor trato en Corrientes. Volvería mil veces.",
            author: "María López",
            role: "Cliente desde 2020"
          },
          {
            text: "Profesionales y honestos. Gracias por el vehículo.",
            author: "Carlos Rodríguez",
            role: "Cliente desde 2023"
          }
        ]
      }
    }
  ],
  updatedAt: Math.floor(Date.now() / 1000)
};

// 7. EJEMPLO DE LISTING (Vehículo)
export const exampleVehicle = {
  id: "vehiculo-001",
  status: "published",
  category: "vehicles",
  
  // Datos básicos
  title: "Chevrolet Cruze 2018",
  subtitle: "Excelente estado, bajo km",
  description: "Vehículo en perfecto estado, con película de protección, neumáticos nuevos.",
  
  // Precio y atributos
  price: 1850000,
  
  // Medios
  mainImage: "https://res.cloudinary.com/dld69jrqg/image/upload/v1/auto/vehiculo-001-main",
  media: [
    { url: "https://res.cloudinary.com/dld69jrqg/image/upload/v1/auto/vehiculo-001-1", alt: "Vista exterior" },
    { url: "https://res.cloudinary.com/dld69jrqg/image/upload/v1/auto/vehiculo-001-2", alt: "Interior" }
  ],
  
  // Atributos específicos del rubro (flexible, pueden variar)
  attributes: {
    brand: "Chevrolet",
    model: "Cruze",
    year: 2018,
    km: 45000,
    engine: "1.6 16v",
    fuel: "Nafta",
    transmission: "Manual",
    bodyType: "Sedán"
  },
  
  // Tags y categorización
  tags: ["sedán", "bajo-km", "permuta"],
  
  // Metadata
  createdAt: Math.floor(Date.now() / 1000),
  updatedAt: Math.floor(Date.now() / 1000)
};

/* ============================================
   INSTRUCCIONES PARA INSERTAR ESTOS DATOS
   
   1. Ve a Firebase Console (https://console.firebase.google.com)
   2. Selecciona tu proyecto
   3. En Firestore Database, crea la estructura manualmente O
   4. Usa el Firebase Admin CLI:
   
   // Script de ejemplo para insertarlos con Firebase Admin SDK:
   
   const admin = require('firebase-admin');
   
   admin.initializeApp({
     credential: admin.credential.cert(serviceAccountKey),
     projectId: 'tu-proyecto'
   });
   
   const db = admin.firestore();
   
   // Insertar mappings de dominios
   await db.collection('domains').doc('localhost').set({
     clientId: 'autoelite'
   });
   
   // Insertar configuración pública
   await db.collection('clients').doc('autoelite')
     .collection('settings')
     .doc('public')
     .set(clientSettingsPublic);
   
   // Insertar páginas
   await db.collection('clients').doc('autoelite')
     .collection('pages')
     .doc('home')
     .set(pageHome);
   
   // Insertar ejemplo de vehículo
   await db.collection('clients').doc('autoelite')
     .collection('content')
     .collection('listings')
     .doc('vehiculo-001')
     .set(exampleVehicle);
   
   ============================================ */
