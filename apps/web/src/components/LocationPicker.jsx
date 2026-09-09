import React, { useMemo, useState } from 'react';
import {
  MapPin,
  Copy,
  CheckCircle2,
  ArrowLeft,
  AlertTriangle,
  Home,
  Navigation,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const inputClass =
  'h-12 rounded-xl border-input bg-background px-4 text-base focus-visible:ring-2 focus-visible:ring-ring';

// Compose una dirección legible a partir de los campos capturados,
// respetando el orden definido en la configuración.
function composeAddress(fields, values) {
  return (fields || [])
    .map((f) => ({ ...f, value: (values[f.id] || '').trim() }))
    .filter((f) => f.value)
    .map((f) => f.value)
    .join(', ');
}

// ============================================================
// SELECTOR DE UBICACIÓN DEL FLUJO DE RESERVA
// ------------------------------------------------------------
// Dos opciones:
//   1) Estudio de Tamara → muestra la dirección configurable y un
//      botón "Copiar dirección" con confirmación.
//   2) Otra ubicación → formulario con los campos configurables y
//      un paso de confirmación explícita antes de continuar.
//
// Notifica al padre con { type, address, confirmed, fields }.
// ============================================================
export default function LocationPicker({ config, value, onChange }) {
  const cfg = config || {};
  const studio = cfg.studio || {};
  const external = cfg.external || {};

  const [option, setOption] = useState(value?.type || null);
  const [fields, setFields] = useState(value?.fields || {});
  const [confirmed, setConfirmed] = useState(!!value?.confirmed && !!value?.address);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [copied, setCopied] = useState(false);

  const externalAddress = useMemo(
    () => composeAddress(external.fields, fields),
    [external.fields, fields],
  );

  const selectOption = (opt) => {
    setOption(opt);
    setShowConfirm(false);
    setConfirmed(false);
    setErrors({});
    setCopied(false);
    if (opt === 'studio') {
      onChange({ type: 'studio', address: studio.address || '', confirmed: true, fields: {} });
    } else {
      onChange({ type: 'external', address: '', confirmed: false, fields });
    }
  };

  const updateField = (id, v) => {
    setFields((prev) => {
      const next = { ...prev, [id]: v };
      if (option === 'external') {
        onChange({ type: 'external', address: '', confirmed: false, fields: next });
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, [id]: undefined }));
    setConfirmed(false);
  };

  const validateExternal = () => {
    const errs = {};
    (external.fields || []).forEach((f) => {
      if (f.required && !(fields[f.id] || '').trim()) {
        errs[f.id] = 'Este campo es obligatorio.';
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleContinueExternal = () => {
    if (validateExternal()) {
      setShowConfirm(true);
    }
  };

  const handleConfirmExternal = () => {
    const addr = composeAddress(external.fields, fields);
    setConfirmed(true);
    onChange({ type: 'external', address: addr, confirmed: true, fields });
  };

  const handleEditExternal = () => {
    setShowConfirm(false);
    setConfirmed(false);
    onChange({ type: 'external', address: '', confirmed: false, fields });
  };

  const handleCopy = async () => {
    const text = studio.address || '';
    if (!text) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2600);
    } catch (_) {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">
          {cfg.sectionTitle || '¿Dónde se realizará la sesión?'}{' '}
          <span className="text-primary" aria-hidden="true">*</span>
          <span className="sr-only">(obligatorio)</span>
        </Label>
        <p className="text-xs font-light text-muted-foreground">
          {cfg.sectionInstructions}
        </p>
      </div>

      {/* Opciones */}
      <div className="grid gap-3 sm:grid-cols-2">
        <OptionCard
          active={option === 'studio'}
          onClick={() => selectOption('studio')}
          icon={Home}
          label={cfg.studioOptionLabel || 'La sesión será en el estudio de Tamara'}
        />
        <OptionCard
          active={option === 'external'}
          onClick={() => selectOption('external')}
          icon={Navigation}
          label={cfg.externalOptionLabel || 'La sesión será en otra ubicación'}
        />
      </div>

      {/* Estudio */}
      {option === 'studio' && (
        <div className="rounded-2xl border border-border bg-background/60 p-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MapPin className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="flex-1">
              <h4 className="font-display text-lg font-semibold tracking-tight">
                {studio.title || 'Estudio de Tamara'}
              </h4>
              <p className="mt-1 text-sm font-light text-muted-foreground">
                {studio.instructions}
              </p>
              <p className="mt-3 rounded-xl bg-secondary/70 px-4 py-3 text-sm font-medium text-foreground">
                {studio.address}
              </p>
              <button
                type="button"
                onClick={handleCopy}
                className="mt-3 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    {studio.copiedLabel || '¡Dirección copiada!'}
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" aria-hidden="true" />
                    {studio.copyLabel || 'Copiar dirección'}
                  </>
                )}
              </button>
              {copied && (
                <p
                  role="status"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Dirección copiada al portapapeles. Puedes continuar con tu reserva.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Otra ubicación — captura */}
      {option === 'external' && !showConfirm && (
        <div className="rounded-2xl border border-border bg-background/60 p-5">
          <h4 className="font-display text-lg font-semibold tracking-tight">
            {external.title || 'Dirección de la sesión'}
          </h4>
          <p className="mt-1 text-sm font-light text-muted-foreground">
            {external.instructions}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {(external.fields || []).map((f) => (
              <div
                key={f.id}
                className={f.id === 'reference' ? 'sm:col-span-2 flex flex-col gap-2' : 'flex flex-col gap-2'}
              >
                <Label htmlFor={`loc-${f.id}`} className="text-sm font-medium">
                  {f.label}
                  {f.required && <span className="text-primary" aria-hidden="true"> *</span>}
                </Label>
                <Input
                  id={`loc-${f.id}`}
                  value={fields[f.id] || ''}
                  onChange={(e) => updateField(f.id, e.target.value)}
                  className={inputClass}
                  aria-invalid={!!errors[f.id]}
                />
                {errors[f.id] && (
                  <p role="alert" className="text-sm text-destructive">{errors[f.id]}</p>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleContinueExternal}
            className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Revisar dirección
          </button>
        </div>
      )}

      {/* Otra ubicación — confirmación explícita */}
      {option === 'external' && showConfirm && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="flex-1">
              <h4 className="font-display text-lg font-semibold tracking-tight">
                {external.confirmTitle || 'Confirma que la dirección es correcta'}
              </h4>
              <p className="mt-1 text-sm font-light text-muted-foreground">
                {external.confirmInstructions}
              </p>
              <dl className="mt-4 divide-y divide-border rounded-xl border border-border bg-background/80">
                {(external.fields || []).map((f) => {
                  const v = (fields[f.id] || '').trim();
                  if (!v) return null;
                  return (
                    <div key={f.id} className="flex items-start justify-between gap-4 px-4 py-2.5">
                      <dt className="text-sm font-light text-muted-foreground">{f.label}</dt>
                      <dd className="max-w-[60%] text-right text-sm font-medium text-foreground break-words">{v}</dd>
                    </div>
                  );
                })}
              </dl>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleConfirmExternal}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  {external.confirmLabel || 'Sí, la dirección es correcta'}
                </button>
                <button
                  type="button"
                  onClick={handleEditExternal}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border px-6 text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  {external.editLabel || 'Editar dirección'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estado de confirmación */}
      {option && confirmed && (
        <p className="inline-flex items-center gap-2 self-start rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          {option === 'studio'
            ? 'Estudio de Tamara seleccionado. Puedes continuar con tu reserva.'
            : (external.successMessage || 'Dirección confirmada. Puedes continuar con tu reserva.')}
        </p>
      )}
    </div>
  );
}

function OptionCard({ active, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
        active
          ? 'border-primary bg-primary/5 shadow-[0_12px_30px_-18px_hsl(var(--primary)/0.7)]'
          : 'border-border bg-background hover:border-primary/40 hover:bg-secondary/40'
      }`}
    >
      <span
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          active ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
        }`}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="text-sm font-medium leading-snug">{label}</span>
    </button>
  );
}
