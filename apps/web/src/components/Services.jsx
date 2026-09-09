import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock, Check, Images } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useSiteData } from '@/contexts/SiteDataContext';
import { formatCurrency } from '@/lib/format';
import Reveal from '@/components/Reveal';

export default function Services() {
  const { site, activeServices, loading } = useSiteData();
  const services = activeServices;
  const [active, setActive] = useState(null); // servicio abierto en el modal
  const [photo, setPhoto] = useState(null); // índice de foto ampliada

  // Mientras se consultan los datos Live de PocketBase se mantiene una
  // estructura estable (esqueletos) para evitar pantallas en blanco o
  // saltos de layout. Nunca se muestran imágenes predeterminadas ni
  // contenido temporal de Hostinger durante la carga.
  const skeletons = [0, 1, 2, 3, 4, 5];

  const openPhoto = (i) => setPhoto(i);
  const closePhoto = () => setPhoto(null);
  const stepPhoto = (dir) => {
    if (!active || photo === null) return;
    const total = active.images.length;
    setPhoto((photo + dir + total) % total);
  };

  return (
    <section id="servicios" className="relative scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <Reveal>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-gold">{site.servicesLabel || 'Catálogo'}</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-5xl">
            {site.servicesTitle || 'Servicios de maquillaje'}
          </h2>
          <p className="mt-4 max-w-2xl text-base font-light leading-relaxed text-muted-foreground sm:text-lg">
            {site.servicesDescription || 'Cada servicio se adapta a tu estilo, tu piel y tu evento. Toca una tarjeta para ver la galería de trabajos y los detalles.'}
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? skeletons.map((i) => (
                <div
                  key={`skel-${i}`}
                  className="flex h-full w-full flex-col overflow-hidden rounded-3xl border border-border bg-card"
                  aria-hidden="true"
                >
                  <div className="aspect-[4/3] w-full animate-pulse bg-secondary" />
                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <div className="h-7 w-2/3 animate-pulse rounded-full bg-secondary" />
                    <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-secondary/70" />
                    <div className="mt-2 h-4 w-4/5 animate-pulse rounded-full bg-secondary/70" />
                    <div className="mt-4 h-8 w-28 animate-pulse rounded-full bg-secondary" />
                  </div>
                </div>
              ))
            : (<>
            {services.map((s, i) => (
            <Reveal key={s.id} delay={Math.min(i * 0.06, 0.3)}>
              <button
                type="button"
                onClick={() => setActive(s)}
                aria-haspopup="dialog"
                className="group flex h-full w-full flex-col overflow-hidden rounded-3xl border border-border bg-card text-left shadow-[0_18px_45px_-30px_hsl(var(--primary)/0.4)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_30px_60px_-28px_hsl(var(--primary)/0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.99]"
              >
                <div className="relative overflow-hidden">
                  {s.images.length > 0 ? (
                    <img
                      src={s.thumbs[0]}
                      alt={`Ejemplo de ${s.name}`}
                      className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex aspect-[4/3] w-full items-center justify-center bg-secondary">
                      <Images className="h-8 w-8 text-secondary-foreground/50" aria-hidden="true" />
                    </div>
                  )}
                  {s.images.length > 0 && (
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-background/85 px-3 py-1 text-xs font-medium text-foreground backdrop-blur">
                      <Images className="h-3.5 w-3.5" aria-hidden="true" />
                      Ver galería
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <h3 className="font-display text-2xl font-semibold tracking-tight">{s.name}</h3>
                  <p className="mt-2 flex-1 text-sm font-light leading-relaxed text-muted-foreground">
                    {s.short}
                  </p>
                  <div className="mt-4 flex flex-col gap-2">
                    {s.priceAmount > 0 && (
                      <p className="inline-flex w-fit items-center rounded-full bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground">
                        Reserva {formatCurrency(s.priceAmount)}
                      </p>
                    )}
                    {s.price && (
                      <p className="inline-flex w-fit items-center rounded-full bg-secondary px-3.5 py-1.5 text-sm font-medium text-secondary-foreground">
                        {s.price}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            </Reveal>
            ))}
            {services.length === 0 && (
              <p className="col-span-full rounded-2xl border border-dashed border-border bg-secondary/40 px-6 py-10 text-center text-sm font-light text-muted-foreground">
                Aún no se han publicado servicios con fotografías.
              </p>
            )}
            </>
            )}
        </div>
      </div>

      {/* Modal del servicio */}
      <Dialog
        open={!!active}
        onOpenChange={(open) => {
          if (!open) {
            setActive(null);
            setPhoto(null);
          }
        }}
      >
        <DialogContent className="max-h-[90dvh] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto rounded-3xl bg-card p-0">
          {active && (
            <div className="p-6 sm:p-8">
              <DialogHeader>
                <DialogTitle className="font-display text-3xl font-semibold tracking-tight">
                  {active.name}
                </DialogTitle>
                <DialogDescription className="text-base font-light leading-relaxed text-muted-foreground">
                  {active.description}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                {active.priceAmount > 0 && (
                  <span className="inline-flex items-center rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground">
                    Reserva {formatCurrency(active.priceAmount)}
                  </span>
                )}
                {active.price && (
                  <span className="inline-flex items-center rounded-full bg-secondary px-4 py-1.5 text-sm font-medium text-secondary-foreground">
                    {active.price}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  {active.duration}
                </span>
              </div>

              <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                {active.includes.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-foreground/85">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>

              <p className="mt-7 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-gold">
                Galería de trabajos
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium normal-case tracking-normal text-secondary-foreground">
                  {active.images.length} foto{active.images.length === 1 ? '' : 's'}
                </span>
              </p>
              {active.images.length > 0 ? (
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4">
                  {active.images.map((src, i) => (
                    <motion.button
                      key={src}
                      type="button"
                      onClick={() => openPhoto(i)}
                      aria-label={`Ampliar foto ${i + 1} de ${active.name}`}
                      className="overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <img
                        src={active.thumbs[i]}
                        alt={`${active.name} — ejemplo ${i + 1}`}
                        className="aspect-square w-full object-cover"
                        loading="lazy"
                      />
                    </motion.button>
                  ))}
                </div>
              ) : (
                <p className="mt-3 rounded-xl border border-dashed border-border bg-secondary/40 px-4 py-6 text-center text-sm font-light text-muted-foreground">
                  Aún no se han agregado fotografías a este servicio.
                </p>
              )}

              <a
                href="#cotizar"
                onClick={() => setActive(null)}
                className="mt-7 flex h-12 items-center justify-center rounded-full bg-primary text-base font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Cotizar {active.name.toLowerCase()}
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Visor de foto ampliada */}
      <Dialog open={photo !== null} onOpenChange={(open) => !open && closePhoto()}>
        <DialogContent
          className="w-[calc(100vw-1.5rem)] max-w-3xl border-none bg-transparent p-0 shadow-none"
          aria-label="Foto ampliada"
        >
          {active && photo !== null && (
            <div className="relative">
              <motion.img
                key={active.images[photo]}
                src={active.images[photo]}
                alt={`${active.name} — foto ${photo + 1} ampliada`}
                className="max-h-[78dvh] w-full rounded-2xl object-contain"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              />
              <div className="mt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => stepPhoto(-1)}
                  aria-label="Foto anterior"
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-card text-foreground shadow-lg transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <span className="rounded-full bg-card/90 px-4 py-1.5 text-sm font-medium text-foreground">
                  {photo + 1} / {active.images.length}
                </span>
                <button
                  type="button"
                  onClick={() => stepPhoto(1)}
                  aria-label="Foto siguiente"
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-card text-foreground shadow-lg transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
