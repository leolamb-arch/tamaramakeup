// ============================================================
// CATÁLOGO DE SERVICIOS — ESTRUCTURA EDITABLE
// Agrega, elimina o reordena servicios sin tocar el diseño.
// Cada servicio: id, nombre, descripción corta, rango de
// precio, duración aproximada, lista de incluye y galería
// de imágenes (la primera se usa como portada de la tarjeta).
// ============================================================

export const services = [
  {
    id: 'social',
    name: 'Maquillaje social',
    short: 'Look impecable para fiestas, cenas y celebraciones.',
    description:
      'Un maquillaje favorecedor y de larga duración para cualquier celebración: cenas, fiestas, bautizos o reuniones especiales. Adaptamos la intensidad del look a tu estilo y al momento del día.',
    price: '$800 – $1,200 MXN',
    duration: '60–75 min aprox.',
    includes: ['Preparación de piel', 'Pestañas postizas', 'Fijación de larga duración'],
    images: [
      '',
      '',
      '',
    ],
  },
  {
    id: 'novia',
    name: 'Maquillaje de novia',
    short: 'Radiante y serena en el día más importante.',
    description:
      'Servicio premium para novias: prueba previa, maquillaje de larga duración resistente a lágrimas y retoques antes de la recepción. Un look luminoso que fotografía hermoso y se siente ligero.',
    price: '$2,500 – $4,500 MXN',
    duration: '90–120 min + prueba previa',
    includes: ['Prueba de maquillaje', 'Pestañas premium', 'Kit de retoque', 'Acompañamiento el día del evento'],
    images: [
      '',
      '',
      '',
    ],
  },
  {
    id: 'xv',
    name: 'Maquillaje de quince años',
    short: 'Fresco, juvenil y elegante para su gran noche.',
    description:
      'Un look dulce y sofisticado, pensado para durar toda la fiesta y lucir espectacular en fotos y video. Incluye prueba previa para definir juntas el estilo perfecto.',
    price: '$1,500 – $2,800 MXN',
    duration: '75–90 min + prueba previa',
    includes: ['Prueba de maquillaje', 'Pestañas postizas', 'Fijación para toda la fiesta'],
    images: [
      '',
      '',
      '',
    ],
  },
  {
    id: 'editorial',
    name: 'Maquillaje editorial y fotográfico',
    short: 'Looks de alto impacto para cámara y pasarela.',
    description:
      'Maquillaje diseñado para fotografía profesional, editoriales, pasarelas y contenido creativo. Trabajo de precisión que responde a la luz, al concepto y a la dirección de arte.',
    price: '$1,200 – $2,500 MXN',
    duration: 'Según concepto',
    includes: ['Diseño según concepto', 'Técnicas para foto y video', 'Retoques durante la sesión'],
    images: [
      '',
      '',
      '',
    ],
  },
  {
    id: 'eventos',
    name: 'Maquillaje para eventos',
    short: 'Glamour para galas, alfombras y noches especiales.',
    description:
      'Para galas, premiaciones, graduaciones de noche y eventos formales. Un acabado pulido y sofisticado que resiste horas de celebración, con opción de servicio para grupos.',
    price: '$900 – $1,500 MXN',
    duration: '60–90 min aprox.',
    includes: ['Preparación de piel', 'Pestañas postizas', 'Servicio para grupos disponible'],
    images: [
      '',
      '',
      '',
    ],
  },
  {
    id: 'graduaciones',
    name: 'Graduaciones',
    short: 'Un recuerdo fotográfico que dura para siempre.',
    description:
      'Maquillaje natural y luminoso que luce impecable bajo el birrete, en la ceremonia y en la fiesta. Paquetes especiales para graduadas y familiares.',
    price: '$800 – $1,300 MXN',
    duration: '60–75 min aprox.',
    includes: ['Preparación de piel', 'Fijación de larga duración', 'Descuento para grupos'],
    images: [
      '',
      '',
      '',
    ],
  },
];
