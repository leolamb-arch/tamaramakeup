import React, { useState } from 'react';
import { Wand2, Clock, ArrowRight, RotateCcw, Check } from 'lucide-react';
import { useSiteData } from '@/contexts/SiteDataContext';
import Reveal from '@/components/Reveal';

// Quiz "Encuentra tu look ideal": 2 preguntas → recomendación.
// Lee preguntas, opciones, notas y textos desde el panel de
// administración (SiteDataContext), con respaldo en los defaults.
export default function LookQuiz() {
  const { activeServices, quiz } = useSiteData();
  const services = activeServices;
  const questions = quiz.questions || [];
  const extrasNote = quiz.extrasNote || {};
  const t = quiz.texts || {};
  const [answers, setAnswers] = useState({}); // { preguntaId: opcionId }
  const [done, setDone] = useState(false);

  const allAnswered = questions.every((q) => answers[q.id]);

  const pick = (qId, optId) => {
    setAnswers((prev) => ({ ...prev, [qId]: optId }));
  };

  const reset = () => {
    setAnswers({});
    setDone(false);
  };

  // Servicio recomendado según la 1ª pregunta (lleva el `service`).
  const firstQ = questions[0];
  const eventoOption = firstQ
    ? firstQ.options.find((o) => o.id === answers[firstQ.id])
    : null;
  const recommended = eventoOption
    ? services.find((s) => s.id === eventoOption.service)
    : null;
  const extrasId = questions[1] ? answers[questions[1].id] : null;
  const note = extrasId ? extrasNote[extrasId] : '';

  return (
    <section id="tu-look" className="scroll-mt-20 py-20 sm:py-28">
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
            {!done ? (
              <ol className="flex flex-col gap-8">
                {questions.map((q, qi) => (
                  <li key={q.id}>
                    <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                        {qi + 1}
                      </span>
                      {q.question}
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {q.options.map((o) => {
                        const selected = answers[q.id] === o.id;
                        return (
                          <button
                            key={o.id}
                            type="button"
                            onClick={() => pick(q.id, o.id)}
                            aria-pressed={selected}
                            className={`flex items-center justify-between gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                              selected
                                ? 'border-primary bg-primary text-primary-foreground shadow-[0_10px_25px_-12px_hsl(var(--primary)/0.8)]'
                                : 'border-border bg-background text-foreground hover:border-primary/40 hover:bg-secondary'
                            }`}
                          >
                            {o.label}
                            {selected && <Check className="h-4 w-4" aria-hidden="true" />}
                          </button>
                        );
                      })}
                    </div>
                  </li>
                ))}

                <li>
                  <button
                    type="button"
                    disabled={!allAnswered}
                    onClick={() => setDone(true)}
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-primary text-base font-medium text-primary-foreground shadow-[0_16px_35px_-14px_hsl(var(--primary)/0.8)] transition-all hover:bg-primary/90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Wand2 className="h-4 w-4" aria-hidden="true" />
                    {t.button}
                  </button>
                  {!allAnswered && (
                    <p className="mt-2 text-center text-xs text-muted-foreground">
                      {t.noteIncomplete}
                    </p>
                  )}
                </li>
              </ol>
            ) : (
              recommended && (
                <div className="flex flex-col items-center gap-6 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
                    <Wand2 className="h-7 w-7 text-primary" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
                      {t.resultLabel}
                    </p>
                    <h3 className="mt-2 font-display text-3xl font-semibold tracking-tight">
                      {recommended.name}
                    </h3>
                    <p className="mt-3 max-w-md text-sm font-light leading-relaxed text-muted-foreground">
                      {recommended.description}
                    </p>
                  </div>

                  <dl className="w-full divide-y divide-border rounded-2xl border border-border text-left">
                    <div className="flex items-center justify-between px-5 py-3.5">
                      <dt className="text-sm font-light text-muted-foreground">{t.priceLabel}</dt>
                      <dd className="text-sm font-semibold text-primary">{recommended.price}</dd>
                    </div>
                    <div className="flex items-center justify-between px-5 py-3.5">
                      <dt className="inline-flex items-center gap-2 text-sm font-light text-muted-foreground">
                        <Clock className="h-4 w-4" aria-hidden="true" /> {t.durationLabel}
                      </dt>
                      <dd className="text-sm font-medium text-foreground">{recommended.duration}</dd>
                    </div>
                    {note && (
                      <div className="flex items-center justify-between px-5 py-3.5">
                        <dt className="text-sm font-light text-muted-foreground">{t.servicesLabel}</dt>
                        <dd className="max-w-[60%] text-right text-sm font-medium text-foreground">{note}</dd>
                      </div>
                    )}
                  </dl>

                  <div className="flex w-full flex-col gap-3 sm:flex-row">
                    <a
                      href="#cotizar"
                      className="flex h-14 flex-1 items-center justify-center gap-2 rounded-full bg-primary text-base font-medium text-primary-foreground shadow-[0_16px_35px_-14px_hsl(var(--primary)/0.8)] transition-all hover:bg-primary/90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      {t.ctaButton}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </a>
                    <button
                      type="button"
                      onClick={reset}
                      className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-border px-6 text-base font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <RotateCcw className="h-4 w-4" aria-hidden="true" />
                      {t.resetButton}
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
