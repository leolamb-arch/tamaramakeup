// ============================================================
// CALCULADORA DE COTIZACIÓN PARA GRUPOS Y NOVIAS — EDITABLE
// Precios en MXN. Estos valores son los por defecto; la
// administradora puede sobrescribirlos desde /admin sin código.
// ============================================================

export const calculatorConfig = {
  // Precio base del paquete principal (ej. paquete novia).
  basePrice: 3500,
  // Precio por cada acompañante / dama adicional.
  perPerson: 800,
  // Etiqueta del paquete base (editable).
  baseLabel: 'Paquete novia (base)',
  perPersonLabel: 'Acompañante / dama adicional',
  // Add-ons opcionales. perPerson = true → se cobra por cada persona.
  addons: [
    { id: 'peinado', label: 'Servicio de Peinado', price: 600, perPerson: true },
    { id: 'prueba', label: 'Prueba de Maquillaje Novia', price: 1200, perPerson: false },
  ],
  currency: { code: 'MXN', locale: 'es-MX' },
  // Textos visibles en la sección pública. {price} se reemplaza
  // dinámicamente por el precio por persona adicional.
  texts: {
    sectionLabel: 'Cotización grupal',
    title: 'Calcula tu cotización para grupos y novias',
    description:
      'Ajusta el número de acompañantes y los servicios adicionales. El total se actualiza al instante.',
    counterLabel: 'Acompañantes / damas adicionales',
    counterNote: '{price} por persona adicional.',
    addonsLabel: 'Servicios adicionales',
    breakdownLabel: 'Desglose',
    totalLabel: 'Total estimado',
    button: 'Enviar esta cotización por WhatsApp',
    whatsappGreeting: '¡Hola, {name}! Quiero una cotización para mi evento.',
    whatsappExtrasLabel: 'Acompañantes adicionales',
    whatsappTotalLabel: 'Total estimado',
    whatsappFooter: '¿Me pueden confirmar disponibilidad y detalles?',
  },
};
