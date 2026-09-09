import React from 'react';
import { ExternalLink, Palette } from 'lucide-react';
import { products } from '@/data/products';
import Reveal from '@/components/Reveal';

// Ficha de productos y colorimetría: preparación de piel y labiales
// para retocar durante el evento, con enlace editable (afiliado/catálogo).
export default function Products() {
  // Solo se muestran productos con foto propia guardada en los datos.
  // Sin fotos propias, la sección completa se oculta (no se usa ningún
  // respaldo de demostración).
  const visibleProducts = products.filter((p) => p.image);
  if (visibleProducts.length === 0) return null;

  return (
    <section id="productos" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <Reveal>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-gold">Productos y colorimetría</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-5xl">
            Lo que recomiendo para tu evento
          </h2>
          <p className="mt-4 max-w-2xl text-base font-light leading-relaxed text-muted-foreground sm:text-lg">
            Productos de preparación de piel y labiales ideales para retocar durante el evento.
            Seleccionados según tu colorimetría para que luzcas impecable toda la noche.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {visibleProducts.map((p, i) => (
            <Reveal key={p.id} delay={Math.min(i * 0.06, 0.24)}>
              <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-[0_18px_45px_-30px_hsl(var(--primary)/0.4)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_30px_60px_-28px_hsl(var(--primary)/0.55)]">
                <div className="relative overflow-hidden">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="aspect-square w-full object-cover"
                    loading="lazy"
                  />
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-background/85 px-3 py-1 text-xs font-medium text-foreground backdrop-blur">
                    <Palette className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
                    {p.category}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-display text-xl font-semibold tracking-tight">{p.name}</h3>
                  <p className="mt-2 flex-1 text-sm font-light leading-relaxed text-muted-foreground">
                    {p.description}
                  </p>
                  <a
                    href={p.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 self-start rounded-full border border-primary/35 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-secondary active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {p.linkLabel}
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
