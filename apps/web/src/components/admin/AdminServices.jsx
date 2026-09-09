import React, { useEffect, useState, useCallback } from 'react';
import {
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Plus,
  Trash2,
  Pencil,
  Save,
  X,
  Star,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import pb from '@/lib/pocketbaseClient';
import { SectionShell } from '@/components/admin/AdminContent';

const inputClass =
  'h-11 rounded-xl border-input bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring';

// Sin límite artificial de imágenes. El único tope real es el almacenamiento
// del proyecto (tamaño por archivo: 10 MB, configurado en la colección).

function fileUrl(rec, filename) {
  return pb.files.getURL(rec, filename);
}

function normalizeForAdmin(rec) {
  const files = Array.isArray(rec.images) ? rec.images : [];
  const legacy = Array.isArray(rec.legacy_images) ? rec.legacy_images : [];
  return {
    id: rec.id,
    slug: rec.slug || '',
    name: rec.name || '',
    short: rec.short || '',
    description: rec.description || '',
    price: rec.price || '',
    priceAmount: Number(rec.price_amount) || 0,
    duration: rec.duration || '',
    includes: Array.isArray(rec.includes) ? rec.includes : [],
    active: rec.active !== false,
    coverIndex: Number(rec.cover_index) || 0,
    sortOrder: Number(rec.sort_order) || 0,
    files, // nombres de archivo subidos
    legacy, // URLs heredadas
    _rec: rec,
  };
}

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [editing, setEditing] = useState(null); // servicio en edición o "new"
  const [confirmDelete, setConfirmDelete] = useState(null); // { svc, bookingCount }

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const recs = await pb.collection('services').getFullList({ sort: 'sort_order' });
      setServices(recs.map(normalizeForAdmin));
    } catch (e) {
      setError(e?.message || 'No se pudieron cargar los servicios.');
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2800); };

  const startNew = () => {
    setEditing({
      id: null, slug: '', name: '', short: '', description: '', price: '',
      priceAmount: 0, duration: '', includes: [], active: true, coverIndex: 0,
      sortOrder: services.length, files: [], legacy: [], _rec: null,
      _newFiles: [], _keep: [], _previewNew: [],
    });
  };

  const startEdit = (svc) => {
    setEditing({
      ...svc,
      _newFiles: [],
      _keep: [...svc.files], // nombres de archivo a conservar
      _previewNew: [],
    });
  };

  const closeEdit = () => {
    // Limpia previews pendientes al cerrar.
    if (editing?._previewNew) {
      editing._previewNew.forEach((p) => URL.revokeObjectURL(p.url));
    }
    setEditing(null);
  };

  const onPickFiles = (fileList) => {
    if (!editing) return;
    const arr = Array.from(fileList);
    if (arr.length === 0) return;
    const previews = arr.map((f) => ({ url: URL.createObjectURL(f), name: f.name }));
    setEditing((e) => ({
      ...e,
      _newFiles: [...e._newFiles, ...arr],
      _previewNew: [...e._previewNew, ...previews],
    }));
  };

  const removeKept = (filename) => {
    setEditing((e) => {
      const idx = e._keep.indexOf(filename);
      const keep = e._keep.filter((f) => f !== filename);
      // Ajusta coverIndex si la portada estaba después de la eliminada.
      let coverIndex = e.coverIndex;
      if (idx === e.coverIndex) coverIndex = 0;
      else if (idx < e.coverIndex) coverIndex = e.coverIndex - 1;
      return { ...e, _keep: keep, coverIndex };
    });
  };
  const removeNew = (idx) => {
    setEditing((e) => {
      const nf = [...e._newFiles];
      const pn = [...e._previewNew];
      URL.revokeObjectURL(pn[idx]?.url);
      nf.splice(idx, 1);
      pn.splice(idx, 1);
      // Ajusta coverIndex si la portada estaba en una foto nueva.
      const newBase = e._keep.length;
      let coverIndex = e.coverIndex;
      if (coverIndex >= newBase) {
        const newIdx = coverIndex - newBase;
        if (newIdx === idx) coverIndex = 0;
        else if (newIdx > idx) coverIndex = e.coverIndex - 1;
      }
      return { ...e, _newFiles: nf, _previewNew: pn, coverIndex };
    });
  };

  // Reemplaza una foto subida existente por un archivo nuevo.
  const replaceKept = (filename, file) => {
    if (!editing || !file) return;
    setEditing((e) => {
      const idx = e._keep.indexOf(filename);
      if (idx === -1) return e;
      // Quita la vieja de _keep y agrega la nueva al final de _newFiles.
      const keep = e._keep.filter((f) => f !== filename);
      let coverIndex = e.coverIndex;
      if (idx === e.coverIndex) {
        // La nueva foto hereda la portada y queda al final.
        coverIndex = keep.length + e._newFiles.length;
      } else if (idx < e.coverIndex) {
        coverIndex = e.coverIndex - 1;
      }
      const preview = { url: URL.createObjectURL(file), name: file.name };
      return {
        ...e,
        _keep: keep,
        _newFiles: [...e._newFiles, file],
        _previewNew: [...e._previewNew, preview],
        coverIndex,
      };
    });
  };

  // Reordenamiento: mueve una foto (keep o new) en una dirección.
  const movePhoto = (kind, idx, dir) => {
    setEditing((e) => {
      if (kind === 'keep') {
        const keep = [...e._keep];
        const target = idx + dir;
        if (target < 0 || target >= keep.length) return e;
        [keep[idx], keep[target]] = [keep[target], keep[idx]];
        // Mueve coverIndex si corresponde.
        let coverIndex = e.coverIndex;
        if (coverIndex === idx) coverIndex = target;
        else if (coverIndex === target) coverIndex = idx;
        return { ...e, _keep: keep, coverIndex };
      } else {
        const nf = [...e._newFiles];
        const pn = [...e._previewNew];
        const target = idx + dir;
        if (target < 0 || target >= nf.length) return e;
        [nf[idx], nf[target]] = [nf[target], nf[idx]];
        [pn[idx], pn[target]] = [pn[target], pn[idx]];
        const newBase = e._keep.length;
        let coverIndex = e.coverIndex;
        if (coverIndex >= newBase) {
          const ci = coverIndex - newBase;
          if (ci === idx) coverIndex = newBase + target;
          else if (ci === target) coverIndex = newBase + idx;
        }
        return { ...e, _newFiles: nf, _previewNew: pn, coverIndex };
      }
    });
  };

  const setCover = (kind, idx) => {
    setEditing((e) => {
      let pos = 0;
      if (kind === 'keep') pos = idx;
      else pos = e._keep.length + idx;
      return { ...e, coverIndex: pos };
    });
  };

  const setField = (field, value) => setEditing((e) => ({ ...e, [field]: value }));

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.name.trim()) { setError('El nombre del servicio es obligatorio.'); return; }
    setError('');
    const totalImages = editing._keep.length + editing._newFiles.length;

    const fd = new FormData();
    fd.append('slug', editing.slug.trim() || editing.name.trim().toLowerCase().replace(/\s+/g, '-'));
    fd.append('name', editing.name.trim());
    fd.append('short', editing.short || '');
    fd.append('description', editing.description || '');
    fd.append('price', editing.price || '');
    fd.append('price_amount', String(editing.priceAmount || 0));
    fd.append('duration', editing.duration || '');
    fd.append('includes', JSON.stringify(editing.includes || []));
    fd.append('active', editing.active ? 'true' : 'false');
    const safeCover = totalImages > 0 ? Math.min(editing.coverIndex || 0, totalImages - 1) : 0;
    fd.append('cover_index', String(safeCover));
    fd.append('sort_order', String(editing.sortOrder || 0));
    // Conservar archivos existentes (en el orden definido)
    editing._keep.forEach((fn) => fd.append('images', fn));
    // Agregar nuevos
    editing._newFiles.forEach((f) => fd.append('images', f));

    try {
      if (editing.id) {
        await pb.collection('services').update(editing.id, fd);
      } else {
        await pb.collection('services').create(fd);
      }
      showToast('Servicio guardado.');
      closeEdit();
      load();
    } catch (e) {
      setError(e?.message || 'No se pudo guardar el servicio.');
    }
  };

  const toggleActive = async (svc) => {
    try {
      await pb.collection('services').update(svc.id, { active: !svc.active });
      setServices((prev) => prev.map((s) => (s.id === svc.id ? { ...s, active: !s.active } : s)));
      showToast(svc.active ? 'Servicio desactivado.' : 'Servicio activado.');
    } catch (e) {
      setError(e?.message || 'No se pudo cambiar el estado.');
    }
  };

  const askDelete = async (svc) => {
    let bookingCount = 0;
    try {
      const list = await pb.collection('bookings').getFullList({
        filter: pb.filter('service = {:name}', { name: svc.name }),
      });
      bookingCount = list.length;
    } catch (_) { bookingCount = 0; }
    setConfirmDelete({ svc, bookingCount });
  };

  const confirmDeleteYes = async () => {
    if (!confirmDelete) return;
    try {
      await pb.collection('services').delete(confirmDelete.svc.id);
      showToast('Servicio eliminado. Las reservas previas conservan su nombre.');
      setConfirmDelete(null);
      load();
    } catch (e) {
      setError(e?.message || 'No se pudo eliminar el servicio.');
      setConfirmDelete(null);
    }
  };

  const totalPhotos = editing ? editing._keep.length + editing._newFiles.length : 0;

  return (
    <SectionShell
      title="Servicios y fotografías"
      hint="Crea, edita, activa, desactiva y elimina servicios. Cantidad ilimitada de fotos con foto principal, reordenamiento y reemplazo."
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
        ) : (
          <>
            <button
              type="button"
              onClick={startNew}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
            >
              <Plus className="h-4 w-4" aria-hidden="true" /> Crear nuevo servicio
            </button>

            <ul className="flex flex-col gap-3">
              {services.map((svc) => {
                const imgs = svc.files.length > 0
                  ? svc.files.map((fn) => fileUrl(svc._rec, fn))
                  : svc.legacy;
                const cover = imgs[svc.coverIndex] || imgs[0];
                const photoCount = imgs.length;
                return (
                  <li key={svc.id} className="rounded-xl border border-border bg-background/50 p-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="flex shrink-0 gap-2">
                        {cover ? (
                          <img src={cover} alt={svc.name} className="h-16 w-16 rounded-lg object-cover" loading="lazy" />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                            <ImageIcon className="h-5 w-5" aria-hidden="true" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-display text-base font-semibold">{svc.name}</p>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${svc.active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            {svc.active ? 'Activo' : 'Inactivo'}
                          </span>
                          {photoCount > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                              <ImageIcon className="h-3 w-3" aria-hidden="true" /> {photoCount} foto{photoCount === 1 ? '' : 's'}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-xs font-light text-muted-foreground">{svc.short}</p>
                        <p className="mt-0.5 text-xs text-foreground/80">{svc.price} · {svc.duration}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <label className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-medium">
                          <Switch checked={svc.active} onCheckedChange={() => toggleActive(svc)} aria-label="Activar/desactivar" />
                          {svc.active ? 'Activo' : 'Inactivo'}
                        </label>
                        <button type="button" onClick={() => startEdit(svc)} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium transition-colors hover:bg-secondary">
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Editar
                        </button>
                        <button type="button" onClick={() => askDelete(svc)} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-destructive/30 px-3 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10">
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Eliminar
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
              {services.length === 0 && (
                <li className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm font-light text-muted-foreground">
                  Aún no hay servicios. Crea el primero con el botón de arriba.
                </li>
              )}
            </ul>
          </>
        )}
      </div>

      {/* Modal de edición / creación */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && closeEdit()}>
        <DialogContent className="max-h-[92dvh] w-[calc(100vw-1.5rem)] max-w-2xl overflow-y-auto rounded-3xl bg-card p-0">
          {editing && (
            <div className="p-6 sm:p-8">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl font-semibold tracking-tight">
                  {editing.id ? 'Editar servicio' : 'Nuevo servicio'}
                </DialogTitle>
                <DialogDescription className="text-sm font-light text-muted-foreground">
                  Completa los datos y gestiona las fotografías. Sin límite de cantidad.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <Label className="text-sm font-medium">Nombre *</Label>
                  <Input value={editing.name} onChange={(e) => setField('name', e.target.value)} className={inputClass} />
                </div>
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <Label className="text-sm font-medium">Descripción corta (tarjeta)</Label>
                  <Input value={editing.short} onChange={(e) => setField('short', e.target.value)} className={inputClass} />
                </div>
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <Label className="text-sm font-medium">Descripción detallada</Label>
                  <Textarea value={editing.description} onChange={(e) => setField('description', e.target.value)} rows={3} className="rounded-xl border-input bg-background px-3 py-2.5 text-sm focus-visible:ring-2 focus-visible:ring-ring" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium">Precio (texto, ej. $800 – $1,200 MXN)</Label>
                  <Input value={editing.price} onChange={(e) => setField('price', e.target.value)} className={inputClass} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium">Precio para reserva (MXN, número)</Label>
                  <Input type="number" min="0" value={editing.priceAmount} onChange={(e) => setField('priceAmount', Number(e.target.value))} className={inputClass} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium">Duración</Label>
                  <Input value={editing.duration} onChange={(e) => setField('duration', e.target.value)} className={inputClass} placeholder="60–75 min aprox." />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium">Identificador (slug)</Label>
                  <Input value={editing.slug} onChange={(e) => setField('slug', e.target.value)} className={inputClass} placeholder="social, novia, xv…" />
                </div>
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <Label className="text-sm font-medium">Incluye (uno por línea)</Label>
                  <Textarea
                    value={(editing.includes || []).join('\n')}
                    onChange={(e) => setField('includes', e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))}
                    rows={3}
                    className="rounded-xl border-input bg-background px-3 py-2.5 text-sm focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <label className="flex items-center justify-between gap-2 rounded-xl border border-border bg-background px-3 py-2.5 sm:col-span-2">
                  <span className="text-sm font-medium">Servicio activo (visible y reservable)</span>
                  <Switch checked={editing.active} onCheckedChange={(v) => setField('active', v)} aria-label="Activo" />
                </label>
              </div>

              {/* Gestión de fotografías */}
              <div className="mt-6 rounded-xl border border-border bg-background/50 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-gold">Fotografías</p>
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
                    {totalPhotos} foto{totalPhotos === 1 ? '' : 's'}
                  </span>
                </div>
                <p className="mt-1 text-xs font-light text-muted-foreground">
                  Sube todas las que quieras (sin límite). Reordena con las flechas, marca una como principal y reemplaza o elimina cualquiera. Vista previa antes de guardar.
                </p>

                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {/* Fotos subidas existentes */}
                  {editing._keep.map((fn, i) => (
                    <PhotoThumb
                      key={`keep-${fn}-${i}`}
                      src={fileUrl(editing._rec, fn)}
                      isCover={editing.coverIndex === i}
                      onCover={() => setCover('keep', i)}
                      onRemove={() => removeKept(fn)}
                      onReplace={(file) => replaceKept(fn, file)}
                      onMoveLeft={() => movePhoto('keep', i, -1)}
                      onMoveRight={() => movePhoto('keep', i, 1)}
                      canMoveLeft={i > 0}
                      canMoveRight={i < editing._keep.length - 1}
                    />
                  ))}
                  {/* Fotos nuevas (preview) */}
                  {editing._previewNew.map((p, i) => (
                    <PhotoThumb
                      key={`new-${p.name}-${i}`}
                      src={p.url}
                      isCover={editing.coverIndex === editing._keep.length + i}
                      onCover={() => setCover('new', i)}
                      onRemove={() => removeNew(i)}
                      onMoveLeft={() => movePhoto('new', i, -1)}
                      onMoveRight={() => movePhoto('new', i, 1)}
                      canMoveLeft={i > 0}
                      canMoveRight={i < editing._newFiles.length - 1}
                      isNew
                    />
                  ))}
                  {/* Hueco para subir (siempre visible, sin límite) */}
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-primary/40 text-primary transition-colors hover:bg-primary/5">
                    <Plus className="h-5 w-5" aria-hidden="true" />
                    <span className="text-[10px] font-medium text-center leading-tight">Subir foto(s)</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => { onPickFiles(e.target.files); e.target.value = ''; }}
                    />
                  </label>
                </div>

                {editing._keep.length === 0 && editing._newFiles.length === 0 && editing.legacy.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-light text-muted-foreground">Imágenes de ejemplo actuales:</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {editing.legacy.map((url, i) => (
                        <img key={i} src={url} alt="ejemplo" className="h-14 w-14 rounded-lg object-cover opacity-70" loading="lazy" />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
                >
                  <Save className="h-4 w-4" aria-hidden="true" /> Guardar servicio
                </button>
                <button
                  type="button"
                  onClick={closeEdit}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border px-6 text-sm font-medium transition-colors hover:bg-secondary"
                >
                  <X className="h-4 w-4" aria-hidden="true" /> Cancelar
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmación de eliminación */}
      <Dialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-md rounded-3xl bg-card p-0">
          {confirmDelete && (
            <div className="p-6 sm:p-8">
              <DialogHeader>
                <DialogTitle className="font-display text-xl font-semibold">Eliminar «{confirmDelete.svc.name}»</DialogTitle>
                <DialogDescription className="text-sm font-light text-muted-foreground">
                  {confirmDelete.bookingCount > 0 ? (
                    <>
                      Este servicio tiene <strong className="font-medium text-foreground">{confirmDelete.bookingCount}</strong> reserva{confirmDelete.bookingCount === 1 ? '' : 's'} asociada{confirmDelete.bookingCount === 1 ? '' : 's'}. Al eliminarlo, las reservas conservan el nombre del servicio para mantener el historial, pero ya no podrá reservarse de nuevo. ¿Confirmas la eliminación?
                    </>
                  ) : (
                    <>¿Segura que quieres eliminar este servicio? Esta acción no se puede deshacer.</>
                  )}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row-reverse">
                <button type="button" onClick={confirmDeleteYes} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-destructive text-sm font-medium text-destructive-foreground transition-all hover:bg-destructive/90 active:scale-[0.98]">
                  <Trash2 className="h-4 w-4" aria-hidden="true" /> Sí, eliminar
                </button>
                <button type="button" onClick={() => setConfirmDelete(null)} className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border px-5 text-sm font-medium transition-colors hover:bg-secondary">
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SectionShell>
  );
}

function PhotoThumb({
  src,
  isCover,
  onCover,
  onRemove,
  onReplace,
  onMoveLeft,
  onMoveRight,
  canMoveLeft,
  canMoveRight,
  isNew,
}) {
  const replaceInputRef = React.useRef(null);
  return (
    <div className="group relative aspect-square overflow-hidden rounded-xl border border-border">
      <img src={src} alt="foto servicio" className="h-full w-full object-cover" loading="lazy" />
      {isCover && (
        <span className="absolute left-1 top-1 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[9px] font-medium text-primary-foreground">
          <Star className="h-2.5 w-2.5 fill-current" aria-hidden="true" /> Principal
        </span>
      )}
      {isNew && (
        <span className="absolute right-1 top-1 rounded-full bg-gold px-2 py-0.5 text-[9px] font-medium text-accent-foreground">
          Nueva
        </span>
      )}
      {/* Barra de acciones siempre visible en móvil, hover en desktop */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/75 to-transparent p-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
        <button
          type="button"
          onClick={onMoveLeft}
          disabled={!canMoveLeft}
          className="inline-flex h-7 w-7 items-center justify-center rounded bg-background/85 text-foreground disabled:opacity-30"
          aria-label="Mover a la izquierda"
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <div className="flex flex-1 items-center justify-center gap-1">
          <button
            type="button"
            onClick={onCover}
            disabled={isCover}
            className="inline-flex h-7 items-center justify-center gap-1 rounded bg-background/85 px-1.5 text-[10px] font-medium text-foreground disabled:opacity-50"
            aria-label="Marcar como principal"
          >
            <Star className="h-3 w-3" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => replaceInputRef.current?.click()}
            className="inline-flex h-7 w-7 items-center justify-center rounded bg-background/85 text-foreground"
            aria-label="Reemplazar foto"
          >
            <RefreshCw className="h-3 w-3" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex h-7 w-7 items-center justify-center rounded bg-background/85 text-destructive"
            aria-label="Eliminar foto"
          >
            <Trash2 className="h-3 w-3" aria-hidden="true" />
          </button>
        </div>
        <button
          type="button"
          onClick={onMoveRight}
          disabled={!canMoveRight}
          className="inline-flex h-7 w-7 items-center justify-center rounded bg-background/85 text-foreground disabled:opacity-30"
          aria-label="Mover a la derecha"
        >
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onReplace?.(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}
