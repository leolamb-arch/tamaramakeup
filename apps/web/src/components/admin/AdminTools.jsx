import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  Save,
  AlertTriangle,
  Plus,
  Trash2,
  Calculator,
  Wand2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import pb from '@/lib/pocketbaseClient';
import { calculatorConfig as defaultCalc } from '@/data/calculator';
import {
  quizQuestions as defaultQuizQuestions,
  extrasNote as defaultExtrasNote,
  quizTexts as defaultQuizTexts,
} from '@/data/quiz';
import { SectionShell } from '@/components/admin/AdminContent';

const inputClass =
  'h-11 rounded-xl border-input bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring';

// Carga los servicios publicados para mapearlos en el quiz.
async function loadServices() {
  try {
    const recs = await pb.collection('services').getFullList({ sort: 'sort_order' });
    return recs.map((r) => ({ id: r.slug || r.id, name: r.name || r.slug || r.id }));
  } catch (_) {
    return [];
  }
}

// Mezcla el contenido guardado de la calculadora con los defaults.
function mergeCalculator(saved) {
  const s = saved || {};
  return {
    basePrice: s.basePrice != null ? s.basePrice : defaultCalc.basePrice,
    perPerson: s.perPerson != null ? s.perPerson : defaultCalc.perPerson,
    baseLabel: s.baseLabel ?? defaultCalc.baseLabel,
    perPersonLabel: s.perPersonLabel ?? defaultCalc.perPersonLabel,
    addons:
      Array.isArray(s.addons) && s.addons.length
        ? s.addons.map((a) => ({
            id: a.id || `addon-${Math.random().toString(36).slice(2, 8)}`,
            label: a.label ?? '',
            price: Number(a.price) || 0,
            perPerson: !!a.perPerson,
          }))
        : defaultCalc.addons.map((a) => ({ ...a })),
    currency: { ...defaultCalc.currency, ...(s.currency || {}) },
    texts: { ...defaultCalc.texts, ...(s.texts || {}) },
  };
}

// Mezcla el contenido guardado del quiz con los defaults.
function mergeQuiz(saved) {
  const s = saved || {};
  const questions =
    Array.isArray(s.questions) && s.questions.length
      ? s.questions.map((q) => ({
          id: q.id || `q-${Math.random().toString(36).slice(2, 8)}`,
          question: q.question ?? '',
          options: Array.isArray(q.options)
            ? q.options.map((o) => ({
                id: o.id || `o-${Math.random().toString(36).slice(2, 8)}`,
                label: o.label ?? '',
                service: o.service ?? '',
              }))
            : [],
        }))
      : defaultQuizQuestions.map((q) => ({
          ...q,
          options: q.options.map((o) => ({ ...o })),
        }));
  return {
    questions,
    extrasNote: { ...defaultExtrasNote, ...(s.extrasNote || {}) },
    texts: { ...defaultQuizTexts, ...(s.texts || {}) },
  };
}

// Validación de precios: enteros/decimales no negativos.
function validPrice(v) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0;
}

export default function AdminTools() {
  const [recId, setRecId] = useState(null);
  const [data, setData] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [validation, setValidation] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [list, svcs] = await Promise.all([
        pb.collection('site_content').getFullList({ sort: '-created' }).catch(() => []),
        loadServices(),
      ]);
      const rec = list[0];
      let d = {};
      if (rec) {
        setRecId(rec.id);
        d = typeof rec.data === 'string' ? JSON.parse(rec.data || '{}') : rec.data || {};
      } else {
        setRecId(null);
      }
      // Sembramos los valores por defecto en las partes que falten,
      // así el editor siempre trabaja con estructuras concretas y
      // editar un valor por defecto no vacía el arreglo.
      d.calculator = mergeCalculator(d.calculator);
      d.quiz = mergeQuiz(d.quiz);
      setData(d);
      setServices(svcs);
    } catch (e) {
      setError(e?.message || 'No se pudo cargar la configuración.');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // ── Helpers de actualización ──
  const updateCalc = (path, value) =>
    setData((d) => ({ ...d, calculator: setDeep(d.calculator || {}, path, value) }));

  const updateQuiz = (path, value) =>
    setData((d) => ({ ...d, quiz: setDeep(d.quiz || {}, path, value) }));

  // Add-ons de la calculadora
  const updateAddon = (i, field, value) =>
    updateCalc(
      'addons',
      (data.calculator.addons || []).map((a, idx) =>
        idx === i ? { ...a, [field]: field === 'price' ? Number(value) : value } : a,
      ),
    );
  const addAddon = () =>
    updateCalc('addons', [
      ...(data.calculator.addons || []),
      { id: `addon-${Math.random().toString(36).slice(2, 8)}`, label: 'Nuevo servicio', price: 0, perPerson: false },
    ]);
  const removeAddon = (i) =>
    updateCalc('addons', (data.calculator.addons || []).filter((_, idx) => idx !== i));

  // Preguntas del quiz
  const updateQuestion = (qi, value) =>
    updateQuiz(
      'questions',
      (data.quiz.questions || []).map((q, idx) => (idx === qi ? { ...q, question: value } : q)),
    );
  const updateOption = (qi, oi, field, value) =>
    updateQuiz(
      'questions',
      (data.quiz.questions || []).map((q, idx) =>
        idx === qi
          ? {
              ...q,
              options: q.options.map((o, oidx) =>
                oidx === oi ? { ...o, [field]: value } : o,
              ),
            }
          : q,
      ),
    );
  const addOption = (qi) =>
    updateQuiz(
      'questions',
      (data.quiz.questions || []).map((q, idx) =>
        idx === qi
          ? { ...q, options: [...q.options, { id: `o-${Math.random().toString(36).slice(2, 8)}`, label: 'Nueva opción', service: '' }] }
          : q,
      ),
    );
  const removeOption = (qi, oi) =>
    updateQuiz(
      'questions',
      (data.quiz.questions || []).map((q, idx) =>
        idx === qi ? { ...q, options: q.options.filter((_, oidx) => oidx !== oi) } : q,
      ),
    );
  const addQuestion = () =>
    updateQuiz('questions', [
      ...(data.quiz.questions || []),
      { id: `q-${Math.random().toString(36).slice(2, 8)}`, question: 'Nueva pregunta', options: [] },
    ]);
  const removeQuestion = (qi) =>
    updateQuiz('questions', (data.quiz.questions || []).filter((_, idx) => idx !== qi));

  // ── Validación antes de guardar ──
  const validate = () => {
    const c = data.calculator || {};
    if (!validPrice(c.basePrice)) return 'El precio base debe ser un número válido (≥ 0).';
    if (!validPrice(c.perPerson)) return 'El precio por persona debe ser un número válido (≥ 0).';
    for (const a of c.addons || []) {
      if (!validPrice(a.price)) return `El precio del add-on "${a.label || ''}" debe ser ≥ 0.`;
      if (!String(a.label || '').trim()) return 'Todos los add-ons necesitan un nombre.';
    }
    const q = data.quiz || {};
    for (const question of q.questions || []) {
      if (!String(question.question || '').trim()) return 'Todas las preguntas necesitan texto.';
      for (const o of question.options || []) {
        if (!String(o.label || '').trim()) return 'Todas las opciones necesitan un nombre.';
      }
    }
    return '';
  };

  const handleSave = async () => {
    const v = validate();
    if (v) {
      setValidation(v);
      setSaved(false);
      return;
    }
    setValidation('');
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      // Conserva el resto del contenido; solo actualiza calculator y quiz.
      const payload = { data };
      if (recId) {
        await pb.collection('site_content').update(recId, payload);
      } else {
        const rec = await pb.collection('site_content').create(payload);
        setRecId(rec.id);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2800);
    } catch (e) {
      setError(e?.message || 'No se pudo guardar la configuración.');
    }
    setSaving(false);
  };

  const calc = data?.calculator || {};
  const quiz = data?.quiz || {};
  const calcTexts = { ...defaultCalc.texts, ...(calc.texts || {}) };
  const quizTexts = { ...defaultQuizTexts, ...(quiz.texts || {}) };
  const extrasNote = { ...defaultExtrasNote, ...(quiz.extrasNote || {}) };
  const questions = Array.isArray(quiz.questions) && quiz.questions.length ? quiz.questions : defaultQuizQuestions;

  if (loading) {
    return (
      <SectionShell title="Cotización grupal y Quiz" hint="Edita precios, textos y opciones.">
        <p className="inline-flex items-center gap-2 text-sm font-light text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Cargando configuración…
        </p>
      </SectionShell>
    );
  }

  return (
    <SectionShell
      title="Cotización grupal y Quiz"
    >
      <div className="flex flex-col gap-6">
        {/* ═══════════════ CALCULADORA GRUPAL ═══════════════ */}
        <SubGroup icon={Calculator} title="Cotización grupal">
          {/* Precios */}
          <FieldGroup label="Precios y tarifas">
            <NumField
              label="Precio base del paquete (MXN)"
              value={calc.basePrice ?? defaultCalc.basePrice}
              onChange={(v) => updateCalc('basePrice', v)}
            />
            <NumField
              label="Precio por acompañante adicional (MXN)"
              value={calc.perPerson ?? defaultCalc.perPerson}
              onChange={(v) => updateCalc('perPerson', v)}
            />
          </FieldGroup>

          {/* Etiquetas */}
          <FieldGroup label="Etiquetas de precios">
            <TxtField
              label="Etiqueta del paquete base"
              value={calc.baseLabel ?? defaultCalc.baseLabel}
              onChange={(v) => updateCalc('baseLabel', v)}
            />
            <TxtField
              label="Etiqueta del acompañante adicional"
              value={calc.perPersonLabel ?? defaultCalc.perPersonLabel}
              onChange={(v) => updateCalc('perPersonLabel', v)}
            />
          </FieldGroup>

          {/* Moneda */}
          <FieldGroup label="Moneda">
            <TxtField
              label="Código de moneda (ej. MXN)"
              value={calc.currency?.code ?? defaultCalc.currency.code}
              onChange={(v) => updateCalc('currency.code', v)}
            />
            <TxtField
              label="Región (ej. es-MX)"
              value={calc.currency?.locale ?? defaultCalc.currency.locale}
              onChange={(v) => updateCalc('currency.locale', v)}
            />
          </FieldGroup>

          {/* Add-ons */}
          <FieldGroup label="Servicios adicionales (add-ons)">
            <div className="flex flex-col gap-3">
              {(calc.addons || defaultCalc.addons).map((a, i) => (
                <div key={a.id || i} className="rounded-xl border border-border p-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-medium">Nombre del add-on</Label>
                      <Input
                        value={a.label || ''}
                        onChange={(e) => updateAddon(i, 'label', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-medium">Precio (MXN)</Label>
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        value={a.price}
                        onChange={(e) => updateAddon(i, 'price', e.target.value)}
                        className={inputClass}
                        aria-invalid={!validPrice(a.price)}
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <label className="inline-flex items-center gap-2 text-xs font-medium">
                      <Switch
                        checked={!!a.perPerson}
                        onCheckedChange={(v) => updateAddon(i, 'perPerson', v)}
                        aria-label="Cobrar por persona"
                      />
                      Cobrar por cada persona
                    </label>
                    <button
                      type="button"
                      onClick={() => removeAddon(i)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Eliminar
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addAddon}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
              >
                <Plus className="h-4 w-4" aria-hidden="true" /> Agregar add-on
              </button>
            </div>
          </FieldGroup>

          {/* Textos visibles */}
          <FieldGroup label="Textos visibles de la sección">
            <TxtField label="Etiqueta pequeña" value={calcTexts.sectionLabel} onChange={(v) => updateCalc('texts.sectionLabel', v)} />
            <TxtField label="Título" value={calcTexts.title} onChange={(v) => updateCalc('texts.title', v)} />
            <TxtField label="Descripción" value={calcTexts.description} onChange={(v) => updateCalc('texts.description', v)} textarea />
            <TxtField label="Etiqueta del contador" value={calcTexts.counterLabel} onChange={(v) => updateCalc('texts.counterLabel', v)} />
            <TxtField label="Nota bajo el contador (usa {price} para el precio)" value={calcTexts.counterNote} onChange={(v) => updateCalc('texts.counterNote', v)} />
            <TxtField label="Etiqueta de servicios adicionales" value={calcTexts.addonsLabel} onChange={(v) => updateCalc('texts.addonsLabel', v)} />
            <TxtField label="Etiqueta del desglose" value={calcTexts.breakdownLabel} onChange={(v) => updateCalc('texts.breakdownLabel', v)} />
            <TxtField label="Etiqueta del total" value={calcTexts.totalLabel} onChange={(v) => updateCalc('texts.totalLabel', v)} />
            <TxtField label="Texto del botón" value={calcTexts.button} onChange={(v) => updateCalc('texts.button', v)} />
            <TxtField label="Saludo del mensaje de WhatsApp (usa {name})" value={calcTexts.whatsappGreeting} onChange={(v) => updateCalc('texts.whatsappGreeting', v)} />
            <TxtField label="Etiqueta «acompañantes» en WhatsApp" value={calcTexts.whatsappExtrasLabel} onChange={(v) => updateCalc('texts.whatsappExtrasLabel', v)} />
            <TxtField label="Etiqueta «total» en WhatsApp" value={calcTexts.whatsappTotalLabel} onChange={(v) => updateCalc('texts.whatsappTotalLabel', v)} />
            <TxtField label="Cierre del mensaje de WhatsApp" value={calcTexts.whatsappFooter} onChange={(v) => updateCalc('texts.whatsappFooter', v)} />
          </FieldGroup>
        </SubGroup>

        {/* ═══════════════ QUIZ ═══════════════ */}
        <SubGroup icon={Wand2} title="Encuentra tu look ideal">
          {/* Preguntas y opciones */}
          <FieldGroup label="Preguntas y opciones">
            <div className="flex flex-col gap-4">
              {questions.map((q, qi) => (
                <div key={q.id || qi} className="rounded-xl border border-border p-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                      {qi + 1}
                    </span>
                    <Input
                      value={q.question || ''}
                      onChange={(e) => updateQuestion(qi, e.target.value)}
                      className={inputClass}
                      aria-label={`Texto de la pregunta ${qi + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeQuestion(qi)}
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
                      aria-label="Eliminar pregunta"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="mt-3 flex flex-col gap-2">
                    <p className="text-xs font-medium text-muted-foreground">Opciones de respuesta</p>
                    {(q.options || []).map((o, oi) => (
                      <div key={o.id || oi} className="flex flex-col gap-2 rounded-lg border border-border p-2 sm:flex-row sm:items-center">
                        <Input
                          value={o.label || ''}
                          onChange={(e) => updateOption(qi, oi, 'label', e.target.value)}
                          className={inputClass}
                          placeholder="Texto de la opción"
                          aria-label={`Texto de la opción ${oi + 1}`}
                        />
                        <div className="flex items-center gap-2">
                          <Select
                            value={o.service || 'none'}
                            onValueChange={(v) => updateOption(qi, oi, 'service', v === 'none' ? '' : v)}
                          >
                            <SelectTrigger className={`${inputClass} min-w-[160px]`} aria-label="Servicio recomendado">
                              <SelectValue placeholder="Sin servicio" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sin servicio</SelectItem>
                              {services.map((s) => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <button
                            type="button"
                            onClick={() => removeOption(qi, oi)}
                            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
                            aria-label="Eliminar opción"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addOption(qi)}
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 text-xs font-medium text-primary transition-colors hover:bg-primary/5"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Agregar opción
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addQuestion}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
              >
                <Plus className="h-4 w-4" aria-hidden="true" /> Agregar pregunta
              </button>
              <p className="text-xs font-light text-muted-foreground">
                La primera pregunta determina el servicio recomendado: asigna un servicio a cada opción con el selector «Servicio recomendado».
              </p>
            </div>
          </FieldGroup>

          {/* Notas de extras */}
          <FieldGroup label="Notas según la respuesta de extras">
            <TxtField label="Nota: Solo maquillaje" value={extrasNote.solo || ''} onChange={(v) => updateQuiz('extrasNote.solo', v)} />
            <TxtField label="Nota: Maquillaje y Peinado" value={extrasNote.peinado || ''} onChange={(v) => updateQuiz('extrasNote.peinado', v)} />
            <TxtField label="Nota: Solo Peinado" value={extrasNote.solopeinado || ''} onChange={(v) => updateQuiz('extrasNote.solopeinado', v)} />
            <TxtField label="Nota: Paquete Grupal" value={extrasNote.grupal || ''} onChange={(v) => updateQuiz('extrasNote.grupal', v)} />
          </FieldGroup>

          {/* Textos visibles del quiz */}
          <FieldGroup label="Textos visibles del quiz">
            <TxtField label="Etiqueta pequeña" value={quizTexts.sectionLabel} onChange={(v) => updateQuiz('texts.sectionLabel', v)} />
            <TxtField label="Título" value={quizTexts.title} onChange={(v) => updateQuiz('texts.title', v)} />
            <TxtField label="Descripción" value={quizTexts.description} onChange={(v) => updateQuiz('texts.description', v)} textarea />
            <TxtField label="Texto del botón principal" value={quizTexts.button} onChange={(v) => updateQuiz('texts.button', v)} />
            <TxtField label="Nota cuando faltan respuestas" value={quizTexts.noteIncomplete} onChange={(v) => updateQuiz('texts.noteIncomplete', v)} />
            <TxtField label="Etiqueta del resultado" value={quizTexts.resultLabel} onChange={(v) => updateQuiz('texts.resultLabel', v)} />
            <TxtField label="Etiqueta «Precio estimado»" value={quizTexts.priceLabel} onChange={(v) => updateQuiz('texts.priceLabel', v)} />
            <TxtField label="Etiqueta «Tiempo requerido»" value={quizTexts.durationLabel} onChange={(v) => updateQuiz('texts.durationLabel', v)} />
            <TxtField label="Etiqueta «Servicios»" value={quizTexts.servicesLabel} onChange={(v) => updateQuiz('texts.servicesLabel', v)} />
            <TxtField label="Texto del botón «Reservar»" value={quizTexts.ctaButton} onChange={(v) => updateQuiz('texts.ctaButton', v)} />
            <TxtField label="Texto del botón «Volver a responder»" value={quizTexts.resetButton} onChange={(v) => updateQuiz('texts.resetButton', v)} />
          </FieldGroup>
        </SubGroup>

        {/* Mensajes y guardar */}
        {validation && (
          <p role="alert" className="inline-flex items-center gap-2 rounded-full bg-destructive/10 px-4 py-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" /> {validation}
          </p>
        )}
        {error && (
          <p role="alert" className="inline-flex items-center gap-2 rounded-full bg-destructive/10 px-4 py-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" /> {error}
          </p>
        )}
        {saved && (
          <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Configuración guardada. La página principal se actualizó.
          </p>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
          Guardar cotización y quiz
        </button>
      </div>
    </SectionShell>
  );
}

// ────────────────────────────────────────────────────────────
// Componentes auxiliares
// ────────────────────────────────────────────────────────────

function setDeep(obj, path, value) {
  const keys = path.split('.');
  const next = Array.isArray(obj) ? [...obj] : { ...obj };
  let cur = next;
  for (let i = 0; i < keys.length - 1; i++) {
    cur[keys[i]] = { ...(cur[keys[i]] || {}) };
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
  return next;
}

function SubGroup({ icon: Icon, title, children }) {
  return (
    <div className="rounded-xl border border-border bg-background/50 p-4">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-gold">{title}</p>
      </div>
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </div>
  );
}

function FieldGroup({ label, children }) {
  return (
    <div className="rounded-lg border border-border/70 p-3">
      <p className="text-xs font-semibold text-foreground">{label}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function TxtField({ label, value, onChange, textarea }) {
  return (
    <div className={textarea ? 'sm:col-span-2 flex flex-col gap-1.5' : 'flex flex-col gap-1.5'}>
      <Label className="text-xs font-medium">{label}</Label>
      {textarea ? (
        <Textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className="rounded-xl border-input bg-background px-3 py-2.5 text-sm focus-visible:ring-2 focus-visible:ring-ring"
        />
      ) : (
        <Input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      )}
    </div>
  );
}

function NumField({ label, value, onChange }) {
  const n = Number(value);
  const invalid = !Number.isFinite(n) || n < 0;
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <Input
        type="number"
        min={0}
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
        aria-invalid={invalid}
      />
      {invalid && (
        <p className="text-[11px] text-destructive">Ingresa un número válido (≥ 0).</p>
      )}
    </div>
  );
}
