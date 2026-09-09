// ============================================================
// DATOS EDITABLES DEL SITIO
// Cambia aquí el nombre, enlaces, teléfonos, textos y fotos
// sin tocar el diseño. Todo el sitio lee de este archivo.
// ------------------------------------------------------------
// Nota: las imágenes de demostración de Hostinger se eliminaron.
// Los bloques que dependen de una imagen propia (hero, fotos de
// testimonios) se muestran vacíos u ocultos hasta que la
// administradora cargue una imagen propia desde /admin o edite
// el contenido guardado en Live.
// ============================================================

export const site = {
  // Nombre de la marca / maquillista
  name: 'Tamara Aldrete',
  heroTitleSuffix: 'Maquillaje profesional en Guadalajara',
  tagline: 'Resalta tu belleza natural para cada ocasión especial',
  city: 'Guadalajara, Jalisco',

  // Contacto (placeholders editables)
  whatsapp: '5213300000000', // número en formato internacional, sin espacios ni signos
  whatsappDisplay: '+52 1 33 0000 0000',
  email: 'hola@tumaquillista.mx',

  // Redes sociales (placeholders editables)
  socials: {
    whatsapp: 'https://wa.me/5213300000000',
    instagram: 'https://instagram.com/tuusuario',
    facebook: 'https://facebook.com/tupagina',
    tiktok: 'https://tiktok.com/@tuusuario',
  },

  // Cobertura
  coverage:
    'Servicio a domicilio en Guadalajara y su área metropolitana: Zapopan, Tlaquepaque, Tonalá, Tlajomulco de Zúñiga y El Salto.',

  // Imágenes del hero: vacías por defecto. La administradora carga
  // la foto principal desde /admin → Apariencia → Foto principal.
  // Sin imagen propia, el collage se oculta.
  heroImages: {
    main: '',
    mainAlt: 'Retrato de belleza con maquillaje profesional en tonos rosa empolvado',
    detail: '',
    detailAlt: 'Herramientas de maquillaje profesional en tonos rosa y dorado',
  },

  // Testimonios: la valoración (1–5 estrellas) la asigna y edita
  // únicamente la administradora desde /admin. No hay campo de
  // comentario escrito; se muestra solo la valoración visual junto
  // con el nombre, el evento y (opcional) la foto.
  testimonials: [
    { name: 'Mariana G.', event: 'Boda en Zapopan', photo: '', rating: 5 },
    { name: 'Fernanda R.', event: 'XV años en Tlaquepaque', photo: '', rating: 5 },
    { name: 'Alejandra M.', event: 'Sesión de fotos en Guadalajara', photo: '', rating: 5 },
  ],

  // Configuración del paso de ubicación en el flujo de reserva.
  // Editable sin código desde /admin → Ubicación. Define la dirección
  // del estudio, los textos de ambas opciones, las etiquetas del botón
  // de copiar, los textos de confirmación y los campos requeridos para
  // la dirección externa.
  locationConfig: {
    sectionTitle: '¿Dónde se realizará la sesión?',
    sectionInstructions:
      'Elige si prefieres venir al estudio o que yo vaya a tu ubicación.',
    studioOptionLabel: 'La sesión será en el estudio de Tamara',
    externalOptionLabel: 'La sesión será en otra ubicación',
    studio: {
      address:
        'Av. Adolfo López Mateos 1234, Col. Americana, Guadalajara, Jalisco, 44160',
      title: 'Estudio de Tamara',
      instructions:
        'Te espero en mi estudio. Copia la dirección completa para llegar sin contratiempos.',
      copyLabel: 'Copiar dirección',
      copiedLabel: '¡Dirección copiada!',
    },
    external: {
      title: 'Dirección de la sesión',
      instructions:
        'Captura la dirección completa donde se realizará la sesión. Todos los campos marcados con * son obligatorios.',
      fields: [
        { id: 'street', label: 'Calle', required: true },
        { id: 'number', label: 'Número exterior', required: true },
        { id: 'interior', label: 'Número interior / depto (opcional)', required: false },
        { id: 'neighborhood', label: 'Colonia', required: true },
        { id: 'city', label: 'Municipio / ciudad', required: true },
        { id: 'state', label: 'Estado', required: true },
        { id: 'zip', label: 'Código postal', required: true },
        { id: 'reference', label: 'Referencia para llegar (opcional)', required: false },
      ],
      confirmTitle: 'Confirma que la dirección es correcta',
      confirmInstructions:
        'Revisa con cuidado los datos antes de continuar. Una vez confirmados, se guardarán con tu reserva.',
      confirmLabel: 'Sí, la dirección es correcta',
      editLabel: 'Editar dirección',
      successMessage: 'Dirección confirmada. Puedes continuar con tu reserva.',
    },
  },

  // Aviso pequeño del footer (editable)
  footerNote:
    'Maquillaje profesional a domicilio. Agenda sujeta a disponibilidad; se recomienda reservar con 2–4 semanas de anticipación.',
};

// Año actual para el copyright
export const currentYear = new Date().getFullYear();
