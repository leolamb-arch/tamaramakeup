import React, { useMemo, useState } from 'react';
import { Minus, Plus, MessageCircle, Users } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import Reveal from '@/components/Reveal';
import { useSiteData } from '@/contexts/SiteDataContext';

// Calculadora dinámica de cotización para grupos y novias.
// Lee precios, etiquetas y textos desde el panel de administración
// (SiteDataContext), con respaldo en los valores por defecto.
export default function GroupCalculator() {
  const { site, calculator: cfg } = useSiteData();
  const [count, setCount] = useState(0); // acompañantes adicionales
  const [addons, setAddons] = useState({});

  const inc = () => setCount((c) => Math.min(50, c + 1));
  const dec = () => setCount((c) => Math.max(0, c - 1));
  const toggle = (id) => setAddons((p) => ({ ...p, [id]: !p[id] }));

  const t = cfg.texts || {};
  const noteText = (t.counterNote || '').replace(
    '{price}',
    formatCurrency(cfg.perPerson, cfg.currency),
  );

  const breakdown = useMemo(() => {
    const people = count + 1; // novia + acompañantes
    const lines = [{ label: cfg.baseLabel, amount: cfg.basePrice }];
    if (count > 0) lines.push({ label: `${cfg.perPersonLabel} × ${count}`, amount: cfg.perPerson * count });
    cfg.addons.forEach((a) => {
      if (addons[a.id]) {
        const amount = a.perPerson ? a.price * people : a.price;
        lines.push({ label: a.perPerson ? `${a.label} × ${people}` : a.label, amount });
      }
    });
    const total = lines.reduce((s, l) => s + l.amount, 0);
    return { lines, total };
  }, [count, addons, cfg]);

  const whatsappUrl = useMemo(() => {
    const linesTxt = breakdown.lines
      .map((l) => `• ${l.label}: ${formatCurrency(l.amount, cfg.currency)}`)
      .join('\n');
    const greeting = (t.whatsappGreeting || '').replace('{name}', site.name);
    const msg =
      `${greeting}\n\n` +
      `• ${t.whatsappExtrasLabel || 'Acompañantes adicionales'}: ${count}\n` +
      `${linesTxt}\n\n` +
      `• ${t.whatsappTotalLabel || 'Total estimado'}: ${formatCurrency(breakdown.total, cfg.currency)}\n\n` +
      `${t.whatsappFooter || ''}`;
    return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(msg)}`;
  }, [breakdown, count, cfg, t, site]);

  return (
    <section id="cotizacion-grupos" className="scroll-mt-20 bg-secondary/45 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
        <Reveal>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-gold">{t.sectionLabel}</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-5xl">
            {t.title}
          </h2>
          <p className="mt-4 max-w-2xl text-base font-light leading-relaxed text-muted-foreground sm:text-lg">
            {t.description}
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-[0_25px_60px_-35px_hsl(var(--primary)/0.45)] sm:p-10">
            {/* Contador de acompañantes */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                  <Users className="h-4 w-4 text-primary" aria-hidden="true" />
                  {t.counterLabel}
                </p>
                <p className="mt-1 text-xs font-light text-muted-foreground">
                  {noteText}
                </p>
              </div>
              <div className="inline-flex items-center gap-3 self-start rounded-full border border-border bg-background p-1">
                <button
                  type="button"
                  onClick={dec}
                  disabled={count === 0}
                  aria-label="Quitar un acompañante"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-40 active:scale-95"
                >
                  <Minus className="h-4 w-4" aria-hidden="true" />
                </button>
                <span className="w-8 text-center text-lg font-semibold tabular-nums">{count}</span>
                <button
                  type="button"
                  onClick={inc}
                  disabled={count === 50}
                  aria-label="Agregar un acompañante"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-40 active:scale-95"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Add-ons */}
            <div className="mt-7">
              <p className="text-sm font-medium text-foreground">{t.addonsLabel}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {cfg.addons.map((a) => {
                  const on = !!addons[a.id];
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => toggle(a.id)}
                      aria-pressed={on}
                      className={`flex flex-col items-start gap-1 rounded-xl border px-4 py-3 text-left transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        on
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-background hover:border-primary/40'
                      }`}
                    >
                      <span className="flex w-full items-center justify-between gap-2 text-sm font-medium text-foreground">
                        {a.label}
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-md border text-xs ${
                            on ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-transparent'
                          }`}
                          aria-hidden="true"
                        >
                          ✓
                        </span>
                      </span>
                      <span className="text-xs font-light text-muted-foreground">
                        +{formatCurrency(a.price, cfg.currency)}{a.perPerson ? ' por persona' : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Desglose + total */}
            <div className="mt-7 rounded-2xl bg-secondary/60 p-5 sm:p-6">
              <h4 className="text-xs font-medium uppercase tracking-[0.2em] text-gold">{t.breakdownLabel}</h4>
              <dl className="mt-4 flex flex-col gap-2.5 text-sm">
                {breakdown.lines.map((l, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <dt className="font-light text-muted-foreground">{l.label}</dt>
                    <dd className="font-medium">{formatCurrency(l.amount, cfg.currency)}</dd>
                  </div>
                ))}
                <div className="mt-1 flex items-center justify-between border-t border-border pt-3">
                  <dt className="text-base font-semibold text-foreground">{t.totalLabel}</dt>
                  <dd className="text-lg font-semibold text-primary">
                    {formatCurrency(breakdown.total, cfg.currency)}
                  </dd>
                </div>
              </dl>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-primary text-base font-medium text-primary-foreground shadow-[0_16px_35px_-14px_hsl(var(--primary)/0.8)] transition-all hover:bg-primary/90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              {t.button}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
