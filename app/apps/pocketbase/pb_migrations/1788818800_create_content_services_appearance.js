/// <reference path="../pb_data/types.d.ts" />

// Tres colecciones para el panel de administración de contenido,
// servicios/fotografías y apariencia de la página principal.
//   • site_content  → un registro con los textos editables (JSON).
//   • services      → servicios de maquillaje con fotos (file),
//                     estado activo/inactivo, precio, duración, etc.
//   • appearance    → un registro con fuentes y paleta de colores (JSON).
// Lectura pública (la página principal los consume sin sesión);
// escritura/borrado solo para la administradora (role = admin).

migrate(
  (app) => {
    // ──────────────────────────────────────────────────────────
    // 1) site_content
    // ──────────────────────────────────────────────────────────
    let content;
    try {
      content = app.findCollectionByNameOrId("site_content");
    } catch (_) {
      content = new Collection({
        type: "base",
        name: "site_content",
        listRule: "",
        viewRule: "",
        createRule: "@request.auth.role = 'admin'",
        updateRule: "@request.auth.role = 'admin'",
        deleteRule: "@request.auth.role = 'admin'",
        fields: [
          { name: "data", type: "json", maxSize: 200000 },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
      });
      app.save(content);
    }

    // Siembra del contenido por defecto (un solo registro).
    let contentRec = null;
    try {
      contentRec = app.findFirstRecordByFilter("site_content", "id != ''");
    } catch (_) {
      contentRec = null;
    }
    if (!contentRec) {
      contentRec = new Record(content);
      contentRec.set(
        "data",
        {
          name: "Tamara Aldrete",
          heroTitleSuffix: "Maquillaje profesional en Guadalajara",
          tagline: "Resalta tu belleza natural para cada ocasión especial",
          city: "Guadalajara, Jalisco",
          heroButtonPrimary: "Agenda tu cita",
          heroButtonSecondary: "Pide una cotización",
          heroSubtext:
            "Bodas · XV años · Graduaciones · Sesiones de fotos · Eventos sociales",
          instagramHandle: "@tamara.makeupart",
          servicesLabel: "Catálogo",
          servicesTitle: "Servicios de maquillaje",
          servicesDescription:
            "Cada servicio se adapta a tu estilo, tu piel y tu evento. Toca una tarjeta para ver la galería de trabajos y los detalles.",
          quoteLabel: "Cotización",
          quoteTitle: "Reserva tu cita y aparta tu fecha",
          quoteDescription:
            "Cuéntame sobre tu evento, elige tu servicio y la fecha en el calendario. Luego paga el anticipo para apartar tu fecha. Los campos con * son obligatorios.",
          contactLabel: "Contacto",
          contactTitle: "Hablemos de tu evento",
          coverage:
            "Servicio a domicilio en Guadalajara y su área metropolitana: Zapopan, Tlaquepaque, Tonalá, Tlajomulco de Zúñiga y El Salto.",
          testimonialsTitle: "Lo que dicen mis clientas",
          footerNote:
            "Maquillaje profesional a domicilio. Agenda sujeta a disponibilidad; se recomienda reservar con 2–4 semanas de anticipación.",
          whatsapp: "5213300000000",
          whatsappDisplay: "+52 1 33 0000 0000",
          email: "hola@tumaquillista.mx",
          socials: {
            whatsapp: "https://wa.me/5213300000000",
            instagram: "https://instagram.com/tuusuario",
            facebook: "https://facebook.com/tupagina",
            tiktok: "https://tiktok.com/@tuusuario",
          },
          testimonials: [
            {
              name: "Mariana G.",
              event: "Boda en Zapopan",
              photo: "https://images.hostinger.com/6b87bec0-29f1-4e2c-b234-774d5e7c78e1.png",
              quote:
                "El maquillaje duró perfecto toda la noche, incluso después de las lágrimas y el baile. Me sentí yo misma, pero en mi mejor versión.",
            },
            {
              name: "Fernanda R.",
              event: "XV años en Tlaquepaque",
              photo: "https://images.hostinger.com/5c613179-1490-4e2b-9b19-6be4c9764f9b.png",
              quote:
                "Entendió exactamente el look que quería: fresco, juvenil y elegante. Todas preguntaron quién me había maquillado.",
            },
            {
              name: "Alejandra M.",
              event: "Sesión de fotos en Guadalajara",
              photo: "https://images.hostinger.com/b268f7ce-0221-49ed-973d-908fb51102f5.png",
              quote:
                "Puntual, cálida y muy profesional. El maquillaje se veía increíble tanto en persona como en cámara. La volveré a contratar.",
            },
          ],
        },
      );
      app.save(contentRec);
    }

    // ──────────────────────────────────────────────────────────
    // 2) services
    // ──────────────────────────────────────────────────────────
    let services;
    try {
      services = app.findCollectionByNameOrId("services");
    } catch (_) {
      services = new Collection({
        type: "base",
        name: "services",
        listRule: "",
        viewRule: "",
        createRule: "@request.auth.role = 'admin'",
        updateRule: "@request.auth.role = 'admin'",
        deleteRule: "@request.auth.role = 'admin'",
        fields: [
          { name: "slug", type: "text", max: 60 },
          { name: "name", type: "text", required: true, max: 120 },
          { name: "short", type: "text", max: 200 },
          { name: "description", type: "text", max: 1200 },
          { name: "price", type: "text", max: 60 },
          { name: "price_amount", type: "number" },
          { name: "duration", type: "text", max: 80 },
          { name: "includes", type: "json", maxSize: 4000 },
          { name: "active", type: "bool" },
          {
            name: "images",
            type: "file",
            maxSelect: 4,
            maxSize: 10485760,
            mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
          },
          { name: "cover_index", type: "number", onlyInt: true },
          { name: "legacy_images", type: "json", maxSize: 8000 },
          { name: "sort_order", type: "number", onlyInt: true },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
        indexes: [
          "CREATE UNIQUE INDEX idx_services_slug ON services (slug) WHERE slug != ''",
        ],
      });
      app.save(services);
    }

    // Siembra de los 6 servicios actuales (con imágenes heredadas como
    // URLs externas; la admin puede reemplazarlas por fotos subidas).
    const seedServices = [
      {
        slug: "social",
        name: "Maquillaje social",
        short: "Look impecable para fiestas, cenas y celebraciones.",
        description:
          "Un maquillaje favorecedor y de larga duración para cualquier celebración: cenas, fiestas, bautizos o reuniones especiales. Adaptamos la intensidad del look a tu estilo y al momento del día.",
        price: "$800 – $1,200 MXN",
        price_amount: 1000,
        duration: "60–75 min aprox.",
        includes: ["Preparación de piel", "Pestañas postizas", "Fijación de larga duración"],
        images: [
          "https://images.hostinger.com/d6a5fdba-132f-48ed-844e-d25bd4de0dc9.png",
          "https://images.hostinger.com/9688cfdd-9934-42be-a6aa-d357230a18b0.png",
          "https://images.hostinger.com/04266a74-ff0f-4900-be4c-7321523a5703.png",
        ],
      },
      {
        slug: "novia",
        name: "Maquillaje de novia",
        short: "Radiante y serena en el día más importante.",
        description:
          "Servicio premium para novias: prueba previa, maquillaje de larga duración resistente a lágrimas y retoques antes de la recepción. Un look luminoso que fotografía hermoso y se siente ligero.",
        price: "$2,500 – $4,500 MXN",
        price_amount: 3500,
        duration: "90–120 min + prueba previa",
        includes: ["Prueba de maquillaje", "Pestañas premium", "Kit de retoque", "Acompañamiento el día del evento"],
        images: [
          "https://images.hostinger.com/30205be8-aec8-4d32-94f4-b5a6db1ec526.png",
          "https://images.hostinger.com/e031053b-88a2-4c9a-bbf6-3d8cc71c11d7.png",
          "https://images.hostinger.com/3ae41748-cdae-4bc2-bcdc-ac7a0b8f3927.png",
        ],
      },
      {
        slug: "xv",
        name: "Maquillaje de quince años",
        short: "Fresco, juvenil y elegante para su gran noche.",
        description:
          "Un look dulce y sofisticado, pensado para durar toda la fiesta y lucir espectacular en fotos y video. Incluye prueba previa para definir juntas el estilo perfecto.",
        price: "$1,500 – $2,800 MXN",
        price_amount: 2000,
        duration: "75–90 min + prueba previa",
        includes: ["Prueba de maquillaje", "Pestañas postizas", "Fijación para toda la fiesta"],
        images: [
          "https://images.hostinger.com/13f95c90-962b-417e-98d9-453ccb463696.png",
          "https://images.hostinger.com/5e9cd72c-5d31-4a07-9caf-24f203cec5a7.png",
          "https://images.hostinger.com/752b5b41-06ab-4d01-83bd-9edcf1eba69b.png",
        ],
      },
      {
        slug: "editorial",
        name: "Maquillaje editorial y fotográfico",
        short: "Looks de alto impacto para cámara y pasarela.",
        description:
          "Maquillaje diseñado para fotografía profesional, editoriales, pasarelas y contenido creativo. Trabajo de precisión que responde a la luz, al concepto y a la dirección de arte.",
        price: "$1,200 – $2,500 MXN",
        price_amount: 1800,
        duration: "Según concepto",
        includes: ["Diseño según concepto", "Técnicas para foto y video", "Retoques durante la sesión"],
        images: [
          "https://images.hostinger.com/3216f43a-2b79-4c46-b221-cc6cd23d38bf.png",
          "https://images.hostinger.com/c429d93a-ce18-44cc-820d-9297ac0199ac.png",
          "https://images.hostinger.com/4ad73ab4-d7bf-493a-bb00-10cf08d25804.png",
        ],
      },
      {
        slug: "eventos",
        name: "Maquillaje para eventos",
        short: "Glamour para galas, alfombras y noches especiales.",
        description:
          "Para galas, premiaciones, graduaciones de noche y eventos formales. Un acabado pulido y sofisticado que resiste horas de celebración, con opción de servicio para grupos.",
        price: "$900 – $1,500 MXN",
        price_amount: 1200,
        duration: "60–90 min aprox.",
        includes: ["Preparación de piel", "Pestañas postizas", "Servicio para grupos disponible"],
        images: [
          "https://images.hostinger.com/0c37c5d8-a83f-48ab-965f-8d568ae61c78.png",
          "https://images.hostinger.com/d1c804ae-fd6a-4233-b269-6d5276317d7d.png",
          "https://images.hostinger.com/762d0c55-b05c-4fc8-a54b-42695cc5f23c.png",
        ],
      },
      {
        slug: "graduaciones",
        name: "Graduaciones",
        short: "Un recuerdo fotográfico que dura para siempre.",
        description:
          "Maquillaje natural y luminoso que luce impecable bajo el birrete, en la ceremonia y en la fiesta. Paquetes especiales para graduadas y familiares.",
        price: "$800 – $1,300 MXN",
        price_amount: 1000,
        duration: "60–75 min aprox.",
        includes: ["Preparación de piel", "Fijación de larga duración", "Descuento para grupos"],
        images: [
          "https://images.hostinger.com/b56b22dd-2999-4d47-9159-7eea61afddf9.png",
          "https://images.hostinger.com/c1c6b65d-64eb-41a1-b305-6fb2418483f6.png",
          "https://images.hostinger.com/a8ea795e-8857-460b-9bbd-aea9ca86b06a.png",
        ],
      },
    ];

    let existingServices = 0;
    try {
      existingServices = app.findAllRecords("services").length;
    } catch (_) {
      existingServices = 0;
    }
    if (existingServices === 0) {
      seedServices.forEach((s, i) => {
        const rec = new Record(services);
        rec.set("slug", s.slug);
        rec.set("name", s.name);
        rec.set("short", s.short);
        rec.set("description", s.description);
        rec.set("price", s.price);
        rec.set("price_amount", s.price_amount);
        rec.set("duration", s.duration);
        rec.set("includes", s.includes);
        rec.set("active", true);
        rec.set("cover_index", 0);
        rec.set("legacy_images", s.images);
        rec.set("sort_order", i);
        app.save(rec);
      });
    }

    // ──────────────────────────────────────────────────────────
    // 3) appearance
    // ──────────────────────────────────────────────────────────
    let appearance;
    try {
      appearance = app.findCollectionByNameOrId("appearance");
    } catch (_) {
      appearance = new Collection({
        type: "base",
        name: "appearance",
        listRule: "",
        viewRule: "",
        createRule: "@request.auth.role = 'admin'",
        updateRule: "@request.auth.role = 'admin'",
        deleteRule: "@request.auth.role = 'admin'",
        fields: [
          { name: "data", type: "json", maxSize: 20000 },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
      });
      app.save(appearance);
    }

    let appearanceRec = null;
    try {
      appearanceRec = app.findFirstRecordByFilter("appearance", "id != ''");
    } catch (_) {
      appearanceRec = null;
    }
    if (!appearanceRec) {
      appearanceRec = new Record(appearance);
      appearanceRec.set(
        "data",
        {
          titleFont: "Cormorant Garamond",
          bodyFont: "Jost",
          colors: {
            primary: "346 32% 42%",
            secondary: "350 32% 92%",
            background: "30 33% 96%",
            foreground: "20 18% 17%",
            gold: "38 46% 52%",
            button: "346 32% 42%",
          },
        },
      );
      app.save(appearanceRec);
    }
  },
  (app) => {
    ["site_content", "services", "appearance"].forEach((name) => {
      try {
        app.delete(app.findCollectionByNameOrId(name));
      } catch (_) {}
    });
  },
);
