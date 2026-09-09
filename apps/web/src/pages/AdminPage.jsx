import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import {
  CheckCircle2,
  Loader2,
  AlertTriangle,
  LogOut,
  Save,
  Plus,
  Trash2,
  Clock,
  CalendarDays,
  Coffee,
  Ban,
  Info,
  Lock,
  CalendarX,
  FileText,
  Palette,
  Sparkles,
  SlidersHorizontal,
  MapPin,
  Tag,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { site } from '@/data/site';
import AdminBookings from '@/components/AdminBookings';
import AdminContent from '@/components/admin/AdminContent';
import AdminServices from '@/components/admin/AdminServices';
import AdminAppearance from '@/components/admin/AdminAppearance';
import AdminTools from '@/components/admin/AdminTools';
import AdminLocation from '@/components/admin/AdminLocation';
import AdminReservePrices from '@/components/admin/AdminReservePrices';

// ============================================================
// PANEL PRIVADO DE ADMINISTRACIÓN DE AGENDA
// ------------------------------------------------------------
// Acceso solo para la propietaria (cuenta administradora).
// Desde aquí controla la disponibilidad que ve el calendario
// público de reservas. Los cambios se guardan en el backend y
// se reflejan automáticamente en el sitio.
// ============================================================

const WEEKDAYS = [
  { n: 1, label: 'Lunes' },
  { n: 2, label: 'Martes' },
  { n: 3, label: 'Miércoles' },
  { n: 4, label: 'Jueves' },
  { n: 5, label: 'Viernes' },
  { n: 6, label: 'Sábado' },
  { n: 0, label: 'Domingo' },
];

const inputClass =
  'h-11 rounded-xl border-input bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring';

function parseArr(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    try {
      const p = JSON.parse(value);
      return Array.isArray(p) ? p : fallback;
    } catch (_) {
      return fallback;
    }
  }
  return Array.isArray(value) ? value : fallback;
}

export default function AdminPage() {
  const { user, isAuthed, login, logout } = useAuth();
  const isAdmin = !!user && user.role === 'admin';

  if (!isAuthed || !isAdmin) {
    return <LoginCard login={login} logout={logout} isAuthed={isAuthed} />;
  }

  return <AdminPanel user={user} logout={logout} />;
}

// ────────────────────────────────────────────────────────────
// PANTALLA DE INICIO DE SESIÓN
// ────────────────────────────────────────────────────────────
function LoginCard({ login, logout, isAuthed }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      // El cambio de `user` lo resuelve AuthContext; si la cuenta no es
      // admin, AdminPage mostrará el aviso correspondiente.
    } catch (err) {
      const msg =
        err?.response?.message ||
        err?.message ||
        'No se pudo iniciar sesión. Revisa tus datos.';
      setError(msg);
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Helmet>
        <title>Admin · {site.name}</title>
        <meta name="description" content="Panel privado de administración de agenda" />
      </Helmet>
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-[0_25px_60px_-35px_hsl(var(--primary)/0.45)]">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-gold">Administración</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">
          Iniciar sesión
        </h1>
        <p className="mt-3 text-sm font-light leading-relaxed text-muted-foreground">
          Acceso privado para la propietaria. Ingresa con tu cuenta administradora para
          gestionar la agenda.
        </p>

        {isAuthed && (
          <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-destructive/10 px-4 py-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            Esta cuenta no es administradora.
          </p>
        )}

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-sm font-medium">Correo</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="tucorreo@ejemplo.com"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password" className="text-sm font-medium">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-full bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Lock className="h-4 w-4" aria-hidden="true" />}
            Entrar
          </button>
        </form>

        {isAuthed && (
          <button
            type="button"
            onClick={logout}
            className="mt-4 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Cerrar sesión
          </button>
        )}

        <a
          href="/"
          className="mt-6 block text-center text-xs font-light text-muted-foreground transition-colors hover:text-primary"
        >
          ← Volver al sitio
        </a>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// PANEL DE ADMINISTRACIÓN DE AGENDA
// ────────────────────────────────────────────────────────────
function AdminPanel({ user, logout }) {
  const [tab, setTab] = useState('agenda'); // agenda | content | services | appearance
  const [configId, setConfigId] = useState(null);
  const [form, setForm] = useState({
    active_days: [1, 2, 3, 4, 5, 6],
    time_blocks: [{ start: '09:00', end: '19:00' }],
    appointment_duration: 60,
    breaks: [],
    blocked_dates: [],
    blocked_slots: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [newBlocked, setNewBlocked] = useState('');
  const [newSlotDate, setNewSlotDate] = useState('');
  const [newSlotTime, setNewSlotTime] = useState('');

  const loadConfig = async () => {
    setLoading(true);
    try {
      const list = await pb.collection('schedule_config').getFullList({ sort: '-created' });
      const rec = list[0];
      setConfigId(rec?.id || null);
      setForm({
        active_days: parseArr(rec?.active_days, [1, 2, 3, 4, 5, 6]),
        time_blocks: parseArr(rec?.time_blocks, [{ start: '09:00', end: '19:00' }]),
        appointment_duration: Number(rec?.appointment_duration) || 60,
        breaks: parseArr(rec?.breaks, []),
        blocked_dates: parseArr(rec?.blocked_dates, []),
        blocked_slots: parseArr(rec?.blocked_slots, []),
      });
    } catch (e) {
      setError('No se pudo cargar la configuración actual.');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const payload = {
        active_days: form.active_days,
        time_blocks: form.time_blocks,
        appointment_duration: Number(form.appointment_duration) || 60,
        breaks: form.breaks,
        blocked_dates: form.blocked_dates,
        blocked_slots: form.blocked_slots,
      };
      if (configId) {
        await pb.collection('schedule_config').update(configId, payload);
      } else {
        const rec = await pb.collection('schedule_config').create(payload);
        setConfigId(rec.id);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e?.message || 'No se pudo guardar la configuración.');
    }
    setSaving(false);
  };

  const toggleDay = (n) => {
    setForm((f) => ({
      ...f,
      active_days: f.active_days.includes(n)
        ? f.active_days.filter((d) => d !== n)
        : [...f.active_days, n].sort(),
    }));
  };

  const updateBlock = (i, field, value) => {
    setForm((f) => ({
      ...f,
      time_blocks: f.time_blocks.map((b, idx) => (idx === i ? { ...b, [field]: value } : b)),
    }));
  };
  const addBlock = () =>
    setForm((f) => ({ ...f, time_blocks: [...f.time_blocks, { start: '09:00', end: '14:00' }] }));
  const removeBlock = (i) =>
    setForm((f) => ({ ...f, time_blocks: f.time_blocks.filter((_, idx) => idx !== i) }));

  const updateBreak = (i, field, value) => {
    setForm((f) => ({
      ...f,
      breaks: f.breaks.map((b, idx) => (idx === i ? { ...b, [field]: value } : b)),
    }));
  };
  const addBreak = () =>
    setForm((f) => ({ ...f, breaks: [...f.breaks, { start: '13:00', end: '14:00' }] }));
  const removeBreak = (i) =>
    setForm((f) => ({ ...f, breaks: f.breaks.filter((_, idx) => idx !== i) }));

  const addBlocked = () => {
    if (!newBlocked || !/^\d{4}-\d{2}-\d{2}$/.test(newBlocked)) return;
    setForm((f) =>
      f.blocked_dates.includes(newBlocked)
        ? f
        : { ...f, blocked_dates: [...f.blocked_dates, newBlocked].sort() },
    );
    setNewBlocked('');
  };
  const removeBlocked = (d) =>
    setForm((f) => ({ ...f, blocked_dates: f.blocked_dates.filter((x) => x !== d) }));

  const addBlockedSlot = () => {
    if (!newSlotDate || !/^\d{4}-\d{2}-\d{2}$/.test(newSlotDate)) return;
    if (!newSlotTime || !/^\d{2}:\d{2}$/.test(newSlotTime)) return;
    const entry = { date: newSlotDate, time: newSlotTime };
    setForm((f) => {
      const exists = (f.blocked_slots || []).some(
        (b) => b && b.date === entry.date && b.time === entry.time,
      );
      if (exists) return f;
      const next = [...(f.blocked_slots || []), entry];
      next.sort((a, b) =>
        a.date === b.date
          ? String(a.time).localeCompare(String(b.time))
          : String(a.date).localeCompare(String(b.date)),
      );
      return { ...f, blocked_slots: next };
    });
    setNewSlotTime('');
  };
  const removeBlockedSlot = (date, time) =>
    setForm((f) => ({
      ...f,
      blocked_slots: (f.blocked_slots || []).filter(
        (b) => !(b.date === date && b.time === time),
      ),
    }));

  const sortedBlocked = useMemo(
    () => [...form.blocked_dates].sort(),
    [form.blocked_dates],
  );

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Admin · {site.name}</title>
        <meta name="description" content="Panel privado de administración de agenda" />
      </Helmet>

      {/* Encabezado */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-4 sm:px-6">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-gold">Panel privado</p>
            <h1 className="font-display text-lg font-semibold leading-tight">Administración de agenda</h1>
          </div>
          <button
            type="button"
            onClick={logout}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Cerrar sesión</span>
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        {/* Pestañas de sección */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { id: 'agenda', label: 'Agenda', icon: CalendarDays },
            { id: 'location', label: 'Ubicación', icon: MapPin },
            { id: 'services', label: 'Servicios', icon: Sparkles },
            { id: 'prices', label: 'Precios de reserva', icon: Tag },
            { id: 'tools', label: 'Cotización y Quiz', icon: SlidersHorizontal },
            { id: 'content', label: 'Contenido', icon: FileText },
            { id: 'appearance', label: 'Apariencia', icon: Palette },
          ].map((t) => {
            const Icon = t.icon;
            const on = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition-colors ${
                  on ? 'bg-primary text-primary-foreground' : 'border border-border text-foreground hover:bg-secondary'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === 'agenda' && (
        <>
        {/* Instrucciones */}
        <section className="rounded-2xl border border-border bg-secondary/40 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Info className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="text-sm font-light leading-relaxed text-muted-foreground">
              <p className="font-medium text-foreground">Cómo usar este panel</p>
              <ol className="mt-2 flex flex-col gap-1.5">
                <li><strong className="font-medium text-foreground">1.</strong> Activa o desactiva los días de la semana en que trabajas.</li>
                <li><strong className="font-medium text-foreground">2.</strong> Define tus <strong className="font-medium text-foreground">bloques de horario</strong> (ej. 09:00–14:00 y 16:00–19:00).</li>
                <li><strong className="font-medium text-foreground">3.</strong> Indica la <strong className="font-medium text-foreground">duración de cada cita</strong> en minutos. El sistema crea las franjas automáticamente.</li>
                <li><strong className="font-medium text-foreground">4.</strong> Agrega <strong className="font-medium text-foreground">descansos</strong> dentro de tus bloques (ej. comida 13:00–14:00).</li>
                <li><strong className="font-medium text-foreground">5.</strong> Bloquea <strong className="font-medium text-foreground">fechas específicas</strong> por vacaciones o eventos.</li>
                <li><strong className="font-medium text-foreground">6.</strong> Pulsa <strong className="font-medium text-foreground">«Guardar cambios»</strong>. El calendario público se actualiza al instante.</li>
                <li><strong className="font-medium text-foreground">7.</strong> ¿Solo una hora ocupada? Usa <strong className="font-medium text-foreground">«Bloquear horario individual»</strong> para quitar una franja concreta sin bloquear todo el día.</li>
              </ol>
              <p className="mt-3">Las clientas solo ven y reservan las franjas libres; nunca pueden editar tu disponibilidad. Todo se guarda en zona horaria de Ciudad de México.</p>
            </div>
          </div>
        </section>

        {loading ? (
          <p className="mt-8 inline-flex items-center gap-2 text-sm font-light text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Cargando configuración…
          </p>
        ) : (
          <div className="mt-8 flex flex-col gap-6">
            {/* Calendario y reservas (datos reales del backend) */}
            <AdminBookings />

            {/* Días de la semana */}
            <Card icon={CalendarDays} title="Días de la semana" hint="Activa los días que trabajas.">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {WEEKDAYS.map((d) => (
                  <label
                    key={d.n}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border bg-background px-3 py-2.5"
                  >
                    <span className="text-sm font-medium">{d.label}</span>
                    <Switch checked={form.active_days.includes(d.n)} onCheckedChange={() => toggleDay(d.n)} aria-label={d.label} />
                  </label>
                ))}
              </div>
            </Card>

            {/* Bloques de horario */}
            <Card icon={Clock} title="Bloques de horario" hint="Franjas en las que atiendes. Puedes tener más de una.">
              <div className="flex flex-col gap-3">
                {form.time_blocks.map((b, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input type="time" value={b.start} onChange={(e) => updateBlock(i, 'start', e.target.value)} className={inputClass} aria-label="Inicio del bloque" />
                    <span className="text-sm text-muted-foreground">→</span>
                    <Input type="time" value={b.end} onChange={(e) => updateBlock(i, 'end', e.target.value)} className={inputClass} aria-label="Fin del bloque" />
                    <button
                      type="button"
                      onClick={() => removeBlock(i)}
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
                      aria-label="Eliminar bloque"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addBlock}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" /> Agregar bloque
                </button>
              </div>
            </Card>

            {/* Duración de cada cita */}
            <Card icon={Clock} title="Duración de cada cita" hint="Minutos que dura cada cita. Define el espaciado de las franjas.">
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={15}
                  step={15}
                  value={form.appointment_duration}
                  onChange={(e) => setForm((f) => ({ ...f, appointment_duration: Number(e.target.value) }))}
                  className={inputClass}
                  aria-label="Duración en minutos"
                />
                <span className="text-sm font-light text-muted-foreground">minutos</span>
              </div>
            </Card>

            {/* Descansos */}
            <Card icon={Coffee} title="Descansos" hint="Horas sin citas dentro de tus bloques (ej. comida).">
              <div className="flex flex-col gap-3">
                {form.breaks.length === 0 && (
                  <p className="text-sm font-light text-muted-foreground">Sin descansos.</p>
                )}
                {form.breaks.map((b, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input type="time" value={b.start} onChange={(e) => updateBreak(i, 'start', e.target.value)} className={inputClass} aria-label="Inicio del descanso" />
                    <span className="text-sm text-muted-foreground">→</span>
                    <Input type="time" value={b.end} onChange={(e) => updateBreak(i, 'end', e.target.value)} className={inputClass} aria-label="Fin del descanso" />
                    <button
                      type="button"
                      onClick={() => removeBreak(i)}
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
                      aria-label="Eliminar descanso"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addBreak}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" /> Agregar descanso
                </button>
              </div>
            </Card>

            {/* Fechas bloqueadas */}
            <Card icon={Ban} title="Fechas bloqueadas" hint="Días concretos sin citas: vacaciones, eventos personales, etc.">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={newBlocked}
                    onChange={(e) => setNewBlocked(e.target.value)}
                    className={inputClass}
                    aria-label="Fecha a bloquear"
                  />
                  <button
                    type="button"
                    onClick={addBlocked}
                    disabled={!newBlocked}
                    className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" /> Bloquear
                  </button>
                </div>
                {sortedBlocked.length > 0 && (
                  <ul className="flex flex-wrap gap-2">
                    {sortedBlocked.map((d) => (
                      <li
                        key={d}
                        className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-sm font-medium text-foreground"
                      >
                        {d}
                        <button
                          type="button"
                          onClick={() => removeBlocked(d)}
                          className="text-muted-foreground transition-colors hover:text-destructive"
                          aria-label={`Desbloquear ${d}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>

            {/* Bloquear horario individual */}
            <Card icon={CalendarX} title="Bloquear horario individual" hint="Bloquea una hora concreta de una fecha sin afectar el resto del día. Esa franja desaparece del calendario público y no acepta reservas.">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    type="date"
                    value={newSlotDate}
                    onChange={(e) => setNewSlotDate(e.target.value)}
                    className={inputClass}
                    aria-label="Fecha del horario a bloquear"
                  />
                  <Input
                    type="time"
                    value={newSlotTime}
                    onChange={(e) => setNewSlotTime(e.target.value)}
                    className={inputClass}
                    aria-label="Hora a bloquear"
                  />
                  <button
                    type="button"
                    onClick={addBlockedSlot}
                    disabled={!newSlotDate || !newSlotTime}
                    className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" /> Bloquear hora
                  </button>
                </div>
                {(form.blocked_slots || []).length > 0 ? (
                  <ul className="flex flex-wrap gap-2">
                    {form.blocked_slots.map((b) => (
                      <li
                        key={`${b.date}-${b.time}`}
                        className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-sm font-medium text-foreground"
                      >
                        {b.date} · {b.time}
                        <button
                          type="button"
                          onClick={() => removeBlockedSlot(b.date, b.time)}
                          className="text-muted-foreground transition-colors hover:text-destructive"
                          aria-label={`Desbloquear ${b.date} ${b.time}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm font-light text-muted-foreground">Sin horarios bloqueados individualmente.</p>
                )}
                <p className="text-xs font-light text-muted-foreground">
                  Recuerda pulsar «Guardar cambios» para que el bloqueo se refleje en el calendario público.
                </p>
              </div>
            </Card>

            {/* Guardar */}
            <div className="sticky bottom-4 z-10 rounded-2xl border border-border bg-card/95 p-4 shadow-[0_10px_30px_-15px_hsl(var(--primary)/0.4)] backdrop-blur">
              {error && (
                <p role="alert" className="mb-3 rounded-full bg-destructive/10 px-4 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
              {saved && (
                <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Cambios guardados. El calendario público se actualizó.
                </p>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
                Guardar cambios
              </button>
            </div>

            <p className="pb-8 text-center text-xs font-light text-muted-foreground">
              Sesión: {user?.email}
            </p>
          </div>
        )}
        </>
        )}
        {tab === 'content' && <AdminContent />}
        {tab === 'services' && <AdminServices />}
        {tab === 'prices' && <AdminReservePrices />}
        {tab === 'appearance' && <AdminAppearance />}
        {tab === 'tools' && <AdminTools />}
        {tab === 'location' && <AdminLocation />}
      </main>
    </div>
  );
}

function Card({ icon: Icon, title, hint, children }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-[0_15px_40px_-30px_hsl(var(--primary)/0.35)] sm:p-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="flex-1">
          <h2 className="font-display text-lg font-semibold tracking-tight">{title}</h2>
          {hint && <p className="mt-1 text-xs font-light text-muted-foreground">{hint}</p>}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
