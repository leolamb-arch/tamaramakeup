import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  Save,
  AlertTriangle,
  Plus,
  Trash2,
  MapPin,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import pb from '@/lib/pocketbaseClient';
import { SectionShell } from '@/components/admin/AdminContent';

const inputClass =
  'h-11 rounded-xl border-input bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring';

// Estructura por defecto del paso de ubicación (igual a src/data/site.js).
const DEFAULT_LOCATION = {
  sectionTitle: '¿Dónde se realizará la sesión?',
  sectionInstructions:
    'Elige si prefieres venir al estudio o que yo vaya a tu ubicación.',
  studioOptionLabel: 'La sesión será en el estudio de Tamara',
  externalOptionLabel: 'La sesión será en otra ubicación',
  studio: {
    address:
      'Av. Adolfo López Mateos 1234, Col. Americana, Guadalajara, Jalisco, 44160',
    title: 'Estudio de Tamara',
    instructions:
      'Te espero en mi estudio. Copia la dirección completa para llegar sin contratiempos.',
    copyLabel: 'Copiar dirección',
    copiedLabel: '¡Dirección copiada!',
  },
  external: {
    title: 'Dirección de la sesión',
    instructions:
      'Captura la dirección completa donde se realizará la sesión. Todos los campos marcados con * son obligatorios.',
    fields: [
      { id: 'street', label: 'Calle', required: true },
      { id: 'number', label: 'Número exterior', required: true },
      { id: 'interior', label: 'Número interior / depto (opcional)', required: false },
      { id: 'neighborhood', label: 'Colonia', required: true },
      { id: 'city', label: 'Municipio / ciudad', required: true },
      { id: 'state', label: 'Estado', required: true },
      { id: 'zip', label: 'Código postal', required: true },
      { id: 'reference', label: 'Referencia para llegar (opcional)', required: false },
    ],
    confirmTitle: 'Confirma que la dirección es correcta',
    confirmInstructions:
      'Revisa con cuidado los datos antes de continuar. Una vez confirmados, se guardarán con tu reserva.',
    confirmLabel: 'Sí, la dirección es correcta',
    editLabel: 'Editar dirección',
    successMessage: 'Dirección confirmada. Puedes continuar con tu reserva.',
  },
};

// Garantiza que el objeto tenga todas las claves esperadas (merge con defaults).
function normalizeLocation(saved) {
  const s = saved || {};
  return {
    sectionTitle: s.sectionTitle ?? DEFAULT_LOCATION.sectionTitle,
    sectionInstructions: s.sectionInstructions ?? DEFAULT_LOCATION.sectionInstructions,
    studioOptionLabel: s.studioOptionLabel ?? DEFAULT_LOCATION.studioOptionLabel,
    externalOptionLabel: s.externalOptionLabel ?? DEFAULT_LOCATION.externalOptionLabel,
    studio: { ...DEFAULT_LOCATION.studio, ...(s.studio || {}) },
    external: {
      ...DEFAULT_LOCATION.external,
      ...(s.external || {}),
      fields:
        Array.isArray(s.external?.fields) && s.external.fields.length
          ? s.external.fields
          : DEFAULT_LOCATION.external.fields,
    },
  };
}

export default function AdminLocation() {
  const [recId, setRecId] = useState(null);
  const [data, setData] = useState(null); // site_content.data completo
  const [loc, setLoc] = useState(null); // porción locationConfig normalizada
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const list = await pb.collection('site_content').getFullList({ sort: '-created' });
      const rec = list[0];
      if (rec) {
        setRecId(rec.id);
        const d = typeof rec.data === 'string' ? JSON.parse(rec.data) : rec.data;
        const full = d || {};
        setData(full);
        setLoc(normalizeLocation(full.locationConfig));
      } else {
        setRecId(null);
        setData({});
        setLoc(normalizeLocation(null));
      }
    } catch (e) {
      setError(e?.message || 'No se pudo cargar la configuración de ubicación.');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const set = (path, value) => {
    setLoc((prev) => {
      const keys = path.split('.');
      const next = { ...prev };
      let cur = next;
      for (let i = 0; i < keys.length - 1; i++) {
        cur[keys[i]] = { ...(cur[keys[i]] || {}) };
        cur = cur[keys[i]];
      }
      cur[keys[keys.length - 1]] = value;
      return next;
    });
  };

  // — Campos de la dirección externa —
  const updateField = (i, key, value) => {
    setLoc((prev) => {
      const next = { ...prev };
      const fields = (prev.external.fields || []).map((f, idx) =>
        idx === i ? { ...f, [key]: value } : f,
      );
      next.external = { ...prev.external, fields };
      return next;
    });
  };
  const addField = () => {
    setLoc((prev) => {
      const next = { ...prev };
      const id = `campo-${Date.now().toString(36)}`;
      next.external = {
        ...prev.external,
        fields: [...(prev.external.fields || []), { id, label: 'Nuevo campo', required: false }],
      };
      return next;
    });
  };
  const removeField = (i) => {
    setLoc((prev) => {
      const next = { ...prev };
      next.external = {
        ...prev.external,
        fields: (prev.external.fields || []).filter((_, idx) => idx !== i),
      };
      return next;
    });
  };

  const handleSave = async () => {
    setFieldError('');
    // Validación: al menos un campo requerido en la dirección externa.
    const requiredCount = (loc.external.fields || []).filter((f) => f.required).length;
    if (!requiredCount) {
      setFieldError('La dirección externa necesita al menos un campo obligatorio.');
      return;
    }
    if (!loc.studio.address || !loc.studio.address.trim()) {
      setFieldError('Escribe la dirección completa del estudio.');
      return;
    }
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      // Conserva el resto del contenido guardado y solo actualiza locationConfig.
      const payload = { data: { ...(data || {}), locationConfig: loc } };
      if (recId) {
        await pb.collection('site_content').update(recId, payload);
      } else {
        const rec = await pb.collection('site_content').create(payload);
        setRecId(rec.id);
      }
      setData((d) => ({ ...(d || {}), locationConfig: loc }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2800);
    } catch (e) {
      setError(e?.message || 'No se pudo guardar la configuración de ubicación.');
    }
    setSaving(false);
  };

  if (loading || !loc) {
    return (
      <SectionShell title="Ubicación de la sesión" hint="Configura el paso de ubicación del flujo de reserva.">
        <p className="inline-flex items-center gap-2 text-sm font-light text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Cargando…
        </p>
      </SectionShell>
    );
  }

  return (
    <SectionShell
      title="Ubicación de la sesión"
      hint="Edita la dirección del estudio, los textos de ambas opciones, las etiquetas del botón de copiar, los textos de confirmación y los campos de la dirección externa. Los cambios se reflejan en el flujo de reserva."
    >
      <div className="flex flex-col gap-6">
        {/* Textos generales */}
        <Group title="Textos generales del paso">
          <TextInput label="Título del paso" value={loc.sectionTitle} onChange={(v) => set('sectionTitle', v)} />
          <TextAreaInput label="Instrucción general" value={loc.sectionInstructions} onChange={(v) => set('sectionInstructions', v)} />
          <TextInput label="Etiqueta de la opción «Estudio»" value={loc.studioOptionLabel} onChange={(v) => set('studioOptionLabel', v)} />
          <TextInput label="Etiqueta de la opción «Otra ubicación»" value={loc.externalOptionLabel} onChange={(v) => set('externalOptionLabel', v)} />
        </Group>

        {/* Estudio */}
        <Group title="Opción 1 — Estudio de Tamara">
          <TextAreaInput label="Dirección completa del estudio" value={loc.studio.address} onChange={(v) => set('studio.address', v)} />
          <TextInput label="Título del bloque" value={loc.studio.title} onChange={(v) => set('studio.title', v)} />
          <TextAreaInput label="Instrucciones" value={loc.studio.instructions} onChange={(v) => set('studio.instructions', v)} />
          <TextInput label="Texto del botón «Copiar»" value={loc.studio.copyLabel} onChange={(v) => set('studio.copyLabel', v)} />
          <TextInput label="Texto de «Copiado» (confirmación)" value={loc.studio.copiedLabel} onChange={(v) => set('studio.copiedLabel', v)} />
        </Group>

        {/* Otra ubicación */}
        <Group title="Opción 2 — Otra ubicación">
          <TextInput label="Título del formulario" value={loc.external.title} onChange={(v) => set('external.title', v)} />
          <TextAreaInput label="Instrucciones del formulario" value={loc.external.instructions} onChange={(v) => set('external.instructions', v)} />

          <div className="mt-2 sm:col-span-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-foreground">Campos de la dirección externa</p>
              <button
                type="button"
                onClick={addField}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-dashed border-primary/40 px-3 text-xs font-medium text-primary transition-colors hover:bg-primary/5"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Agregar campo
              </button>
            </div>
            <div className="mt-3 flex flex-col gap-3">
              {(loc.external.fields || []).map((f, i) => (
                <div key={f.id || i} className="rounded-xl border border-border p-3">
                  <div className="flex items-center gap-2">
                    <Input
                      value={f.label || ''}
                      onChange={(e) => updateField(i, 'label', e.target.value)}
                      className={inputClass}
                      aria-label="Nombre del campo"
                    />
                    <label className="flex shrink-0 items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5">
                      <Switch
                        checked={!!f.required}
                        onCheckedChange={(v) => updateField(i, 'required', v)}
                        aria-label="Campo obligatorio"
                      />
                      <span className="text-xs font-medium">Obligatorio</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => removeField(i)}
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
                      aria-label="Eliminar campo"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <TextInput label="Título de la confirmación" value={loc.external.confirmTitle} onChange={(v) => set('external.confirmTitle', v)} />
          <TextAreaInput label="Instrucción de la confirmación" value={loc.external.confirmInstructions} onChange={(v) => set('external.confirmInstructions', v)} />
          <TextInput label="Texto del botón «Confirmar»" value={loc.external.confirmLabel} onChange={(v) => set('external.confirmLabel', v)} />
          <TextInput label="Texto del botón «Editar»" value={loc.external.editLabel} onChange={(v) => set('external.editLabel', v)} />
          <TextAreaInput label="Mensaje de éxito (dirección confirmada)" value={loc.external.successMessage} onChange={(v) => set('external.successMessage', v)} />
        </Group>

        {fieldError && (
          <p role="alert" className="inline-flex items-center gap-2 rounded-full bg-destructive/10 px-4 py-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" /> {fieldError}
          </p>
        )}
        {error && (
          <p role="alert" className="inline-flex items-center gap-2 rounded-full bg-destructive/10 px-4 py-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" /> {error}
          </p>
        )}
        {saved && (
          <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Configuración de ubicación guardada. El flujo de reserva se actualizó.
          </p>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
          Guardar configuración de ubicación
        </button>
      </div>
    </SectionShell>
  );
}

function Group({ title, children }) {
  return (
    <div className="rounded-xl border border-border bg-background/50 p-4">
      <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-gold">
        <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {title}
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function TextInput({ label, value, onChange }) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-sm font-medium">{label}</Label>
      <Input value={value || ''} onChange={(e) => onChange(e.target.value)} className={inputClass} />
    </div>
  );
}

function TextAreaInput({ label, value, onChange }) {
  return (
    <div className="flex flex-col gap-2 sm:col-span-2">
      <Label className="text-sm font-medium">{label}</Label>
      <Textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="rounded-xl border-input bg-background px-3 py-2.5 text-sm focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  );
}
