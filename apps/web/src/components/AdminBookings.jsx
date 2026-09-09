import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Loader2,
  CalendarPlus,
  Apple,
  List,
  X,
  AlertTriangle,
  Link2,
  Unlink,
  RefreshCw,
  Info,
} from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import apiServerClient from '@/lib/apiServerClient';
import { formatCurrency } from '@/lib/format';

const TZ = 'America/Mexico_City';
const WEEK_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTH_LABELS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const STATUS_LABEL = {
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
};
const DEPOSIT_LABEL = {
  paid: 'Anticipo pagado',
  pending: 'Anticipo pendiente',
  refunded: 'Anticipo reembolsado',
};
const LOCATION_TYPE_LABEL = {
  studio: 'Estudio de Tamara',
  external: 'Otra ubicación',
};

function pad(n) {
  return String(n).padStart(2, '0');
}

function durationMinutes(b) {
  const h = Number(b.duration_hours);
  if (Number.isFinite(h) && h > 0) return Math.round(h * 60);
  return 120;
}

function endTime(date, time, mins) {
  const [hh, mm] = String(time || '00:00').split(':').map(Number);
  const total = hh * 60 + mm + mins;
  const eh = Math.floor(total / 60) % 24;
  const em = total % 60;
  return { date, time: `${pad(eh)}:${pad(em)}` };
}

function toUtcIcsStamp(date, time) {
  // America/Mexico_City = UTC-6 fijo → sumar 6 h para UTC
  const [y, mo, d] = date.split('-').map(Number);
  const [h, m] = String(time || '00:00').split(':').map(Number);
  const ms = Date.UTC(y, mo - 1, d, h + 6, m, 0);
  const dt = new Date(ms);
  return (
    dt.getUTCFullYear() +
    pad(dt.getUTCMonth() + 1) +
    pad(dt.getUTCDate()) +
    'T' +
    pad(dt.getUTCHours()) +
    pad(dt.getUTCMinutes()) +
    pad(dt.getUTCSeconds()) +
    'Z'
  );
}

function escapeIcs(text) {
  return String(text || '')
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function eventTitle(b) {
  return `${b.service || 'Reserva'} — ${b.client_name || 'Cliente'}`;
}

function eventDescription(b) {
  const lines = [
    `Cliente: ${b.client_name || '—'}`,
    b.phone ? `Teléfono: ${b.phone}` : '',
    b.email ? `Correo: ${b.email}` : '',
    `Servicio: ${b.service || '—'}`,
    b.event_type ? `Tipo de evento: ${b.event_type}` : '',
    b.location_type ? `Modalidad: ${LOCATION_TYPE_LABEL[b.location_type] || b.location_type}` : '',
    b.location ? `Dirección / ubicación: ${b.location}` : '',
    b.people ? `Personas: ${b.people}` : '',
    `Estado de la reserva: ${STATUS_LABEL[b.status] || b.status || '—'}`,
    `Estado del anticipo: ${DEPOSIT_LABEL[b.deposit_status] || b.deposit_status || '—'}`,
    b.deposit != null ? `Anticipo: ${b.deposit} MXN` : '',
    b.total != null ? `Total: ${b.total} MXN` : '',
    b.payment_ref ? `Referencia de pago: ${b.payment_ref}` : '',
    b.notes ? `Notas: ${b.notes}` : '',
  ].filter(Boolean);
  return lines.join('\n');
}

function buildIcs(bookings) {
  const now = new Date();
  const stamp =
    now.getUTCFullYear() +
    pad(now.getUTCMonth() + 1) +
    pad(now.getUTCDate()) +
    'T' +
    pad(now.getUTCHours()) +
    pad(now.getUTCMinutes()) +
    pad(now.getUTCSeconds()) +
    'Z';

  const events = bookings
    .map((b) => {
      const mins = durationMinutes(b);
      const end = endTime(b.event_date, b.event_time, mins);
      const uid = `booking-${b.id}@tamaraaldrete`;
      return [
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${toUtcIcsStamp(b.event_date, b.event_time)}`,
        `DTEND:${toUtcIcsStamp(end.date, end.time)}`,
        `SUMMARY:${escapeIcs(eventTitle(b))}`,
        `DESCRIPTION:${escapeIcs(eventDescription(b))}`,
        b.location ? `LOCATION:${escapeIcs(b.location)}` : '',
        `TZID:${TZ}`,
        'END:VEVENT',
      ]
        .filter(Boolean)
        .join('\r\n');
    })
    .join('\r\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Tamara Aldrete//Reservas//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-TIMEZONE:${TZ}`,
    events,
    'END:VCALENDAR',
  ].join('\r\n');
}

function downloadIcs(bookings, filename) {
  const ics = buildIcs(bookings);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'reservas.ics';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function googleTemplateUrl(b) {
  const mins = durationMinutes(b);
  const end = endTime(b.event_date, b.event_time, mins);
  const start = `${b.event_date.replace(/-/g, '')}T${String(b.event_time).replace(':', '')}00`;
  const finish = `${end.date.replace(/-/g, '')}T${String(end.time).replace(':', '')}00`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: eventTitle(b),
    dates: `${start}/${finish}`,
    details: eventDescription(b),
    location: b.location || '',
    ctz: TZ,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function isExportedGoogle(b) {
  return !!(b.exported_google || b.google_event_id);
}

function isExportedApple(b) {
  return !!b.exported_apple;
}

function monthMatrix(year, month) {
  // month 0-based
  const first = new Date(Date.UTC(year, month, 1));
  const startDow = first.getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${year}-${pad(month + 1)}-${pad(d)}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [checked, setChecked] = useState(() => new Set());
  const [view, setView] = useState('calendar'); // calendar | list
  const now = new Date();
  const [cursor, setCursor] = useState({
    y: now.getFullYear(),
    m: now.getMonth(),
  });
  const [busy, setBusy] = useState('');
  const [toast, setToast] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const list = await pb.collection('bookings').getFullList({
        sort: '-event_date,-event_time',
      });
      setBookings(list);
    } catch (e) {
      setError(
        e?.message ||
          'No se pudieron cargar las reservas. Verifica tu sesión de administradora.',
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const byDate = useMemo(() => {
    const map = {};
    for (const b of bookings) {
      const k = b.event_date;
      if (!map[k]) map[k] = [];
      map[k].push(b);
    }
    return map;
  }, [bookings]);

  const selected = useMemo(
    () => bookings.find((b) => b.id === selectedId) || null,
    [bookings, selectedId],
  );

  const selectedList = useMemo(
    () => bookings.filter((b) => checked.has(b.id)),
    [bookings, checked],
  );

  const cells = useMemo(
    () => monthMatrix(cursor.y, cursor.m),
    [cursor.y, cursor.m],
  );

  const markExport = async (ids, kind) => {
    const field = kind === 'google' ? 'exported_google' : 'exported_apple';
    await Promise.all(
      ids.map((id, i) =>
        pb.collection('bookings').update(
          id,
          { [field]: true },
          { requestKey: `export-${kind}-${id}-${i}` },
        ),
      ),
    );
    setBookings((prev) =>
      prev.map((b) => (ids.includes(b.id) ? { ...b, [field]: true } : b)),
    );
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2800);
  };

  const exportAppleOne = async (b) => {
    if (isExportedApple(b)) {
      showToast('Esta reserva ya se exportó a Apple Calendar.');
      // Aun así permite re-descargar el .ics sin crear un “duplicado” de estado.
    }
    setBusy(`apple-${b.id}`);
    try {
      downloadIcs([b], `reserva-${b.event_date}-${b.event_time}.ics`);
      if (!isExportedApple(b)) await markExport([b.id], 'apple');
      showToast('Archivo .ics descargado para Apple Calendar.');
    } catch (e) {
      setError(e?.message || 'No se pudo exportar a Apple Calendar.');
    }
    setBusy('');
  };

  const exportGoogleOne = async (b) => {
    if (isExportedGoogle(b)) {
      showToast('Esta reserva ya está en Google Calendar (o ya se exportó).');
      // Abrir de nuevo el template solo si no hay event id real; evita duplicados.
      if (b.google_event_id) return;
    }
    setBusy(`google-${b.id}`);
    try {
      window.open(googleTemplateUrl(b), '_blank', 'noopener,noreferrer');
      if (!isExportedGoogle(b)) await markExport([b.id], 'google');
      showToast('Evento abierto en Google Calendar.');
    } catch (e) {
      setError(e?.message || 'No se pudo exportar a Google Calendar.');
    }
    setBusy('');
  };

  const exportAppleBulk = async () => {
    const list = selectedList.length ? selectedList : bookings;
    if (!list.length) return;
    const fresh = list.filter((b) => !isExportedApple(b));
    setBusy('apple-bulk');
    try {
      downloadIcs(
        list,
        selectedList.length ? 'reservas-seleccionadas.ics' : 'todas-las-reservas.ics',
      );
      if (fresh.length) await markExport(fresh.map((b) => b.id), 'apple');
      showToast(
        fresh.length
          ? `Exportadas ${list.length} reservas a .ics (${fresh.length} nuevas).`
          : `Archivo .ics descargado. Las ${list.length} ya estaban exportadas a Apple.`,
      );
    } catch (e) {
      setError(e?.message || 'No se pudo exportar el lote a Apple Calendar.');
    }
    setBusy('');
  };

  const exportGoogleBulk = async () => {
    const list = selectedList.length ? selectedList : bookings;
    if (!list.length) return;
    // Solo las no exportadas para evitar duplicados en Google.
    const fresh = list.filter((b) => !isExportedGoogle(b));
    if (!fresh.length) {
      showToast('Todas las seleccionadas ya fueron exportadas a Google Calendar.');
      return;
    }
    setBusy('google-bulk');
    try {
      // Abre la primera en pestaña; el resto se descarga como .ics multi-evento
      // (Google no permite bulk template URLs de forma fiable).
      window.open(googleTemplateUrl(fresh[0]), '_blank', 'noopener,noreferrer');
      if (fresh.length > 1) {
        downloadIcs(fresh.slice(1), 'reservas-google.ics');
      }
      await markExport(fresh.map((b) => b.id), 'google');
      showToast(
        fresh.length === 1
          ? '1 reserva abierta en Google Calendar.'
          : `1 abierta en Google y ${fresh.length - 1} descargadas en .ics (importables).`,
      );
    } catch (e) {
      setError(e?.message || 'No se pudo exportar el lote a Google Calendar.');
    }
    setBusy('');
  };

  const toggleCheck = (id) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (checked.size === bookings.length) setChecked(new Set());
    else setChecked(new Set(bookings.map((b) => b.id)));
  };

  const prevMonth = () =>
    setCursor((c) =>
      c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 },
    );
  const nextMonth = () =>
    setCursor((c) =>
      c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 },
    );

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-[0_15px_40px_-30px_hsl(var(--primary)/0.35)] sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">
              Calendario y reservas
            </h2>
            <p className="mt-1 text-xs font-light text-muted-foreground">
              Reservas reales del backend. Zona horaria: Ciudad de México. Solo administradora.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setView('calendar')}
            className={`inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors ${
              view === 'calendar'
                ? 'bg-primary text-primary-foreground'
                : 'border border-border text-foreground hover:bg-secondary'
            }`}
          >
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" /> Calendario
          </button>
          <button
            type="button"
            onClick={() => setView('list')}
            className={`inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors ${
              view === 'list'
                ? 'bg-primary text-primary-foreground'
                : 'border border-border text-foreground hover:bg-secondary'
            }`}
          >
            <List className="h-3.5 w-3.5" aria-hidden="true" /> Lista
          </button>
        </div>
      </div>

      {/* Conexión con Google Calendar */}
      <GoogleConnection />

      {/* Acciones masivas */}
      <div className="mt-4 flex flex-col gap-2 rounded-xl border border-border bg-background/60 p-3 sm:flex-row sm:flex-wrap sm:items-center">
        <p className="text-xs font-light text-muted-foreground sm:mr-auto">
          {checked.size
            ? `${checked.size} seleccionada${checked.size === 1 ? '' : 's'}`
            : `${bookings.length} reserva${bookings.length === 1 ? '' : 's'} en total`}
        </p>
        <button
          type="button"
          onClick={toggleAll}
          className="inline-flex h-10 items-center justify-center rounded-full border border-border px-3 text-xs font-medium transition-colors hover:bg-secondary"
        >
          {checked.size === bookings.length && bookings.length
            ? 'Quitar selección'
            : 'Seleccionar todas'}
        </button>
        <button
          type="button"
          disabled={busy.startsWith('google') || !bookings.length}
          onClick={exportGoogleBulk}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-primary px-3 text-xs font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
        >
          {busy === 'google-bulk' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <CalendarPlus className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          Google {checked.size ? `(${checked.size})` : '(todas)'}
        </button>
        <button
          type="button"
          disabled={busy.startsWith('apple') || !bookings.length}
          onClick={exportAppleBulk}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium transition-colors hover:bg-secondary disabled:opacity-50"
        >
          {busy === 'apple-bulk' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          Apple .ics {checked.size ? `(${checked.size})` : '(todas)'}
        </button>
      </div>

      {toast && (
        <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> {toast}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 inline-flex items-center gap-2 rounded-full bg-destructive/10 px-4 py-2 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" /> {error}
        </p>
      )}

      {loading ? (
        <p className="mt-6 inline-flex items-center gap-2 text-sm font-light text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Cargando reservas…
        </p>
      ) : bookings.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm font-light text-muted-foreground">
          Aún no hay reservas registradas en el backend.
        </p>
      ) : (
        <div className="mt-5 grid gap-5 lg:grid-cols-5">
          <div className="lg:col-span-3">
            {view === 'calendar' ? (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={prevMonth}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border transition-colors hover:bg-secondary"
                    aria-label="Mes anterior"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <p className="font-display text-base font-semibold">
                    {MONTH_LABELS[cursor.m]} {cursor.y}
                  </p>
                  <button
                    type="button"
                    onClick={nextMonth}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border transition-colors hover:bg-secondary"
                    aria-label="Mes siguiente"
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {WEEK_LABELS.map((d) => (
                    <div key={d} className="py-1">{d}</div>
                  ))}
                </div>
                <div className="mt-1 grid grid-cols-7 gap-1">
                  {cells.map((key, i) => {
                    if (!key) {
                      return <div key={`e-${i}`} className="min-h-[64px] rounded-lg bg-muted/30" />;
                    }
                    const dayBookings = byDate[key] || [];
                    const dayNum = Number(key.slice(-2));
                    const isToday =
                      key ===
                      `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
                    return (
                      <div
                        key={key}
                        className={`min-h-[64px] rounded-lg border p-1 ${
                          isToday
                            ? 'border-primary/50 bg-primary/5'
                            : 'border-border bg-background'
                        }`}
                      >
                        <p className="px-1 text-[11px] font-medium text-muted-foreground">
                          {dayNum}
                        </p>
                        <div className="mt-0.5 flex flex-col gap-0.5">
                          {dayBookings.slice(0, 3).map((b) => (
                            <button
                              key={b.id}
                              type="button"
                              onClick={() => setSelectedId(b.id)}
                              className={`truncate rounded px-1 py-0.5 text-left text-[10px] font-medium leading-tight transition-colors ${
                                selectedId === b.id
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-secondary text-foreground hover:bg-primary/15'
                              }`}
                              title={`${b.event_time} · ${b.client_name}`}
                            >
                              {b.event_time} {b.client_name?.split(' ')[0]}
                            </button>
                          ))}
                          {dayBookings.length > 3 && (
                            <span className="px-1 text-[10px] text-muted-foreground">
                              +{dayBookings.length - 3} más
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Lista (siempre visible en vista lista; en calendario también debajo en móvil) */}
            <div className={view === 'list' ? 'mt-0' : 'mt-5 lg:mt-6'}>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-medium">Lista de reservas</h3>
                <button
                  type="button"
                  onClick={load}
                  className="text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                  Actualizar
                </button>
              </div>
              <ul className="flex max-h-[420px] flex-col gap-2 overflow-y-auto pr-1">
                {bookings.map((b) => (
                  <li key={b.id}>
                    <div
                      className={`flex items-start gap-2 rounded-xl border p-3 transition-colors ${
                        selectedId === b.id
                          ? 'border-primary/40 bg-primary/5'
                          : 'border-border bg-background hover:bg-secondary/40'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked.has(b.id)}
                        onChange={() => toggleCheck(b.id)}
                        className="mt-1 h-4 w-4 accent-[hsl(var(--primary))]"
                        aria-label={`Seleccionar reserva de ${b.client_name}`}
                      />
                      <button
                        type="button"
                        onClick={() => setSelectedId(b.id)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-sm font-medium">
                            {b.event_date} · {b.event_time}
                          </span>
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-foreground">
                            {STATUS_LABEL[b.status] || b.status || '—'}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                              b.deposit_status === 'paid'
                                ? 'bg-primary/15 text-primary'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {DEPOSIT_LABEL[b.deposit_status] ||
                              (b.payment_ref ? 'Anticipo pagado' : 'Anticipo pendiente')}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-sm font-light text-foreground">
                          {b.service || 'Servicio'} — {b.client_name || 'Sin nombre'}
                        </p>
                        <p className="mt-0.5 text-xs font-light text-muted-foreground">
                          Duración: {durationMinutes(b)} min
                          {(isExportedGoogle(b) || isExportedApple(b)) && (
                            <>
                              {' · '}
                              {isExportedGoogle(b) && (
                                <span className="text-primary">Google ✓</span>
                              )}
                              {isExportedGoogle(b) && isExportedApple(b) && ' · '}
                              {isExportedApple(b) && (
                                <span className="text-primary">Apple ✓</span>
                              )}
                            </>
                          )}
                        </p>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Detalle */}
          <div className="lg:col-span-2">
            {selected ? (
              <div className="sticky top-20 rounded-xl border border-border bg-background p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-gold">
                      Detalle de reserva
                    </p>
                    <h3 className="mt-1 font-display text-lg font-semibold leading-tight">
                      {selected.client_name || 'Sin nombre'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground"
                    aria-label="Cerrar detalle"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>

                <dl className="mt-4 flex flex-col gap-2.5 text-sm">
                  <Detail label="Fecha" value={selected.event_date} />
                  <Detail label="Hora" value={selected.event_time} />
                  <Detail label="Duración" value={`${durationMinutes(selected)} min`} />
                  <Detail label="Servicio" value={selected.service || '—'} />
                  <Detail
                    label="Estado"
                    value={STATUS_LABEL[selected.status] || selected.status || '—'}
                  />
                  <Detail
                    label="Anticipo"
                    value={
                      DEPOSIT_LABEL[selected.deposit_status] ||
                      (selected.payment_ref ? 'Anticipo pagado' : 'Anticipo pendiente')
                    }
                  />
                  <Detail
                    label="Monto anticipo"
                    value={
                      selected.deposit != null
                        ? formatCurrency(Number(selected.deposit), { currency: 'MXN' })
                        : '—'
                    }
                  />
                  <Detail
                    label="Total"
                    value={
                      selected.total != null
                        ? formatCurrency(Number(selected.total), { currency: 'MXN' })
                        : '—'
                    }
                  />
                  <Detail label="Referencia de pago" value={selected.payment_ref || '—'} />
                  <Detail label="Teléfono" value={selected.phone || '—'} />
                  <Detail label="Correo" value={selected.email || '—'} />
                  <Detail label="Tipo de evento" value={selected.event_type || '—'} />
                  <Detail label="Modalidad" value={LOCATION_TYPE_LABEL[selected.location_type] || (selected.location_type ? selected.location_type : '—')} />
                  <Detail label="Ubicación / dirección" value={selected.location || '—'} />
                  <Detail
                    label="Personas"
                    value={selected.people != null && selected.people !== 0 ? String(selected.people) : '—'}
                  />
                  <Detail label="Notas / comentarios" value={selected.notes || '—'} />
                  <Detail
                    label="Exportación Google"
                    value={
                      isExportedGoogle(selected)
                        ? selected.google_event_id
                          ? `Exportada (ID: ${selected.google_event_id})`
                          : 'Exportada'
                        : 'Pendiente'
                    }
                  />
                  <Detail
                    label="Exportación Apple"
                    value={isExportedApple(selected) ? 'Exportada (.ics)' : 'Pendiente'}
                  />
                </dl>

                <div className="mt-4 flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={busy === `google-${selected.id}` || !!selected.google_event_id}
                    onClick={() => exportGoogleOne(selected)}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
                    title={
                      selected.google_event_id
                        ? 'Ya existe un evento en Google Calendar para esta reserva'
                        : undefined
                    }
                  >
                    {busy === `google-${selected.id}` ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    )}
                    {selected.google_event_id
                      ? 'Ya en Google Calendar'
                      : isExportedGoogle(selected)
                        ? 'Reabrir en Google Calendar'
                        : 'Exportar a Google Calendar'}
                  </button>
                  <button
                    type="button"
                    disabled={busy === `apple-${selected.id}`}
                    onClick={() => exportAppleOne(selected)}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border text-sm font-medium transition-colors hover:bg-secondary active:scale-[0.98] disabled:opacity-50"
                  >
                    {busy === `apple-${selected.id}` ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Apple className="h-4 w-4" aria-hidden="true" />
                    )}
                    {isExportedApple(selected)
                      ? 'Volver a descargar .ics (Apple)'
                      : 'Exportar a Apple Calendar (.ics)'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[180px] items-center justify-center rounded-xl border border-dashed border-border px-4 text-center text-sm font-light text-muted-foreground">
                Selecciona una reserva del calendario o de la lista para ver todos los datos del cliente.
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function GoogleConnection() {
  const [status, setStatus] = useState(null); // { configured, connected, account }
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null); // { type, text }

  const load = async () => {
    setLoading(true);
    try {
      const r = await apiServerClient.fetch('/google/status');
      const data = await r.json();
      setStatus(data);
    } catch (_) {
      setStatus({ configured: false, connected: false, account: '' });
    }
    setLoading(false);
  };

  useEffect(() => {
    // Interpretar el resultado del retorno de OAuth (?google=...).
    const params = new URLSearchParams(window.location.search);
    const g = params.get('google');
    if (g === 'success') {
      setNotice({ type: 'success', text: 'Google Calendar se vinculó correctamente. La disponibilidad de tu calendario ya se consulta al reservar.' });
    } else if (g === 'cancelled') {
      setNotice({ type: 'info', text: 'Cancelaste la autorización con Google. Puedes volver a vincular tu cuenta cuando quieras.' });
    } else if (g === 'error') {
      setNotice({ type: 'error', text: 'No se pudo vincular Google Calendar. Inténtalo de nuevo y, si persiste, verifica las credenciales del servidor.' });
    }
    if (g) {
      const url = new URL(window.location.href);
      url.searchParams.delete('google');
      window.history.replaceState({}, '', url.pathname + (url.search || ''));
    }
    load();
  }, []);

  const connect = () => {
    // Redirección completa al inicio del flujo OAuth (no exponer tokens).
    window.location.href = '/hcgi/api/google/auth';
  };

  const disconnect = async () => {
    setBusy(true);
    setNotice(null);
    try {
      const r = await apiServerClient.fetch('/google/disconnect', { method: 'POST' });
      if (!r.ok) throw new Error('No se pudo desvincular la cuenta.');
      setNotice({ type: 'success', text: 'Cuenta de Google Calendar desvinculada. Las reservas volverán a usar solo los bloques configurados.' });
      await load();
    } catch (e) {
      setNotice({ type: 'error', text: e?.message || 'No se pudo desvincular la cuenta.' });
    }
    setBusy(false);
  };

  const connected = !!status?.connected;
  const configured = !!status?.configured;
  const account = status?.account || '';

  return (
    <section className="mt-4 rounded-2xl border border-border bg-gradient-to-br from-secondary/60 to-card p-5 shadow-[0_15px_40px_-30px_hsl(var(--primary)/0.35)] sm:p-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CalendarPlus className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="flex-1">
          <h2 className="font-display text-lg font-semibold tracking-tight">
            Conexión con Google Calendar
          </h2>
          <p className="mt-1 text-xs font-light text-muted-foreground">
            Vincula tu calendario de trabajo para consultar disponibilidad real y evitar reservar horarios ocupados. Las credenciales y tokens se guardan solo en el servidor.
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-background/70 p-4">
        {notice && (
          <p
            role="status"
            className={`mb-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
              notice.type === 'success'
                ? 'bg-primary/10 text-primary'
                : notice.type === 'error'
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-secondary text-foreground'
            }`}
          >
            {notice.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            ) : notice.type === 'error' ? (
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Info className="h-4 w-4" aria-hidden="true" />
            )}
            {notice.text}
          </p>
        )}

        {loading ? (
          <p className="inline-flex items-center gap-2 text-sm font-light text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Consultando estado de la conexión…
          </p>
        ) : !configured ? (
          <div className="flex flex-col gap-3">
            <p className="inline-flex items-start gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                Aún no se pueden vincular ni desvincular cuentas: faltan las credenciales OAuth de Google en el servidor
                (<span className="font-medium">GOOGLE_CLIENT_ID</span> y{' '}
                <span className="font-medium">GOOGLE_CLIENT_SECRET</span>).
              </span>
            </p>
            <div className="rounded-xl border border-border bg-card/80 px-4 py-3 text-xs font-light leading-relaxed text-muted-foreground">
              <p className="font-medium text-foreground">Cómo activar la conexión</p>
              <ol className="mt-2 list-decimal space-y-1.5 pl-4">
                <li>
                  En{' '}
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary underline-offset-2 hover:underline"
                  >
                    Google Cloud Console → Credenciales
                  </a>
                  , crea un cliente OAuth tipo «Aplicación web».
                </li>
                <li>
                  Activa la API de Google Calendar y añade esta URI de redirección autorizada:{' '}
                  <code className="break-all rounded bg-muted px-1.5 py-0.5 text-[11px] text-foreground">
                    {typeof window !== 'undefined'
                      ? `${window.location.origin}/hcgi/api/google/callback`
                      : '/hcgi/api/google/callback'}
                  </code>
                </li>
                <li>
                  Envía el <span className="font-medium text-foreground">ID de cliente</span> y el{' '}
                  <span className="font-medium text-foreground">secreto de cliente</span> al asistente del sitio
                  (o pégalos en <code className="rounded bg-muted px-1 py-0.5 text-[11px]">apps/api/.env</code>)
                  y vuelve a comprobar.
                </li>
              </ol>
            </div>
            <button
              type="button"
              onClick={load}
              className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-full border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" /> Volver a comprobar
            </button>
          </div>
        ) : connected ? (
          <div className="flex flex-col gap-3">
            <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Conectado
              {account && (
                <span className="font-light text-foreground/80">· {account}</span>
              )}
            </p>
            <p className="text-xs font-light text-muted-foreground">
              La disponibilidad se consulta automáticamente desde tu calendario al elegir una fecha. Las franjas ocupadas no aparecen como reservables.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={connect}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary active:scale-[0.98]"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" /> Volver a autorizar
              </button>
              <button
                type="button"
                onClick={disconnect}
                disabled={busy}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-destructive/40 px-4 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 active:scale-[0.98] disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Unlink className="h-4 w-4" aria-hidden="true" />}
                Desvincular cuenta
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-light text-muted-foreground">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" /> Credenciales listas, pero tu cuenta aún no está vinculada.
            </p>
            <button
              type="button"
              onClick={connect}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] sm:w-fit sm:px-6"
            >
              <Link2 className="h-4 w-4" aria-hidden="true" /> Vincular cuenta de Google Calendar
            </button>
          </div>
        )}

        {!loading && (
          <button
            type="button"
            onClick={load}
            className="mt-3 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Volver a comprobar
          </button>
        )}
      </div>
    </section>
  );
}

function Detail({ label, value }) {
  return (
    <div className="grid grid-cols-1 gap-0.5 border-b border-border/60 pb-2 last:border-0 sm:grid-cols-3 sm:gap-2">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="sm:col-span-2 text-sm font-light break-words">{value}</dd>
    </div>
  );
}
