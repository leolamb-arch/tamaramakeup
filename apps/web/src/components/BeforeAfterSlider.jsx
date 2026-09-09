import React, { useState, useRef, useCallback } from 'react';
import { MoveHorizontal, Sparkles } from 'lucide-react';
import { beforeAfterPairs } from '@/data/lookbook';
import Reveal from '@/components/Reveal';

// Slider "Antes y Después" con barra deslizante horizontal.
// El usuario arrastra el control para comparar las dos fotos.
export default function BeforeAfterSlider() {
  const [active, setActive] = useState(0); // par activo
  const [pos, setPos] = useState(50); // posición del divisor (0–100)
  const dragging = useRef(false);
  const frame = useRef(null);

  const setFromClientX = useCallback((clientX) => {
    const el = frame.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, pct)));
  }, []);

  // Solo se muestran pares con foto propia "antes" y "después"
  // guardada en los datos. Sin fotos propias, la sección completa
  // se oculta (no se usa ningún respaldo de demostración).
  const validPairs = beforeAfterPairs.filter((p) => p.antes && p.despues);
  if (validPairs.length === 0) return null;

  const pair = validPairs[active] || validPairs[0];

  const onPointerDown = (e) => {
    dragging.current = true;
    setFromClientX(e.clientX);
    (e.target).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => dragging.current && setFromClientX(e.clientX);
  const onPointerUp = () => { dragging.current = false; };

  return (
    <section id="antes-y-despues" className="scroll-mt-20 bg-secondary/45 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
        <Reveal>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-gold">Transformaciones</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-5xl">
            Antes y después
          </h2>
          <p className="mt-4 max-w-2xl text-base font-light leading-relaxed text-muted-foreground sm:text-lg">
            Arrastra la barra para comparar el rostro sin maquillaje y con el maquillaje
            profesional terminado. Un cambio como este puede ser tuyo.
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <div
            ref={frame}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            className="relative mt-8 aspect-[4/3] w-full cursor-ew-resize select-none overflow-hidden rounded-3xl border border-border bg-card shadow-[0_25px_60px_-35px_hsl(var(--primary)/0.45)]"
          >
            {/* Después (capa base) */}
            <img
              src={pair.despues}
              alt={pair.despuesAlt}
              className="absolute inset-0 h-full w-full object-cover"
              draggable={false}
            />
            <span className="pointer-events-none absolute bottom-4 right-4 rounded-full bg-background/85 px-3 py-1 text-xs font-medium text-foreground backdrop-blur">
              Después
            </span>

            {/* Antes (capa recortada) */}
            <div
              className="absolute inset-0 h-full w-full overflow-hidden"
              style={{ width: `${pos}%` }}
            >
              <img
                src={pair.antes}
                alt={pair.antesAlt}
                className="absolute inset-0 h-full w-full object-cover"
                style={{ width: `${frame.current?.clientWidth || 100}%` }}
                draggable={false}
              />
              <span className="pointer-events-none absolute bottom-4 left-4 rounded-full bg-background/85 px-3 py-1 text-xs font-medium text-foreground backdrop-blur">
                Antes
              </span>
            </div>

            {/* Barra divisora */}
            <div
              className="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-background/90 shadow-[0_0_0_1px_hsl(var(--primary)/0.4)]"
              style={{ left: `${pos}%`, transform: 'translateX(-50%)' }}
            >
              <span className="absolute top-1/2 left-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-primary shadow-lg">
                <MoveHorizontal className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
          </div>
        </Reveal>

        {/* Selector de par + CTA */}
        {validPairs.length > 1 && (
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {validPairs.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => { setActive(i); setPos(50); }}
                aria-pressed={active === i}
                className={`h-2.5 w-8 rounded-full transition-colors ${
                  active === i ? 'bg-primary' : 'bg-border hover:bg-primary/40'
                }`}
                aria-label={`Ver transformación ${i + 1}`}
              />
            ))}
          </div>
        )}

        <Reveal delay={0.1}>
          <div className="mt-8 flex justify-center">
            <a
              href="#cotizar"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-[0_16px_35px_-14px_hsl(var(--primary)/0.8)] transition-all hover:bg-primary/90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Quiero un cambio como este
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
