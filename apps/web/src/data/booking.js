// ============================================================
// CONFIGURACIÓN DE RESERVA Y PAGO — ESTRUCTURA EDITABLE
// Cambia aquí el anticipo, los precios por servicio, las fechas
// ocupadas y la pasarela de pago sin tocar el diseño.
// ============================================================

// ────────────────────────────────────────────────────────────
// 1) PORCENTAJE DEL ANTICIPO
//    Cambia este número para ajustar qué fracción del total se
//    cobra como anticipo para apartar la fecha. Ej: 30 → 30%,
//    50 → 50%. El resto se paga el día del evento.
// ────────────────────────────────────────────────────────────
export const depositPercentage = 30;

// ────────────────────────────────────────────────────────────
// 2) FECHAS OCUPADAS
//    Lista de fechas YA AGENDADAS que deben aparecer bloqueadas
//    en el calendario (no se pueden seleccionar).
//    Formato: "YYYY-MM-DD". Agrega o quita fechas manualmente
//    conforme vayas agendando citas.
//    Ej: ['2026-09-20', '2026-10-04', '2026-12-12']
// ────────────────────────────────────────────────────────────
export const occupiedDates = [
  // '2026-09-20',
  // '2026-10-04',
];

// ────────────────────────────────────────────────────────────
// 3) PRECIO TOTAL POR SERVICIO (placeholder editable)
//    Monto total en MXN que se cobra por cada servicio. Estos
//    valores son placeholders: ajústalos a tus precios reales.
//    La clave (id) debe coincidir con el id del servicio en
//    src/data/services.js.
// ────────────────────────────────────────────────────────────
export const servicePrices = {
  social: 1000,
  novia: 3500,
  xv: 2000,
  editorial: 1800,
  eventos: 1200,
  graduaciones: 1000,
};

// ────────────────────────────────────────────────────────────
// 3.5) HORARIOS DISPONIBLES
//    Lista de horas que el cliente puede elegir al seleccionar
//    la fecha de su evento. Ajusta estos bloques a tu agenda
//    real. Formato "HH:mm" (24 h).
// ────────────────────────────────────────────────────────────
export const availableTimeSlots = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
];

// Moneda para mostrar los montos (código ISO + locale).
export const currency = { code: 'MXN', locale: 'es-MX' };

// ────────────────────────────────────────────────────────────
// 4) PASARELA DE PAGO
//    Cuando decidas conectar una pasarela real (Stripe, Mercado
//    Pago, PayPal, etc.), completa estos campos y reemplaza la
//    función `processPayment` en src/components/QuoteForm.jsx
//    (ahí está marcado con comentarios dónde pegar la llave/API
//    key y el ID del producto o monto).
// ────────────────────────────────────────────────────────────
export const paymentGateway = {
  // 'stripe' | 'mercadopago' | 'paypal' | 'mock'
  provider: 'mock',

  // 👇 PEGA AQUÍ TU API KEY / LLAVE PÚBLICA de la pasarela
  // (en producción, las llaves secretas NUNCA van en el frontend;
  //  deben vivir en un backend. Esta llave es solo la pública.)
  publicKey: '',

  // 👇 PEGA AQUÍ EL ID DEL PRODUCTO / PREFERENCE si tu pasarela
  //    lo requiere. Si cobras un monto dinámico (el anticipo),
  //    basta con enviar el monto calculado y puedes dejar esto vacío.
  productId: '',
};
