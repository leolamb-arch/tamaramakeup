// ============================================================
// TUTORIAL DE BIENVENIDA — DATOS EDITABLES
// Cambia aquí los textos, destinos (selectores) y orden de los
// pasos sin tocar el componente. "target" es un selector CSS del
// elemento que se resaltará en ese paso (o null para centrar).
// ============================================================

export const tutorialSteps = [
  {
    title: '¡Bienvenida! 💕',
    body: 'Soy Tamara y me alegra mucho que estés aquí. En menos de un minuto te mostraré cómo moverte por el sitio y cómo llegar a reservar tu maquillaje. ¿Lista?',
    target: null,
  },
  {
    title: 'Explora mis servicios',
    body: 'Aquí están todos los tipos de maquillaje que ofrezco: social, novia, XV años, editorial, graduaciones y más. Toca cada tarjeta para ver fotos y detalles.',
    target: '#servicios',
  },
  {
    title: 'Pide tu cotización',
    body: '¿Te gustó algún servicio? En esta sección puedes pedir un presupuesto personalizado: eliges el servicio, la fecha y la hora, y yo te respondo con todo el detalle.',
    target: '#cotizar',
  },
  {
    title: 'Contacto y contratación',
    body: 'Cuando estés lista para agendar, aquí encuentras mis redes y datos de contacto. Es el siguiente paso para apartar tu fecha con un anticipo.',
    target: '#contacto',
  },
  {
    title: '¿Dudas? Escríbeme por WhatsApp',
    body: 'Este botón verde está siempre visible. Si tienes una duda, un requerimiento especial o algo fuera de lo común, tócalo y me escribes directo. ¡Te respondo personalmente!',
    target: '#floating-whatsapp',
  },
];

// Clave de localStorage para recordar que el tutorial ya se vio.
export const TUTORIAL_STORAGE_KEY = 'tutorialVisto';
