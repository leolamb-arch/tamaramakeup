import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, SkipForward, Sparkles } from 'lucide-react';
import { tutorialSteps, TUTORIAL_STORAGE_KEY } from '@/data/tutorial';
import { cn } from '@/lib/utils';

// Overlay modal con recorrido guiado de 5 pasos y "spotlight" que resalta
// la sección de la página a la que se refiere cada paso.
//
// Diseño mobile-first:
//  - En móvil el panel se ancla al borde inferior (estilo bottom-sheet),
//    ocupa un ancho seguro dentro del viewport y nunca se corta.
//  - En escritorio el panel flota junto al elemento resaltado.
//  - Todos los controles (cerrar, anterior, siguiente, omitir) tienen
//    tamaño táctil cómodo (≥44px) y posición consistente.
const MOBILE_BREAKPOINT = 768;

export default function WelcomeTutorial() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState(null); // rect del elemento resaltado
  const [cardPos, setCardPos] = useState({ top: null, left: null, width: null });
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
  );
  const cardRef = useRef(null);

  const total = tutorialSteps.length;
  const current = tutorialSteps[step];
  const isLast = step === total - 1;

  // Abrir automáticamente solo en la primera visita.
  useEffect(() => {
    try {
      if (!localStorage.getItem(TUTORIAL_STORAGE_KEY)) {
        // pequeño retardo para que el layout termine de pintar
        const t = setTimeout(() => setOpen(true), 600);
        return () => clearTimeout(t);
      }
    } catch {
      // localStorage no disponible: no abrimos automáticamente.
    }
  }, []);

  // Permitir reabrir el tutorial desde el botón de Ayuda (cualquier parte del sitio).
  useEffect(() => {
    const onOpen = () => {
      setStep(0);
      setOpen(true);
    };
    window.addEventListener('open-tutorial', onOpen);
    return () => window.removeEventListener('open-tutorial', onOpen);
  }, []);

  // Mantener el flag de móvil sincronizado con el viewport.
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    try {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
    } catch {
      /* noop */
    }
  }, []);

  const next = useCallback(() => {
    if (isLast) {
      close();
    } else {
      setStep((s) => Math.min(s + 1, total - 1));
    }
  }, [isLast, close, total]);

  const prev = useCallback(() => setStep((s) => Math.max(s - 1, 0)), []);

  // Bloquear scroll del body mientras el tutorial está abierto.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  // Calcular el rect del elemento destino y posicionar la tarjeta.
  const measure = useCallback(() => {
    if (!open) return;
    const targetSel = current.target;

    if (targetSel) {
      const el = document.querySelector(targetSel);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // tras el scroll, medir (espera un frame)
        requestAnimationFrame(() => {
          const r = el.getBoundingClientRect();
          setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
        });
        return;
      }
    }
    setRect(null);
  }, [open, current.target]);

  useLayoutEffect(() => {
    if (!open) return;
    // medir tras pintar y tras scroll
    measure();
    const t = setTimeout(measure, 350); // después de smooth scroll
    return () => clearTimeout(t);
  }, [open, step, measure]);

  // Reposicionar al cambiar tamaño de viewport.
  useEffect(() => {
    if (!open) return;
    const onResize = () => measure();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [open, measure]);

  // Posicionar la tarjeta según el rect y su propio tamaño (solo escritorio).
  useLayoutEffect(() => {
    if (!open || isMobile) return;
    const card = cardRef.current;
    const cardH = card ? card.offsetHeight : 260;
    const cardW = card ? card.offsetWidth : Math.min(window.innerWidth - 32, 448);
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 16;

    if (!rect) {
      // sin destino: centrar en viewport
      setCardPos({ top: null, left: null, width: null });
      return;
    }

    let top;
    const below = rect.top + rect.height + 16;
    const above = rect.top - cardH - 16;
    if (below + cardH <= vh - margin) {
      top = below;
    } else if (above >= margin) {
      top = above;
    } else {
      // no cabe arriba ni abajo: colocar en el espacio mayor
      top = above < margin ? margin : Math.max(margin, vh - cardH - margin);
    }
    top = Math.max(margin, Math.min(top, vh - cardH - margin));

    let left = rect.left + rect.width / 2 - cardW / 2;
    left = Math.max(margin, Math.min(left, vw - cardW - margin));

    setCardPos({ top, left, width: cardW });
  }, [open, rect, isMobile, step]);

  // Cerrar con tecla Escape y navegar con flechas.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close, next, prev]);

  const spotlightStyle = rect
    ? {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      }
    : null;

  // En móvil el panel se ancla abajo; en escritorio flota o se centra.
  const cardClassName = isMobile
    ? cn(
        'fixed inset-x-0 bottom-0 z-10 w-full rounded-t-[1.75rem] border border-border bg-card px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_-20px_50px_-20px_hsl(var(--primary)/0.4)]',
        !rect && 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'
      )
    : cn(
        'absolute z-10 w-[min(92vw,28rem)] rounded-2xl border border-border bg-card p-5 shadow-[0_30px_60px_-20px_hsl(var(--primary)/0.45)] sm:p-6',
        !rect && 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'
      );

  const cardStyle = !isMobile && rect ? { top: cardPos.top, left: cardPos.left, width: cardPos.width } : undefined;

  // Variantes de entrada según dispositivo.
  const cardMotion = isMobile
    ? {
        initial: { opacity: 0, y: '100%' },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: '100%' },
        transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
      }
    : {
        initial: { opacity: 0, y: 16, scale: 0.97 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -10 },
        transition: { duration: 0.28, ease: 'easeOut' },
      };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="tutorial-title"
        >
          {/* Fondo oscuro semitransparente (siempre presente; en móvil también
              para dar contraste al panel anclado abajo). */}
          <div
            className="absolute inset-0 bg-foreground/55 backdrop-blur-[2px]"
            onClick={close}
            aria-hidden="true"
          />

          {/* Spotlight: el box-shadow crea el "agujero" y oscurece el resto */}
          {spotlightStyle && (
            <motion.div
              className="absolute rounded-xl border-2 border-gold"
              style={{ ...spotlightStyle, boxShadow: '0 0 0 9999px hsl(var(--foreground) / 0.55)' }}
              onClick={close}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              aria-hidden="true"
            />
          )}

          {/* Tarjeta del paso */}
          <motion.div
            ref={cardRef}
            key={step}
            {...cardMotion}
            className={cardClassName}
            style={cardStyle}
          >
            {/* Asa visual en móvil para señalar el panel anclado */}
            {isMobile && (
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border" aria-hidden="true" />
            )}

            {/* Cabecera */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Sparkles className="h-[1.05rem] w-[1.05rem]" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-gold">
                    Paso {step + 1} de {total}
                  </p>
                  <h3
                    id="tutorial-title"
                    className="font-display text-xl font-semibold leading-tight text-foreground sm:text-2xl"
                  >
                    {current.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Cerrar tutorial"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:text-foreground active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* Cuerpo */}
            <p className="mt-4 text-[0.975rem] font-light leading-relaxed text-foreground/85 sm:text-base">
              {current.body}
            </p>

            {/* Indicador de progreso */}
            <div className="mt-5 flex items-center gap-1.5" aria-hidden="true">
              {tutorialSteps.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-300',
                    i === step ? 'w-7 bg-primary' : i < step ? 'w-1.5 bg-primary/50' : 'w-1.5 bg-border'
                  )}
                />
              ))}
            </div>

            {/* Botones */}
            <div className="mt-5 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={close}
                className="inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              >
                <SkipForward className="h-4 w-4" aria-hidden="true" />
                Omitir
              </button>

              <div className="flex items-center gap-2">
                {step > 0 && (
                  <button
                    type="button"
                    onClick={prev}
                    aria-label="Paso anterior"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-secondary active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                  >
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={next}
                  className="inline-flex h-11 items-center gap-1.5 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-[0_12px_25px_-12px_hsl(var(--primary)/0.8)] transition-all hover:bg-primary/90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                >
                  {isLast ? 'Entendido' : 'Siguiente'}
                  {!isLast && <ChevronRight className="h-5 w-5" aria-hidden="true" />}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
