import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  Save,
  AlertTriangle,
  Eye,
  Plus,
  Trash2,
  Star,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import pb from '@/lib/pocketbaseClient';

const inputClass =
  'h-11 rounded-xl border-input bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring';

// Campos editables agrupados por sección de la página principal.
const FIELDS = [
  { group: 'Hero (inicio)', items: [
    { k: 'name', label: 'Nombre de la marca / maquillista', type: 'text' },
    { k: 'heroTitleSuffix', label: 'Subtítulo principal (bajo el nombre)', type: 'text' },
    { k: 'tagline', label: 'Frase de bienvenida', type: 'text' },
    { k: 'city', label: 'Ciudad / ubicación (etiqueta del hero)', type: 'text' },
    { k: 'heroButtonPrimary', label: 'Texto del botón principal', type: 'text' },
    { k: 'heroButtonSecondary', label: 'Texto del botón secundario', type: 'text' },
    { k: 'heroSubtext', label: 'Línea bajo los botones (tipos de evento)', type: 'text' },
    { k: 'instagramHandle', label: 'Usuario de Instagram (etiqueta del hero)', type: 'text' },
  ]},
  { group: 'Sección de servicios', items: [
    { k: 'servicesLabel', label: 'Etiqueta pequeña', type: 'text' },
    { k: 'servicesTitle', label: 'Título', type: 'text' },
    { k: 'servicesDescription', label: 'Descripción', type: 'textarea' },
  ]},
  { group: 'Sección de cotización', items: [
    { k: 'quoteLabel', label: 'Etiqueta pequeña', type: 'text' },
    { k: 'quoteTitle', label: 'Título', type: 'text' },
    { k: 'quoteDescription', label: 'Descripción', type: 'textarea' },
  ]},
  { group: 'Sección de contacto', items: [
    { k: 'contactLabel', label: 'Etiqueta pequeña', type: 'text' },
    { k: 'contactTitle', label: 'Título', type: 'text' },
    { k: 'coverage', label: 'Texto de cobertura / zona de servicio', type: 'textarea' },
    { k: 'testimonialsTitle', label: 'Título de testimonios', type: 'text' },
  ]},
  { group: 'Contacto y redes', items: [
    { k: 'whatsapp', label: 'Número de WhatsApp (formato internacional, sin + ni espacios)', type: 'text' },
    { k: 'whatsappDisplay', label: 'Número de WhatsApp (como se muestra)', type: 'text' },
    { k: 'email', label: 'Correo de contacto', type: 'text' },
    { k: 'socials.whatsapp', label: 'Enlace de WhatsApp', type: 'text' },
    { k: 'socials.instagram', label: 'Enlace de Instagram', type: 'text' },
    { k: 'socials.facebook', label: 'Enlace de Facebook', type: 'text' },
    { k: 'socials.tiktok', label: 'Enlace de TikTok', type: 'text' },
  ]},
  { group: 'Footer', items: [
    { k: 'footerNote', label: 'Nota del pie de página', type: 'textarea' },
  ]},
];

function getDeep(obj, path) {
  return path.split('.').reduce((o, p) => (o ? o[p] : undefined), obj);
}
function setDeep(obj, path, value) {
  const keys = path.split('.');
  const next = { ...obj };
  let cur = next;
  for (let i = 0; i < keys.length - 1; i++) {
    cur[keys[i]] = { ...(cur[keys[i]] || {}) };
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
  return next;
}

// Selector de valoración de 1 a 5 estrellas. Solo admite enteros en
// ese rango; cualquier valor fuera de rango se descarta.
function StarPicker({ value, onChange }) {
  const v = Math.max(0, Math.min(5, Math.round(Number(value) || 0)));
  const pick = (n) => {
    const clamped = Math.max(1, Math.min(5, n));
    onChange(clamped);
  };
  return (
    <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Valoración de 1 a 5 estrellas">
      {Array.from({ length: 5 }).map((_, i) => {
        const n = i + 1;
        const active = n <= v;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={v === n}
            aria-label={`${n} estrella${n === 1 ? '' : 's'}`}
            onClick={() => pick(n)}
            className="rounded-md p-0.5 transition-transform active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Star
              className={`h-7 w-7 ${active ? 'fill-gold text-gold' : 'fill-none text-gold/35'}`}
              aria-hidden="true"
            />
          </button>
        );
      })}
      <span className="ml-2 text-sm font-medium text-foreground/80">{v || 0}/5</span>
    </div>
  );
}

export default function AdminContent() {
  const [recId, setRecId] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const list = await pb.collection('site_content').getFullList({ sort: '-created' });
      const rec = list[0];
      if (rec) {
        setRecId(rec.id);
        const d = typeof rec.data === 'string' ? JSON.parse(rec.data) : rec.data;
        setData(d || {});
      } else {
        setRecId(null);
        setData({});
      }
    } catch (e) {
      setError(e?.message || 'No se pudo cargar el contenido.');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const update = (path, value) => setData((d) => setDeep(d || {}, path, value));

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const payload = { data: data };
      if (recId) {
        await pb.collection('site_content').update(recId, payload);
      } else {
        const rec = await pb.collection('site_content').create(payload);
        setRecId(rec.id);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2800);
    } catch (e) {
      setError(e?.message || 'No se pudo guardar el contenido.');
    }
    setSaving(false);
  };

  const testimonials = data?.testimonials || [];
  const updateTestimonial = (i, field, value) => {
    setData((d) => {
      const next = { ...(d || {}) };
      const list = [...(next.testimonials || [])];
      list[i] = { ...list[i], [field]: value };
      next.testimonials = list;
      return next;
    });
  };
  const addTestimonial = () => {
    setData((d) => {
      const next = { ...(d || {}) };
      next.testimonials = [...(next.testimonials || []), { name: '', event: '', photo: '', rating: 5 }];
      return next;
    });
  };
  const removeTestimonial = (i) => {
    setData((d) => {
      const next = { ...(d || {}) };
      next.testimonials = (next.testimonials || []).filter((_, idx) => idx !== i);
      return next;
    });
  };

  if (loading) {
    return (
      <SectionShell title="Contenido de la página principal" hint="Edita los textos visibles en el inicio.">
        <p className="inline-flex items-center gap-2 text-sm font-light text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Cargando contenido…
        </p>
      </SectionShell>
    );
  }

  return (
    <SectionShell
      title="Contenido de la página principal"
      hint="Edita los textos visibles en el inicio. Incluye una vista previa antes de guardar."
    >
      <div className="flex flex-col gap-6">
        {FIELDS.map((grp) => (
          <div key={grp.group} className="rounded-xl border border-border bg-background/50 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-gold">{grp.group}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {grp.items.map((it) => (
                <div key={it.k} className={it.type === 'textarea' ? 'sm:col-span-2 flex flex-col gap-2' : 'flex flex-col gap-2'}>
                  <Label className="text-sm font-medium">{it.label}</Label>
                  {it.type === 'textarea' ? (
                    <Textarea
                      value={getDeep(data, it.k) || ''}
                      onChange={(e) => update(it.k, e.target.value)}
                      rows={3}
                      className="rounded-xl border-input bg-background px-3 py-2.5 text-sm focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  ) : (
                    <Input
                      value={getDeep(data, it.k) || ''}
                      onChange={(e) => update(it.k, e.target.value)}
                      className={inputClass}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Testimonios */}
        <div className="rounded-xl border border-border bg-background/50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-gold">Testimonios</p>
            <button
              type="button"
              onClick={addTestimonial}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-dashed border-primary/40 px-3 text-xs font-medium text-primary transition-colors hover:bg-primary/5"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Agregar
            </button>
          </div>
          <div className="mt-3 flex flex-col gap-3">
            {testimonials.length === 0 && (
              <p className="text-sm font-light text-muted-foreground">Sin testimonios. Se mostrarán los de ejemplo.</p>
            )}
            {testimonials.map((t, i) => (
              <div key={i} className="rounded-xl border border-border p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium">Nombre</Label>
                    <Input value={t.name || ''} onChange={(e) => updateTestimonial(i, 'name', e.target.value)} className={inputClass} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium">Evento</Label>
                    <Input value={t.event || ''} onChange={(e) => updateTestimonial(i, 'event', e.target.value)} className={inputClass} />
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <Label className="text-xs font-medium">URL de la foto</Label>
                    <Input value={t.photo || ''} onChange={(e) => updateTestimonial(i, 'photo', e.target.value)} className={inputClass} />
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <Label className="text-xs font-medium">Valoración (1–5 estrellas)</Label>
                    <StarPicker
                      value={Math.max(1, Math.min(5, Math.round(Number(t.rating) || 0)))}
                      onChange={(v) => updateTestimonial(i, 'rating', v)}
                    />
                    <p className="text-[11px] font-light text-muted-foreground">
                      Selecciona de 1 a 5 estrellas. La valoración se muestra en la página principal en lugar del comentario.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeTestimonial(i)}
                  className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Eliminar testimonio
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Vista previa */}
        <div className="rounded-xl border border-border bg-background/50 p-4">
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium transition-colors hover:bg-secondary"
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
            {showPreview ? 'Ocultar vista previa' : 'Ver vista previa'}
          </button>
          {showPreview && (
            <div className="mt-4 rounded-2xl border border-border bg-card p-5">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-gold">{data?.city || 'Guadalajara, Jalisco'}</p>
              <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight">
                {data?.name || 'Tamara Aldrete'}
                <span className="mt-1 block text-primary">{data?.heroTitleSuffix || 'Maquillaje profesional en Guadalajara'}</span>
              </h3>
              <p className="mt-3 max-w-md text-sm font-light text-muted-foreground">{data?.tagline}</p>
              <p className="mt-3 text-xs text-muted-foreground">{data?.heroSubtext}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-xs font-medium text-primary-foreground">{data?.heroButtonPrimary || 'Agenda tu cita'}</span>
                <span className="inline-flex h-9 items-center rounded-full border border-primary/35 px-4 text-xs font-medium text-primary">{data?.heroButtonSecondary || 'Pide una cotización'}</span>
              </div>
              <hr className="my-4 border-border" />
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-gold">{data?.servicesLabel || 'Catálogo'}</p>
              <h4 className="mt-1 font-display text-lg font-semibold">{data?.servicesTitle || 'Servicios de maquillaje'}</h4>
              <p className="mt-1 text-xs font-light text-muted-foreground">{data?.servicesDescription}</p>
              <hr className="my-4 border-border" />
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-gold">{data?.contactLabel || 'Contacto'}</p>
              <h4 className="mt-1 font-display text-lg font-semibold">{data?.contactTitle || 'Hablemos de tu evento'}</h4>
              <p className="mt-1 text-xs font-light text-muted-foreground">{data?.coverage}</p>
              {testimonials.length > 0 && (
                <div className="mt-3 flex flex-col gap-2">
                  <p className="text-xs font-semibold">{data?.testimonialsTitle || 'Lo que dicen mis clientas'}</p>
                  {testimonials.slice(0, 2).map((t, i) => {
                    const r = Math.max(1, Math.min(5, Math.round(Number(t.rating) || 5)));
                    return (
                    <div key={i} className="rounded-lg border border-border p-2">
                      <div className="flex items-center gap-1" aria-label={`Calificación: ${r} de 5 estrellas`}>
                        {Array.from({ length: 5 }).map((_, s) => (
                          <Star key={s} className={`h-3 w-3 ${s < r ? 'fill-gold text-gold' : 'fill-none text-gold/35'}`} aria-hidden="true" />
                        ))}
                      </div>
                      <p className="mt-1 text-[10px] font-medium">{t.name} · {t.event}</p>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {error && (
          <p role="alert" className="inline-flex items-center gap-2 rounded-full bg-destructive/10 px-4 py-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" /> {error}
          </p>
        )}
        {saved && (
          <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Contenido guardado. La página principal se actualizó.
          </p>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
          Guardar contenido
        </button>
      </div>
    </SectionShell>
  );
}

export function SectionShell({ title, hint, children, icon: Icon }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-[0_15px_40px_-30px_hsl(var(--primary)/0.35)] sm:p-6">
      <div className="flex items-start gap-3">
        {Icon && (
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        )}
        <div className="flex-1">
          <h2 className="font-display text-lg font-semibold tracking-tight">{title}</h2>
          {hint && <p className="mt-1 text-xs font-light text-muted-foreground">{hint}</p>}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
