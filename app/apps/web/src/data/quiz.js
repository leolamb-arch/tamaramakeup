// ============================================================
// QUIZ "ENCUENTRA TU LOOK IDEAL" — ESTRUCTURA EDITABLE
// 2 preguntas; la primera opción de cada pregunta lleva el `service`
// (id del servicio recomendado, debe coincidir con src/data/services.js).
// Estos valores son los por defecto; la administradora puede
// sobrescribirlos desde /admin sin código.
// ============================================================

export const quizQuestions = [
  {
    id: 'evento',
    question: '¿Qué tipo de evento tienes?',
    options: [
      { id: 'boda', label: 'Boda', service: 'novia' },
      { id: 'noche', label: 'Fiesta de Noche', service: 'eventos' },
      { id: 'dia', label: 'Evento de Día', service: 'social' },
      { id: 'fotos', label: 'Sesión de Fotos', service: 'editorial' },
    ],
  },
  {
    id: 'extras',
    question: '¿Necesitas peinado o servicios para acompañantes?',
    options: [
      { id: 'solo', label: 'Solo maquillaje' },
      { id: 'peinado', label: 'Maquillaje y Peinado' },
      { id: 'solopeinado', label: 'Solo Peinado' },
      { id: 'grupal', label: 'Paquete Grupal' },
    ],
  },
];

// Texto adicional según la respuesta de "extras".
export const extrasNote = {
  solo: 'Solo maquillaje, sin servicios adicionales.',
  peinado: 'Incluye peinado además del maquillaje.',
  solopeinado: 'Solo peinado, sin maquillaje.',
  grupal: 'Paquete grupal: pregunta por descuentos para acompañantes.',
};

// Textos visibles en la sección pública del quiz.
export const quizTexts = {
  sectionLabel: 'Quiz interactivo',
  title: 'Encuentra tu look ideal',
  description: 'Responde 2 preguntas y te recomiendo el servicio perfecto para tu evento.',
  button: 'Ver mi look recomendado',
  noteIncomplete: 'Responde las 2 preguntas para ver tu recomendación.',
  resultLabel: 'Tu look ideal',
  priceLabel: 'Precio estimado',
  durationLabel: 'Tiempo requerido',
  servicesLabel: 'Servicios',
  ctaButton: 'Reservar este look',
  resetButton: 'Volver a responder',
};
