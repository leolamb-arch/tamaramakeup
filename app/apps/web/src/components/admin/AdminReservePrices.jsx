import React, { useEffect, useState, useCallback } from 'react';
import {
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Save,
  Tag,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import pb from '@/lib/pocketbaseClient';
import { SectionShell } from '@/components/admin/AdminContent';
import { formatCurrency } from '@/lib/format';

const inputClass =
  'h-11 rounded-xl border-input bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring';

// ============================================================
// PRECIOS DE RESERVA POR SERVICIO
// ------------------------------------------------------------
// Sección dedicada y fácil de encontrar para que Tamara edite
// sin código el precio de reserva (MXN) de cada servicio.
// Campos numéricos, validación (≥ 0), botones claros de guardado
// por servicio y mensajes de éxito o error. Los precios guardados
// se reflejan automáticamente en las tarjetas y detalles públicos.
// ============================================================

export default function AdminReservePrices() {
  const [services, setServices] = useState([]);
  const [drafts, setDrafts] = useState({}); // { [id]: string }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [savingId, setSavingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const recs = await pb.collection('services').getFullList({ sort: 'sort_order' });
      setServices(recs);
      setDrafts((prev) => {
        const next = {};
        recs.forEach((r) => {
          next[r.id] = prev[r.id] != null ? prev[r.id] : String(Number(r.price_amount) || 0);
        });
        return next;
      });
    } catch (e) {
      setError(e?.message || 'No se pudieron cargar los servicios.');
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2800); };

  const onChange = (id, value) => {
    // Solo dígitos y un punto decimal.
    const clean = value.replace(/[^0-9.]/g, '');
    setDrafts((d) => ({ ...d, [id]: clean }));
  };

  const validate = (raw) => {
    const num = Number(raw);
    if (raw === '' || Number.isNaN(num)) {
      return 'Ingresa un número válido.';
    }
    if (num < 0) {
      return 'El precio no puede ser negativo.';
    }
    return null;
  };

  const saveOne = async (svc) => {
    const raw = drafts[svc.id] ?? '';
    const verr = validate(raw);
    if (verr) {
      setError(verr);
      showToast('');
      return;
    }
    setSavingId(svc.id);
    setError('');
    try {
      await pb.collection('services').update(svc.id, { price_amount: Number(raw) });
      setServices((prev) => prev.map((s) => (s.id === svc.id ? { ...s, price_amount: Number(raw) } : s)));
      showToast(`Precio de «${svc.name}» guardado.`);
    } catch (e) {
      setError(e?.message || 'No se pudo guardar el precio.');
    }
    setSavingId(null);
  };

  const toggleActive = async (svc) => {
    try {
      await pb.collection('services').update(svc.id, { active: !svc.active });
      setServices((prev) => prev.map((s) => (s.id === svc.id ? { ...s, active: !svc.active } : s)));
      showToast(svc.active ? 'Servicio desactivado.' : 'Servicio activado.');
    } catch (e) {
      setError(e?.message || 'No se pudo cambiar el estado.');
    }
  };

  return (
    <SectionShell
      title="Precios de reserva"
      hint="Edita el precio de reserva (MXN) de cada servicio. Este es el monto que ven las clientas y con el que se calcula el depósito al reservar."
    >
      <div className="flex flex-col gap-4">
        {error && (
          <p role="alert" className="inline-flex items-center gap-2 rounded-full bg-destructive/10 px-4 py-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" /> {error}
          </p>
        )}
        {toast && (
          <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> {toast}
          </p>
        )}

        {loading ? (
          <p className="inline-flex items-center gap-2 text-sm font-light text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Cargando servicios…
          </p>
        ) : services.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm font-light text-muted-foreground">
            Aún no hay servicios. Crea uno desde la pestaña «Servicios».
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {services.map((svc) => {
              const raw = drafts[svc.id] ?? '';
              const verr = validate(raw);
              const current = Number(svc.price_amount) || 0;
              const dirty = raw !== '' && Number(raw) !== current;
              return (
                <li key={svc.id} className="rounded-2xl border border-border bg-card p-4 shadow-[0_15px_40px_-30px_hsl(var(--primary)/0.3)] sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Tag className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <p className="font-display text-lg font-semibold tracking-tight">{svc.name || 'Sin nombre'}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${svc.active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                          {svc.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-light text-muted-foreground">
                        Precio actual: <strong className="font-medium text-foreground">{formatCurrency(current)}</strong>
                        {svc.price ? <> · Texto en tarjeta: {svc.price}</> : null}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:w-56">
                      <Label htmlFor={`price-${svc.id}`} className="text-sm font-medium">
                        Precio de reserva (MXN)
                      </Label>
                      <Input
                        id={`price-${svc.id}`}
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="1"
                        value={raw}
                        onChange={(e) => onChange(svc.id, e.target.value)}
                        className={inputClass}
                        aria-invalid={!!verr}
                      />
                    </div>

                    <div className="flex items-center gap-2 sm:flex-col sm:items-stretch">
                      <button
                        type="button"
                        onClick={() => saveOne(svc)}
                        disabled={!!verr || !dirty || savingId === svc.id}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
                      >
                        {savingId === svc.id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
                        Guardar
                      </button>
                    </div>
                  </div>

                  {verr && dirty && (
                    <p role="alert" className="mt-2 text-xs font-medium text-destructive">{verr}</p>
                  )}

                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
                    <label className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Switch checked={svc.active} onCheckedChange={() => toggleActive(svc)} aria-label="Activar/desactivar" />
                      {svc.active ? 'Visible y reservable' : 'Oculto'}
                    </label>
                    <p className="text-xs font-light text-muted-foreground">
                      Depósito estimado (30%): {formatCurrency(Math.round((Number(raw) || 0) * 0.3))}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <p className="text-xs font-light text-muted-foreground">
          Los cambios se guardan por servicio. El precio de reserva se muestra en las tarjetas y detalles públicos, y se usa para calcular el depósito al reservar.
        </p>
      </div>
    </SectionShell>
  );
}
