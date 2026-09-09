import React, { useEffect, useState, useMemo } from 'react';
import {
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Save,
  RotateCcw,
  Eye,
  Type,
  Palette,
  Image as ImageIcon,
  Upload,
  Trash2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import pb from '@/lib/pocketbaseClient';
import { SectionShell } from '@/components/admin/AdminContent';
import { getFontCatalog } from '@/contexts/SiteDataContext';
import { hslStringToHex, hexToHslString, contrastText } from '@/lib/colorUtils';

const inputClass =
  'h-11 rounded-xl border-input bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring';

const DEFAULT_APPEARANCE = {
  titleFont: 'Cormorant Garamond',
  bodyFont: 'Jost',
  colors: {
    primary: '346 32% 42%',
    secondary: '350 32% 92%',
    background: '30 33% 96%',
    foreground: '20 18% 17%',
    gold: '38 46% 52%',
    button: '346 32% 42%',
  },
};

const COLOR_FIELDS = [
  { k: 'primary', label: 'Color principal' },
  { k: 'secondary', label: 'Color secundario' },
  { k: 'background', label: 'Color de fondo' },
  { k: 'foreground', label: 'Color de texto' },
  { k: 'gold', label: 'Acento dorado' },
  { k: 'button', label: 'Color de botones' },
];

const FONT_CATALOG = getFontCatalog();
const TITLE_FONTS = ['Cormorant Garamond', 'Playfair Display', 'Bodoni Moda', 'Prata', 'Marcellus', 'DM Serif Display', 'Lora'];
const BODY_FONTS = ['Jost', 'Montserrat', 'Poppins', 'Inter', 'Lato', 'Raleway', 'Work Sans'];

function loadFontLink(fontName) {
  const f = FONT_CATALOG[fontName];
  if (!f) return;
  let link = document.getElementById(`admin-font-${fontName}`);
  if (!link) {
    link = document.createElement('link');
    link.id = `admin-font-${fontName}`;
    link.rel = 'stylesheet';
    link.href = f.url;
    document.head.appendChild(link);
  }
}

export default function AdminAppearance() {
  const [recId, setRecId] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [logoUrl, setLogoUrl] = useState(null);
  const [logoAlt, setLogoAlt] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoSaving, setLogoSaving] = useState(false);
  const [logoMsg, setLogoMsg] = useState(null);
  const [heroUrl, setHeroUrl] = useState(null);
  const [heroAlt, setHeroAlt] = useState('');
  const [heroFile, setHeroFile] = useState(null);
  const [heroPreview, setHeroPreview] = useState(null);
  const [heroSaving, setHeroSaving] = useState(false);
  const [heroMsg, setHeroMsg] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const list = await pb.collection('appearance').getFullList({ sort: '-created' });
      const rec = list[0];
      if (rec) {
        setRecId(rec.id);
        const d = typeof rec.data === 'string' ? JSON.parse(rec.data) : rec.data;
        setData(d || DEFAULT_APPEARANCE);
        if (rec.logo) {
          setLogoUrl(pb.files.getURL(rec, rec.logo));
          setLogoAlt(rec.logo_alt || '');
        } else {
          setLogoUrl(null);
          setLogoAlt('');
        }
        if (rec.hero_image) {
          setHeroUrl(pb.files.getURL(rec, rec.hero_image));
          setHeroAlt(rec.hero_image_alt || '');
        } else {
          setHeroUrl(null);
          setHeroAlt('');
        }
      } else {
        setRecId(null);
        setData(DEFAULT_APPEARANCE);
        setLogoUrl(null);
        setLogoAlt('');
        setHeroUrl(null);
        setHeroAlt('');
      }
    } catch (e) {
      setError(e?.message || 'No se pudo cargar la apariencia.');
      setData(DEFAULT_APPEARANCE);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Precarga las fuentes seleccionadas para que la vista previa las muestre.
  useEffect(() => {
    if (data?.titleFont) loadFontLink(data.titleFont);
    if (data?.bodyFont) loadFontLink(data.bodyFont);
  }, [data?.titleFont, data?.bodyFont]);

  const colors = data?.colors || DEFAULT_APPEARANCE.colors;

  const setColor = (k, hex) => {
    setData((d) => ({
      ...(d || DEFAULT_APPEARANCE),
      colors: { ...(d?.colors || DEFAULT_APPEARANCE.colors), [k]: hexToHslString(hex) },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const payload = { data };
      if (recId) {
        await pb.collection('appearance').update(recId, payload);
      } else {
        const rec = await pb.collection('appearance').create(payload);
        setRecId(rec.id);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2800);
    } catch (e) {
      setError(e?.message || 'No se pudo guardar la apariencia.');
    }
    setSaving(false);
  };

  const handleRestore = () => {
    setData(DEFAULT_APPEARANCE);
  };

  const onLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setLogoMsg(null);
  };

  const handleLogoSave = async () => {
    if (!recId) return;
    setLogoSaving(true);
    setLogoMsg(null);
    try {
      let rec;
      if (logoFile) {
        const fd = new FormData();
        fd.append('logo', logoFile);
        fd.append('logo_alt', logoAlt);
        rec = await pb.collection('appearance').update(recId, fd);
        setLogoUrl(pb.files.getURL(rec, rec.logo));
        setLogoFile(null);
        if (logoPreview) URL.revokeObjectURL(logoPreview);
        setLogoPreview(null);
      } else {
        rec = await pb.collection('appearance').update(recId, { logo_alt: logoAlt });
      }
      setLogoMsg({ type: 'success', text: 'Logotipo guardado. La página principal se actualizó.' });
      setTimeout(() => setLogoMsg(null), 2800);
    } catch (e) {
      setLogoMsg({ type: 'error', text: e?.message || 'No se pudo guardar el logotipo.' });
    }
    setLogoSaving(false);
  };

  const handleLogoDelete = async () => {
    if (!recId) return;
    setLogoSaving(true);
    setLogoMsg(null);
    try {
      await pb.collection('appearance').update(recId, { logo: null, logo_alt: '' });
      setLogoUrl(null);
      setLogoAlt('');
      setLogoFile(null);
      if (logoPreview) URL.revokeObjectURL(logoPreview);
      setLogoPreview(null);
      setLogoMsg({ type: 'success', text: 'Logotipo eliminado.' });
      setTimeout(() => setLogoMsg(null), 2800);
    } catch (e) {
      setLogoMsg({ type: 'error', text: e?.message || 'No se pudo eliminar el logotipo.' });
    }
    setLogoSaving(false);
  };

  const onHeroChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (heroPreview) URL.revokeObjectURL(heroPreview);
    setHeroFile(file);
    setHeroPreview(URL.createObjectURL(file));
    setHeroMsg(null);
  };

  const handleHeroSave = async () => {
    if (!recId) return;
    setHeroSaving(true);
    setHeroMsg(null);
    try {
      let rec;
      if (heroFile) {
        const fd = new FormData();
        fd.append('hero_image', heroFile);
        fd.append('hero_image_alt', heroAlt);
        rec = await pb.collection('appearance').update(recId, fd);
        setHeroUrl(pb.files.getURL(rec, rec.hero_image));
        setHeroFile(null);
        if (heroPreview) URL.revokeObjectURL(heroPreview);
        setHeroPreview(null);
      } else {
        rec = await pb.collection('appearance').update(recId, { hero_image_alt: heroAlt });
      }
      setHeroMsg({ type: 'success', text: 'Foto principal guardada. La página de inicio se actualizó.' });
      setTimeout(() => setHeroMsg(null), 2800);
    } catch (e) {
      setHeroMsg({ type: 'error', text: e?.message || 'No se pudo guardar la foto principal.' });
    }
    setHeroSaving(false);
  };

  const handleHeroDelete = async () => {
    if (!recId) return;
    setHeroSaving(true);
    setHeroMsg(null);
    try {
      await pb.collection('appearance').update(recId, { hero_image: null, hero_image_alt: '' });
      setHeroUrl(null);
      setHeroAlt('');
      setHeroFile(null);
      if (heroPreview) URL.revokeObjectURL(heroPreview);
      setHeroPreview(null);
      setHeroMsg({ type: 'success', text: 'Foto principal eliminada. Se mostrará la imagen original.' });
      setTimeout(() => setHeroMsg(null), 2800);
    } catch (e) {
      setHeroMsg({ type: 'error', text: e?.message || 'No se pudo eliminar la foto principal.' });
    }
    setHeroSaving(false);
  };
  const previewStyle = useMemo(() => {
    const c = colors;
    const buttonHex = hslStringToHex(c.button || c.primary);
    const primaryHex = hslStringToHex(c.primary);
    const secondaryHex = hslStringToHex(c.secondary);
    const bgHex = hslStringToHex(c.background);
    const fgHex = hslStringToHex(c.foreground);
    const goldHex = hslStringToHex(c.gold);
    const titleFont = FONT_CATALOG[data?.titleFont]?.family || '"Cormorant Garamond"';
    const bodyFont = FONT_CATALOG[data?.bodyFont]?.family || 'Jost';
    return {
      background: bgHex,
      color: fgHex,
      fontFamily: `${bodyFont}, ui-sans-serif, system-ui, sans-serif`,
      '--p': primaryHex,
      '--s': secondaryHex,
      '--g': goldHex,
      '--btn': buttonHex,
      '--btn-fg': contrastText(buttonHex),
    };
  }, [colors, data?.titleFont, data?.bodyFont]);

  if (loading) {
    return (
      <SectionShell title="Apariencia" hint="Fuentes y paleta de colores de la página principal.">
        <p className="inline-flex items-center gap-2 text-sm font-light text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Cargando apariencia…
        </p>
      </SectionShell>
    );
  }

  return (
    <SectionShell
      title="Apariencia"
      hint="Cambia fuentes y colores de la página principal. Incluye vista previa y restauración del diseño original."
    >
      <div className="flex flex-col gap-6">
        {/* Fuentes */}
        <div className="rounded-xl border border-border bg-background/50 p-4">
          <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-gold">
            <Type className="h-3.5 w-3.5" aria-hidden="true" /> Fuentes
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">Fuente de los títulos</Label>
              <Select value={data?.titleFont || 'Cormorant Garamond'} onValueChange={(v) => setData((d) => ({ ...(d || DEFAULT_APPEARANCE), titleFont: v }))}>
                <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TITLE_FONTS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">Fuente del texto general</Label>
              <Select value={data?.bodyFont || 'Jost'} onValueChange={(v) => setData((d) => ({ ...(d || DEFAULT_APPEARANCE), bodyFont: v }))}>
                <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BODY_FONTS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Colores */}
        <div className="rounded-xl border border-border bg-background/50 p-4">
          <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-gold">
            <Palette className="h-3.5 w-3.5" aria-hidden="true" /> Paleta de colores
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {COLOR_FIELDS.map((cf) => (
              <div key={cf.k} className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5">
                <input
                  type="color"
                  value={hslStringToHex(colors[cf.k] || DEFAULT_APPEARANCE.colors[cf.k])}
                  onChange={(e) => setColor(cf.k, e.target.value)}
                  className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-border bg-transparent p-0"
                  aria-label={cf.label}
                />
                <div className="min-w-0 flex-1">
                  <Label className="text-sm font-medium">{cf.label}</Label>
                  <Input
                    value={hslStringToHex(colors[cf.k] || DEFAULT_APPEARANCE.colors[cf.k])}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (/^#?[0-9a-fA-F]{0,6}$/.test(v)) setColor(cf.k, v.startsWith('#') ? v : `#${v}`);
                    }}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Logotipo */}
        <div className="rounded-xl border border-border bg-background/50 p-4">
          <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-gold">
            <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" /> Logotipo de la página principal
          </p>
          <p className="mt-2 text-xs font-light leading-relaxed text-muted-foreground">
            Sube tu logotipo para mostrarlo en el encabezado, la bienvenida, el menú móvil y el pie de página. Se recomienda PNG o SVG con fondo transparente. Se muestra una vista previa antes de guardar.
          </p>

          <div className="mt-4 flex min-h-[120px] items-center justify-center rounded-xl border border-dashed border-border bg-background p-6">
            {logoPreview || logoUrl ? (
              <img
                src={logoPreview || logoUrl}
                alt={logoAlt || 'Vista previa del logotipo'}
                className="max-h-24 w-auto max-w-full object-contain"
              />
            ) : (
              <p className="text-sm font-light text-muted-foreground">Sin logotipo. Se mostrará el nombre del estudio.</p>
            )}
          </div>

          <div className="mt-3 flex flex-col gap-2">
            <Label className="text-sm font-medium">Texto alternativo (accesibilidad)</Label>
            <Input
              value={logoAlt}
              onChange={(e) => setLogoAlt(e.target.value)}
              className={inputClass}
              placeholder="Ej. Tamara Aldrete · Maquillaje profesional"
            />
          </div>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <label className="inline-flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 text-sm font-medium text-primary transition-colors hover:bg-primary/5">
              <Upload className="h-4 w-4" aria-hidden="true" />
              {logoUrl || logoPreview ? 'Sustituir imagen' : 'Seleccionar imagen'}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                className="hidden"
                onChange={onLogoChange}
              />
            </label>
            {(logoUrl || logoPreview) && (
              <button
                type="button"
                onClick={handleLogoDelete}
                disabled={logoSaving}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" /> Eliminar
              </button>
            )}
          </div>

          {(logoUrl || logoFile) && (
            <button
              type="button"
              onClick={handleLogoSave}
              disabled={logoSaving}
              className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
            >
              {logoSaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
              Guardar logotipo
            </button>
          )}

          {logoMsg && (
            <p
              role={logoMsg.type === 'error' ? 'alert' : 'status'}
              className={`mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm ${logoMsg.type === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}
            >
              {logoMsg.type === 'error' ? <AlertTriangle className="h-4 w-4" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
              {logoMsg.text}
            </p>
          )}
        </div>

        {/* Foto principal de la página de inicio */}
        <div className="rounded-xl border border-border bg-background/50 p-4">
          <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-gold">
            <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" /> Foto principal de la página de inicio
          </p>
          <p className="mt-2 text-xs font-light leading-relaxed text-muted-foreground">
            Sube la imagen que se mostrará como la primera foto de la página principal (junto al título). Se recomienda una foto vertical (retrato) en JPG, PNG o WebP de buena calidad. Se muestra una vista previa antes de guardar.
          </p>

          <div className="mt-4 flex min-h-[220px] items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-background p-4">
            {heroPreview || heroUrl ? (
              <img
                src={heroPreview || heroUrl}
                alt={heroAlt || 'Vista previa de la foto principal'}
                className="max-h-64 w-auto max-w-full rounded-lg object-contain"
              />
            ) : (
              <p className="text-sm font-light text-muted-foreground">Sin foto principal. Se mostrará la imagen original del sitio.</p>
            )}
          </div>

          <div className="mt-3 flex flex-col gap-2">
            <Label className="text-sm font-medium">Texto alternativo (accesibilidad)</Label>
            <Input
              value={heroAlt}
              onChange={(e) => setHeroAlt(e.target.value)}
              className={inputClass}
              placeholder="Ej. Retrato de la maquillista con maquillaje profesional"
            />
          </div>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <label className="inline-flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 text-sm font-medium text-primary transition-colors hover:bg-primary/5">
              <Upload className="h-4 w-4" aria-hidden="true" />
              {heroUrl || heroPreview ? 'Sustituir imagen' : 'Seleccionar imagen'}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                className="hidden"
                onChange={onHeroChange}
              />
            </label>
            {(heroUrl || heroPreview) && (
              <button
                type="button"
                onClick={handleHeroDelete}
                disabled={heroSaving}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" /> Eliminar
              </button>
            )}
          </div>

          {(heroUrl || heroFile) && (
            <button
              type="button"
              onClick={handleHeroSave}
              disabled={heroSaving}
              className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
            >
              {heroSaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
              Guardar foto principal
            </button>
          )}

          {heroMsg && (
            <p
              role={heroMsg.type === 'error' ? 'alert' : 'status'}
              className={`mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm ${heroMsg.type === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}
            >
              {heroMsg.type === 'error' ? <AlertTriangle className="h-4 w-4" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
              {heroMsg.text}
            </p>
          )}
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
            <div className="mt-4 overflow-hidden rounded-2xl border border-border p-6" style={previewStyle}>
              <p className="text-xs font-medium uppercase tracking-[0.22em]" style={{ color: 'var(--g)' }}>Catálogo</p>
              <h3 className="mt-2 text-3xl font-semibold leading-tight" style={{ fontFamily: `${FONT_CATALOG[data?.titleFont]?.family || '"Cormorant Garamond"'}, Georgia, serif` }}>
                Servicios de maquillaje
              </h3>
              <p className="mt-3 max-w-md text-sm font-light opacity-80">
                Cada servicio se adapta a tu estilo, tu piel y tu evento.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex h-10 items-center rounded-full px-5 text-sm font-medium" style={{ background: 'var(--btn)', color: 'var(--btn-fg)' }}>
                  Agenda tu cita
                </span>
                <span className="inline-flex h-10 items-center rounded-full border px-5 text-sm font-medium" style={{ borderColor: 'var(--p)', color: 'var(--p)' }}>
                  Pide una cotización
                </span>
              </div>
              <div className="mt-4 rounded-xl p-3" style={{ background: 'var(--s)' }}>
                <p className="text-sm font-medium">Tarjeta de servicio</p>
                <p className="text-xs font-light opacity-80">$800 – $1,200 MXN · 60–75 min</p>
              </div>
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
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Apariencia guardada. La página principal se actualizó.
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
            Guardar apariencia
          </button>
          <button
            type="button"
            onClick={handleRestore}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border px-6 text-sm font-medium transition-colors hover:bg-secondary"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" /> Restaurar diseño original
          </button>
        </div>
      </div>
    </SectionShell>
  );
}
