import React, { useState, useMemo, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  CheckCircle2,
  RotateCcw,
  CalendarDays,
  Clock,
  Lock,
  ArrowLeft,
  ArrowRight,
  Loader2,
  PartyPopper,
  MessageCircle,
  CalendarPlus,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { es } from 'date-fns/locale';
import { format, isBefore, startOfDay } from 'date-fns';
import {
  depositPercentage,
  occupiedDates,
  currency,
  paymentGateway,
  availableTimeSlots,
} from '@/data/booking';
import { formatCurrency } from '@/lib/format';
import Reveal from '@/components/Reveal';
import apiServerClient from '@/lib/apiServerClient';
import { useSiteData } from '@/contexts/SiteDataContext';
import LocationPicker from '@/components/LocationPicker';

// ============================================================
// FLUJO DE COTIZACIÓN + RESERVA CON ANTICIPO
// ------------------------------------------------------------
// Pasos:
//   1) "form"   → el cliente llena sus datos, elige servicio y
//                 fecha en el calendario interactivo.
//   2) "summary"→ resumen antes del cobro (servicio, fecha,
//                 total, anticipo, restante).
//   3) "payment"→ cobra el anticipo (mock o pasarela real).
//   4) "confirmation" → confirmación final con WhatsApp y
//                 Google Calendar.
//
// Puntos de edición (ver también src/data/booking.js):
//   • Porcentaje del anticipo ........ booking.js → depositPercentage
//   • Fechas ocupadas ................ booking.js → occupiedDates
//   • Precios por servicio ........... booking.js → servicePrices
//   • Pasarela de pago real .......... función processPayment() más abajo
// ============================================================

const inputClass =
  'h-12 rounded-xl border-input bg-background px-4 text-base focus-visible:ring-2 focus-visible:ring-ring';

const schema = z.object({
  nombre: z.string().trim().min(3, 'Escribe tu nombre completo.'),
  telefono: z
    .string()
    .trim()
    .regex(/^[0-9+\s()-]{8,18}$/, 'Escribe un teléfono válido (solo números, espacios y +).'),
  email: z
    .string()
    .trim()
    .refine((v) => v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Escribe un correo válido.')
    .optional(),
  servicio: z.string().min(1, 'Selecciona un servicio.'),
  personas: z
    .string()
    .min(1, 'Indica cuántas personas se maquillarán.')
    .refine((v) => {
      const n = Number(v);
      return Number.isInteger(n) && n >= 1 && n <= 50;
    }, 'Ingresa un número entre 1 y 50.'),
  comentarios: z.string().trim().max(500, 'Máximo 500 caracteres.').optional(),
});

function Field({ id, label, required, error, children }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {label} {required && <span className="text-primary" aria-hidden="true">*</span>}
        {required && <span className="sr-only">(obligatorio)</span>}
      </Label>
      {children}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

// Convierte un Date a "YYYY-MM-DD" (clave local, sin desfase de zona).
const toKey = (d) => format(d, 'yyyy-MM-dd');

// ============================================================
// PASARELA DE PAGO — INTEGRACIÓN REAL
// ------------------------------------------------------------
// Esta función simula el cobro del anticipo. Cuando conectes
// tu pasarela real (Stripe, Mercado Pago, PayPal…), reemplaza
// el cuerpo de esta función por la llamada a la pasarela.
//
// 👇 DÓNDE PEGAR TU LLAVE / API KEY:
//    Lee `paymentGateway.publicKey` desde src/data/booking.js
//    y pégala ahí (campo `publicKey`). En producción, las
//    llaves SECRETAS deben vivir en un backend, nunca aquí.
//
// 👇 DÓNDE PEGAR EL ID DE PRODUCTO / MONTO:
//    Si tu pasarela usa un ID de producto/preference, pégalo en
//    `paymentGateway.productId`. Si cobras un monto dinámico
//    (el anticipo calculado), basta con enviar `amount`.
//
// Ejemplo conceptual con Stripe (NO activo — solo referencia):
//   const stripe = await loadStripe(paymentGateway.publicKey);
//   const { error } = await stripe.redirectToCheckout({
//     lineItems: [{ price: paymentGateway.productId, quantity: 1 }],
//     // o, para monto dinámico, crea una PaymentIntent en tu backend
//     // que devuelva clientSecret y usa stripe.confirmCardPayment.
//     successUrl: window.location.href + '?pago=ok',
//     cancelUrl: window.location.href + '?pago=cancel',
//   });
//   return !error;
// ============================================================
async function processPayment(amount) {
  // — MODO MOCK (demostración del flujo completo) —
  // Sustituye este bloque por la integración real de tu pasarela.
  if (paymentGateway.provider === 'mock' || !paymentGateway.publicKey) {
    await new Promise((resolve) => setTimeout(resolve, 2200)); // simula "procesando"
    return { ok: true, reference: 'MOCK-' + Date.now().toString().slice(-6) };
  }

  // — MODO REAL —
  // 👇 Aquí va la llamada a la pasarela elegida usando
  //    paymentGateway.publicKey y/o paymentGateway.productId.
  //    Debe devolver { ok: true, reference } si el pago se aprueba.
  throw new Error('Pasarela de pago no implementada todavía.');
}

export default function QuoteForm() {
  const { site, activeServices, locationConfig } = useSiteData();
  const services = activeServices;
  // step: 'form' | 'summary' | 'payment' | 'confirmation'
  const [step, setStep] = useState('form');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('idle'); // 'idle' | 'processing' | 'done'
  const [paymentRef, setPaymentRef] = useState(null);
  const [paymentError, setPaymentError] = useState('');
  // Fechas ocupadas de respaldo (booking.js) mientras carga la config.
  const [blockedDates] = useState(() => [...occupiedDates]);
  const [formData, setFormData] = useState(null);
  // Datos de ubicación elegidos y confirmados por la clienta.
  const [locationData, setLocationData] = useState({ type: null, address: '', confirmed: false, fields: {} });
  const [locationError, setLocationError] = useState('');
  // Configuración de agenda desde el backend (panel de administración).
  const [scheduleConfig, setScheduleConfig] = useState(null);
  const [availableSlots, setAvailableSlots] = useState(availableTimeSlots);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [calendarEventId, setCalendarEventId] = useState(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: '',
      telefono: '',
      email: '',
      servicio: '',
      personas: '',
      comentarios: '',
    },
  });

  // Set de fechas ocupadas para deshabilitarlas en el calendario.
  const disabledSet = useMemo(() => new Set(blockedDates), [blockedDates]);

  // Deshabilita fechas pasadas, fechas bloqueadas por la admin y días de
  // la semana en los que no se trabaja (según la configuración del backend).
  const disabledMatcher = useMemo(
    () => (date) => {
      const today = startOfDay(new Date());
      if (isBefore(date, today)) return true;
      const key = toKey(date);
      if (scheduleConfig) {
        if ((scheduleConfig.blocked_dates || []).includes(key)) return true;
        if (!(scheduleConfig.active_days || []).includes(date.getDay())) return true;
        return false;
      }
      return disabledSet.has(key);
    },
    [scheduleConfig, disabledSet]
  );

  const selectedService = formData
    ? services.find((s) => s.id === formData.servicio)
    : null;

  // Cálculos de montos.
  const totals = useMemo(() => {
    const total = selectedService ? selectedService.priceAmount || 0 : 0;
    const deposit = Math.round((total * depositPercentage) / 100);
    const remaining = total - deposit;
    return { total, deposit, remaining };
  }, [selectedService]);

  // — Carga la configuración de agenda del backend (panel de la admin)
  //    para saber qué fechas deshabilitar en el calendario.
  useEffect(() => {
    let cancelled = false;
    apiServerClient
      .fetch('/schedule/config')
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setScheduleConfig(d); })
      .catch(() => { if (!cancelled) setScheduleConfig(null); });
    return () => { cancelled = true; };
  }, []);

  // — Al elegir una fecha, consulta las franjas libres reales desde el
  //    backend (configuración de agenda + citas confirmadas + Google
  //    Calendar si está conectado). Zona horaria America/Mexico_City.
  useEffect(() => {
    let cancelled = false;
    if (!selectedDate) { setAvailableSlots(availableTimeSlots); return; }
    const key = toKey(selectedDate);
    setLoadingSlots(true);
    apiServerClient
      .fetch(`/schedule/availability?date=${key}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const slots = Array.isArray(d.slots) ? d.slots : [];
        setAvailableSlots(slots);
        if (selectedTime && !slots.includes(selectedTime)) setSelectedTime('');
      })
      .catch(() => { if (!cancelled) setAvailableSlots(availableTimeSlots); })
      .finally(() => { if (!cancelled) setLoadingSlots(false); });
    return () => { cancelled = true; };
  }, [selectedDate]);

  // — Paso 1 → 2: validar formulario, fecha y ubicación confirmada.
  const onFormSubmit = (data) => {
    if (!selectedDate || !selectedTime) return;
    if (!locationData.confirmed || !locationData.address) {
      setLocationError('Confirma la ubicación de la sesión antes de continuar.');
      return;
    }
    setLocationError('');
    setFormData({ ...data, ubicacion: locationData.address, locationType: locationData.type });
    setStep('summary');
  };

  // — Paso 3: procesar el pago del anticipo.
  const handlePayDeposit = async () => {
    setPaymentStatus('processing');
    setPaymentError('');
    try {
      const result = await processPayment(totals.deposit);
      if (result.ok) {
        setPaymentRef(result.reference);
        // Registra la reserva en el backend (re-verifica disponibilidad,
        // evita duplicados y crea el evento en Google Calendar si está
        // conectado). Siempre persiste la cita en la base de datos.
        try {
          const evRes = await apiServerClient.fetch('/schedule/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              date: toKey(selectedDate),
              time: selectedTime,
              durationHours: 2,
              service: selectedService ? selectedService.name : '',
              clientName: formData.nombre,
              phone: formData.telefono,
              email: formData.email || '',
              location: formData.ubicacion,
              locationType: formData.locationType || '',
              eventType: '',
              people: Number(formData.personas),
              deposit: totals.deposit,
              total: totals.total,
              paymentRef: result.reference,
              notes: formData.comentarios || '',
            }),
          });
          const evData = await evRes.json().catch(() => ({}));
          if (evData && (evData.eventId || evData.bookingId)) {
            setCalendarEventId(evData.eventId || evData.bookingId);
          }
        } catch (e) { /* la reserva se confirma aunque falle el registro */ }
        setPaymentStatus('done');
        setStep('confirmation');
      } else {
        setPaymentStatus('idle');
        setPaymentError('No se pudo completar el pago. Intenta de nuevo.');
      }
    } catch (err) {
      setPaymentStatus('idle');
      setPaymentError(err.message || 'Ocurrió un error con el pago.');
    }
  };

  const resetAll = () => {
    reset();
    setSelectedDate(null);
    setSelectedTime('');
    setFormData(null);
    setLocationData({ type: null, address: '', confirmed: false, fields: {} });
    setLocationError('');
    setPaymentStatus('idle');
    setPaymentRef(null);
    setPaymentError('');
    setCalendarEventId(null);
    setAvailableSlots(availableTimeSlots);
    setStep('form');
  };

  // Etiqueta legible del tipo de ubicación elegida.
  const locationTypeLabel = (t) =>
    t === 'studio'
      ? (locationConfig?.studioOptionLabel || 'Estudio de Tamara')
      : t === 'external'
        ? (locationConfig?.externalOptionLabel || 'Otra ubicación')
        : 'Ubicación';

  // — Mensaje prellenado de WhatsApp con los datos de la cita.
  const whatsappUrl = useMemo(() => {
    if (!formData || !selectedService) return '#';
    const fechaTxt = format(selectedDate, "EEEE d 'de' MMMM 'de' yyyy", { locale: es });
    const msg =
      `¡Hola, ${site.name}! Acabo de apartar mi fecha para un servicio de maquillaje.\n\n` +
      `• Cliente: ${formData.nombre}\n` +
      `• Servicio: ${selectedService.name}\n` +
      `• Fecha: ${fechaTxt}\n` +
      `• Hora: ${selectedTime}\n` +
      `• Modalidad: ${locationTypeLabel(formData.locationType)}\n` +
      `• Lugar: ${formData.ubicacion}\n` +
      `• Personas: ${formData.personas}\n` +
      `• Teléfono: ${formData.telefono}${formData.email ? `\n• Correo: ${formData.email}` : ''}\n` +
      `• Total: ${formatCurrency(totals.total, currency)}\n` +
      `• Anticipo pagado: ${formatCurrency(totals.deposit, currency)}\n` +
      `• Restante el día del evento: ${formatCurrency(totals.remaining, currency)}\n` +
      `• Referencia de pago: ${paymentRef || '—'}`;
    return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(msg)}`;
  }, [formData, selectedService, selectedDate, selectedTime, totals, paymentRef, locationConfig]);

  // — Enlace "Agregar a Google Calendar".
  const googleCalendarUrl = useMemo(() => {
    if (!selectedDate) return '#';
    const fecha = toKey(selectedDate);
    // Hora de inicio elegida por el cliente (2 h de duración estimada).
    const [hh, mm] = (selectedTime || '10:00').split(':');
    const start = `${fecha}T${hh.padStart(2, '0')}${mm.padStart(2, '0')}00`;
    const endH = String((Number(hh) + 2) % 24).padStart(2, '0');
    const end = `${fecha}T${endH}${mm.padStart(2, '0')}00`;
    const text = `Cita de maquillaje — ${selectedService ? selectedService.name : ''} con ${site.name}`;
    const details =
      `Servicio: ${selectedService ? selectedService.name : ''}\n` +
      `Hora: ${selectedTime || '10:00'}\n` +
      `Modalidad: ${locationTypeLabel(formData?.locationType)}\n` +
      `Lugar: ${formData ? formData.ubicacion : ''}\n` +
      `Anticipo pagado: ${formatCurrency(totals.deposit, currency)}\n` +
      `Restante: ${formatCurrency(totals.remaining, currency)}`;
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text,
      dates: `${start}/${end}`,
      details,
      location: formData ? formData.ubicacion : '',
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }, [selectedDate, selectedTime, selectedService, formData, totals, locationConfig]);

  const fechaTxt = selectedDate
    ? format(selectedDate, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })
    : '';

  const stepOrder = ['form', 'summary', 'payment', 'confirmation'];
  const stepLabels = [
    { id: 'form', label: 'Tus datos' },
    { id: 'summary', label: 'Resumen' },
    { id: 'payment', label: 'Anticipo' },
    { id: 'confirmation', label: 'Confirmación' },
  ];

  return (
    <section id="cotizar" className="scroll-mt-20 bg-secondary/45 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
        <Reveal>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-gold">{site.quoteLabel || 'Cotización'}</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-5xl">
            {site.quoteTitle || 'Reserva tu cita y aparta tu fecha'}
          </h2>
          <p className="mt-4 text-base font-light leading-relaxed text-muted-foreground sm:text-lg">
            {site.quoteDescription || 'Cuéntame sobre tu evento, elige tu servicio y la fecha en el calendario. Luego paga el anticipo para apartar tu fecha. Los campos con * son obligatorios.'}
          </p>
        </Reveal>

        {/* Indicador de pasos */}
        <Reveal delay={0.05}>
          <ol className="mt-8 flex flex-wrap items-center gap-2 text-xs font-medium sm:text-sm">
            {stepLabels.map((p, i) => {
              const activeIdx = stepOrder.indexOf(step);
              const isActive = stepOrder.indexOf(p.id) === activeIdx;
              const isDone = stepOrder.indexOf(p.id) < activeIdx;
              return (
                <li key={p.id} className="flex items-center gap-2">
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full border text-xs transition-colors ${
                      isActive
                        ? 'border-primary bg-primary text-primary-foreground'
                        : isDone
                          ? 'border-primary bg-primary/15 text-primary'
                          : 'border-border bg-card text-muted-foreground'
                    }`}
                    aria-current={isActive ? 'step' : undefined}
                  >
                    {isDone ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                  </span>
                  <span className={isActive ? 'text-foreground' : 'text-muted-foreground'}>
                    {p.label}
                  </span>
                  {i < 3 && <span className="mx-1 text-border" aria-hidden="true">·</span>}
                </li>
              );
            })}
          </ol>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-[0_25px_60px_-35px_hsl(var(--primary)/0.45)] sm:p-10">
            {/* ───────────── PASO 1: FORMULARIO + CALENDARIO ───────────── */}
            {step === 'form' && (
              <form onSubmit={handleSubmit(onFormSubmit)} noValidate className="grid gap-5 sm:grid-cols-2">
                <Field id="nombre" label="Nombre completo" required error={errors.nombre?.message}>
                  <Input
                    id="nombre"
                    autoComplete="name"
                    placeholder="Ej. Ana Paula Hernández"
                    className={inputClass}
                    aria-invalid={!!errors.nombre}
                    {...register('nombre')}
                  />
                </Field>

                <Field id="telefono" label="Teléfono o WhatsApp" required error={errors.telefono?.message}>
                  <Input
                    id="telefono"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="Ej. 33 1234 5678"
                    className={inputClass}
                    aria-invalid={!!errors.telefono}
                    {...register('telefono')}
                  />
                </Field>

                <Field id="email" label="Correo electrónico (opcional)" error={errors.email?.message}>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="tucorreo@ejemplo.com"
                    className={inputClass}
                    aria-invalid={!!errors.email}
                    {...register('email')}
                  />
                </Field>

                <Field id="servicio" label="Servicio de interés" required error={errors.servicio?.message}>
                  <Controller
                    control={control}
                    name="servicio"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="servicio" className={inputClass} aria-invalid={!!errors.servicio}>
                          <SelectValue placeholder="Selecciona un servicio" />
                        </SelectTrigger>
                        <SelectContent>
                          {services.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>

                <Field id="personas" label="Personas a maquillar" required error={errors.personas?.message}>
                  <Input
                    id="personas"
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max="50"
                    placeholder="Ej. 1"
                    className={inputClass}
                    aria-invalid={!!errors.personas}
                    {...register('personas')}
                  />
                </Field>

                <div className="sm:col-span-2">
                  <LocationPicker
                    config={locationConfig}
                    value={locationData}
                    onChange={(v) => { setLocationData(v); if (v.confirmed) setLocationError(''); }}
                  />
                  {locationError && (
                    <p role="alert" className="mt-2 text-sm text-destructive">{locationError}</p>
                  )}
                </div>

                {/* Calendario interactivo de fecha */}
                <div className="sm:col-span-2">
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm font-medium">
                      Fecha del evento <span className="text-primary" aria-hidden="true">*</span>
                      <span className="sr-only">(obligatorio)</span>
                    </Label>
                    <p className="text-xs font-light text-muted-foreground">
                      Elige una fecha disponible. Las fechas ya ocupadas aparecen bloqueadas y no
                      puedes seleccionar fechas pasadas.
                    </p>
                    <div className="mt-2 flex justify-center rounded-2xl border border-border bg-background/60 p-4">
                      <Calendar
                        mode="single"
                        locale={es}
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={disabledMatcher}
                        fromDate={startOfDay(new Date())}
                        weekStartsOn={1}
                        aria-label="Calendario de fechas disponibles"
                        classNames={{
                          root: 'w-full sm:w-auto',
                          months: 'flex flex-col',
                          month: 'flex w-full flex-col gap-3',
                          day: 'aspect-square h-9 w-9 p-0 text-sm sm:h-10 sm:w-10',
                        }}
                      />
                    </div>
                    {selectedDate ? (
                      <p className="mt-3 inline-flex items-center gap-2 self-start rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                        <CheckCircle2 className="date-confirm-icon h-4 w-4" aria-hidden="true" />
                        Fecha confirmada: <strong className="font-semibold capitalize">{fechaTxt}</strong>
                      </p>
                    ) : (
                      <p className="mt-3 inline-flex items-center gap-2 self-start rounded-full bg-secondary px-4 py-2 text-sm font-light text-muted-foreground">
                        <CalendarDays className="h-4 w-4" aria-hidden="true" />
                        Selecciona una fecha en el calendario
                      </p>
                    )}
                  </div>
                </div>

                {/* Selector de hora */}
                <div className="sm:col-span-2">
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm font-medium">
                      Hora del evento <span className="text-primary" aria-hidden="true">*</span>
                      <span className="sr-only">(obligatorio)</span>
                    </Label>
                    <p className="text-xs font-light text-muted-foreground">
                      Elige la hora de tu cita. Solo se muestran los bloques disponibles.
                    </p>
                    {loadingSlots ? (
                      <p className="mt-2 inline-flex items-center gap-2 self-start rounded-full bg-secondary px-4 py-2 text-sm font-light text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Consultando disponibilidad…
                      </p>
                    ) : availableSlots.length === 0 ? (
                      <p className="mt-2 inline-flex items-center gap-2 self-start rounded-full bg-destructive/10 px-4 py-2 text-sm text-destructive">
                        No hay horarios disponibles este día. Elige otra fecha.
                      </p>
                    ) : (
                    <div
                      role="radiogroup"
                      aria-label="Hora del evento"
                      className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5"
                    >
                      {availableSlots.map((slot) => {
                        const isActive = selectedTime === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            role="radio"
                            aria-checked={isActive}
                            onClick={() => setSelectedTime(slot)}
                            className={`flex h-11 items-center justify-center gap-1.5 rounded-xl border text-sm font-medium transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                              isActive
                                ? 'border-primary bg-primary text-primary-foreground shadow-[0_10px_25px_-12px_hsl(var(--primary)/0.8)]'
                                : 'border-border bg-background text-foreground hover:border-primary/40 hover:bg-secondary'
                            }`}
                          >
                            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                    )}
                    {selectedTime && (
                      <p className="mt-3 inline-flex items-center gap-2 self-start rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                        <Clock className="h-4 w-4" aria-hidden="true" />
                        Hora confirmada: <strong className="font-semibold">{selectedTime}</strong>
                      </p>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <Field id="comentarios" label="Comentarios sobre el look deseado (opcional)" error={errors.comentarios?.message}>
                    <Textarea
                      id="comentarios"
                      rows={3}
                      placeholder="Cuéntame qué estilo te imaginas: natural, glam, tonos cálidos, referencias…"
                      className="rounded-xl border-input bg-background px-4 py-3 text-base focus-visible:ring-2 focus-visible:ring-ring"
                      aria-invalid={!!errors.comentarios}
                      {...register('comentarios')}
                    />
                  </Field>
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={!selectedDate || !selectedTime || !locationData.confirmed}
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-primary text-base font-medium text-primary-foreground shadow-[0_16px_35px_-14px_hsl(var(--primary)/0.8)] transition-all hover:bg-primary/90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Ver resumen y continuar
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                  {(!selectedDate || !selectedTime || !locationData.confirmed) && (
                    <p className="mt-2 text-center text-xs text-muted-foreground">
                      Selecciona una fecha, una hora y confirma la ubicación para continuar.
                    </p>
                  )}
                </div>
              </form>
            )}

            {/* ───────────── PASO 2: RESUMEN ANTES DEL COBRO ───────────── */}
            {step === 'summary' && selectedService && (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                    Resumen de tu reserva
                  </h3>
                  <p className="mt-2 text-sm font-light text-muted-foreground">
                    Revisa los detalles antes de pagar el anticipo y apartar tu fecha.
                  </p>
                </div>

                <dl className="divide-y divide-border rounded-2xl border border-border">
                  <SummaryRow label="Cliente" value={formData.nombre} />
                  <SummaryRow label="Servicio" value={selectedService.name} />
                  <SummaryRow label="Fecha" value={<span className="capitalize">{fechaTxt}</span>} />
                  <SummaryRow label="Hora" value={selectedTime} />
                  <SummaryRow label="Modalidad" value={locationTypeLabel(formData.locationType)} />
                  <SummaryRow label="Ubicación" value={formData.ubicacion} />
                  <SummaryRow label="Personas a maquillar" value={formData.personas} />
                  {formData.email && <SummaryRow label="Correo" value={formData.email} />}
                </dl>

                {/* Montos */}
                <div className="rounded-2xl bg-secondary/60 p-5 sm:p-6">
                  <h4 className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
                    Detalle del pago
                  </h4>
                  <dl className="mt-4 flex flex-col gap-3 text-sm">
                    <div className="flex items-center justify-between">
                      <dt className="font-light text-muted-foreground">Monto total del servicio</dt>
                      <dd className="font-medium">{formatCurrency(totals.total, currency)}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="font-light text-muted-foreground">
                        Anticipo ({depositPercentage}%)
                      </dt>
                      <dd className="font-semibold text-primary">
                        {formatCurrency(totals.deposit, currency)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between border-t border-border pt-3">
                      <dt className="font-light text-muted-foreground">Restante el día del evento</dt>
                      <dd className="font-medium">{formatCurrency(totals.remaining, currency)}</dd>
                    </div>
                  </dl>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={() => setStep('payment')}
                    className="flex h-14 flex-1 items-center justify-center gap-2 rounded-full bg-primary text-base font-medium text-primary-foreground shadow-[0_16px_35px_-14px_hsl(var(--primary)/0.8)] transition-all hover:bg-primary/90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <Lock className="h-4 w-4" aria-hidden="true" />
                    Pagar anticipo y apartar mi fecha
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('form')}
                    className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-border px-6 text-base font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    Regresar
                  </button>
                </div>
              </div>
            )}

            {/* ───────────── PASO 3: COBRO DEL ANTICIPO ───────────── */}
            {step === 'payment' && (
              <div className="flex flex-col items-center gap-6 py-6 text-center">
                {paymentStatus === 'processing' ? (
                  <>
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="font-display text-2xl font-semibold">Procesando pago…</h3>
                      <p className="mt-2 max-w-sm text-sm font-light text-muted-foreground">
                        Estamos procesando tu anticipo de{' '}
                        <strong className="font-medium">{formatCurrency(totals.deposit, currency)}</strong>.
                        No cierres esta ventana.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                      <Lock className="h-8 w-8 text-primary" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="font-display text-2xl font-semibold sm:text-3xl">
                        Paga tu anticipo de {formatCurrency(totals.deposit, currency)}
                      </h3>
                      <p className="mt-2 max-w-md text-sm font-light text-muted-foreground">
                        Al pagar el anticipo ({depositPercentage}% del total) se aparta tu fecha del{' '}
                        <strong className="font-medium capitalize">{fechaTxt}</strong> y se bloquea
                        para otros clientes.
                      </p>
                    </div>

                    {paymentError && (
                      <p role="alert" className="rounded-full bg-destructive/10 px-4 py-2 text-sm text-destructive">
                        {paymentError}
                      </p>
                    )}

                    {paymentGateway.provider === 'mock' && (
                      <p className="rounded-full bg-secondary px-4 py-2 text-xs font-light text-muted-foreground">
                        Modo demostración: el pago es simulado para que pruebes la experiencia.
                      </p>
                    )}

                    <div className="flex w-full flex-col gap-3 sm:flex-row-reverse">
                      <button
                        type="button"
                        onClick={handlePayDeposit}
                        className="flex h-14 flex-1 items-center justify-center gap-2 rounded-full bg-primary text-base font-medium text-primary-foreground shadow-[0_16px_35px_-14px_hsl(var(--primary)/0.8)] transition-all hover:bg-primary/90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <Lock className="h-4 w-4" aria-hidden="true" />
                        Pagar {formatCurrency(totals.deposit, currency)}
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep('summary')}
                        className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-border px-6 text-base font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Regresar
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ───────────── PASO 4: CONFIRMACIÓN FINAL ───────────── */}
            {step === 'confirmation' && selectedService && (
              <div className="flex flex-col items-center gap-6 py-4 text-center" role="status">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
                  <PartyPopper className="h-8 w-8 text-primary" aria-hidden="true" />
                </span>

                <div>
                  <h3 className="font-display text-3xl font-semibold tracking-tight">
                    ¡Tu fecha está apartada, {formData.nombre.split(' ')[0]}!
                  </h3>
                  <p className="mt-3 max-w-md text-base font-light leading-relaxed text-muted-foreground">
                    Gracias por confiar en mí para tu evento. Me emociona mucho ser parte de tu día
                    especial. Te enviaré los detalles por WhatsApp y estaré en contacto para coordinar
                    tu prueba previa. ¡Nos vemos pronto!
                  </p>
                  <p className="mt-2 text-sm font-medium text-primary">— {site.name}</p>
                </div>

                {/* Resumen de la cita */}
                <dl className="w-full divide-y divide-border rounded-2xl border border-border text-left">
                  <SummaryRow label="Servicio" value={selectedService.name} />
                  <SummaryRow label="Fecha" value={<span className="capitalize">{fechaTxt}</span>} />
                  <SummaryRow label="Hora" value={selectedTime} />
                  <SummaryRow label="Modalidad" value={locationTypeLabel(formData.locationType)} />
                  <SummaryRow label="Lugar" value={formData.ubicacion} />
                  <SummaryRow
                    label="Anticipo pagado"
                    value={
                      <span className="font-semibold text-primary">
                        {formatCurrency(totals.deposit, currency)}
                      </span>
                    }
                  />
                  <SummaryRow
                    label="Restante el día del evento"
                    value={formatCurrency(totals.remaining, currency)}
                  />
                  {paymentRef && <SummaryRow label="Referencia de pago" value={paymentRef} />}
                  {calendarEventId && (
                    <SummaryRow label="Evento en Google Calendar" value="Creado ✓" />
                  )}
                </dl>

                {/* Acciones: WhatsApp + Google Calendar */}
                <div className="flex w-full flex-col gap-3 sm:flex-row">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-14 flex-1 items-center justify-center gap-2 rounded-full bg-primary text-base font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    Enviar confirmación por WhatsApp
                  </a>
                  <a
                    href={googleCalendarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-14 flex-1 items-center justify-center gap-2 rounded-full border border-primary/35 bg-card text-base font-medium text-primary transition-colors hover:bg-secondary active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <CalendarPlus className="h-4 w-4" aria-hidden="true" />
                    Agregar a Google Calendar
                  </a>
                </div>

                <button
                  type="button"
                  onClick={resetAll}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Hacer otra reserva
                </button>
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-3.5">
      <dt className="text-sm font-light text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}
