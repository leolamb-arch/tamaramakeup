import React from 'react';
import { MapPin, Star } from 'lucide-react';
import { useSiteData } from '@/contexts/SiteDataContext';
import Reveal from '@/components/Reveal';
import SocialIcon from '@/components/SocialIcon';

const socialButtons = [
  { key: 'whatsapp', label: 'WhatsApp', href: 'whatsapp' },
  { key: 'instagram', label: 'Instagram', href: 'instagram' },
  { key: 'facebook', label: 'Facebook', href: 'facebook' },
  { key: 'tiktok', label: 'TikTok', href: 'tiktok' },
];

export default function Contact() {
  const { site } = useSiteData();
  return (
    <section id="contacto" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <Reveal>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-gold">{site.contactLabel || 'Contacto'}</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-5xl">
            {site.contactTitle || 'Hablemos de tu evento'}
          </h2>
          <p className="mt-4 flex max-w-2xl items-start gap-2 text-base font-light leading-relaxed text-muted-foreground sm:text-lg">
            <MapPin className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            {site.coverage}
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {socialButtons.map((s) => (
              <a
                key={s.key}
                href={site.socials[s.href] || '#'}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Abrir ${s.label} (se abre en una pestaña nueva)`}
                className="flex h-14 items-center justify-center gap-2.5 rounded-2xl border border-border bg-card text-sm font-medium text-foreground shadow-[0_12px_30px_-22px_hsl(var(--primary)/0.5)] transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:h-16 sm:text-base"
              >
                <SocialIcon name={s.key} className="h-5 w-5" />
                {s.label}
              </a>
            ))}
          </div>
        </Reveal>

        <div className="mt-16 sm:mt-20">
          <Reveal>
            <h3 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              {site.testimonialsTitle || 'Lo que dicen mis clientas'}
            </h3>
          </Reveal>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {site.testimonials.map((t, i) => {
              const rating = Math.max(1, Math.min(5, Math.round(Number(t.rating) || 5)));
              return (
                <Reveal key={t.name + i} delay={Math.min(i * 0.08, 0.24)}>
                  <figure className="flex h-full flex-col rounded-3xl border border-border bg-card p-6 shadow-[0_18px_45px_-32px_hsl(var(--primary)/0.45)] sm:p-7">
                    <div
                      className="flex items-center gap-1"
                      aria-label={`Calificación: ${rating} de 5 estrellas`}
                    >
                      {Array.from({ length: 5 }).map((_, s) => (
                        <Star
                          key={s}
                          className={`h-4 w-4 ${s < rating ? 'fill-gold text-gold' : 'fill-none text-gold/35'}`}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                    <figcaption className="mt-5 flex items-center gap-3 border-t border-border pt-4">
                      {t.photo ? (
                      <img
                        src={t.photo}
                        alt={`Foto de ${t.name}`}
                        className="h-11 w-11 rounded-full object-cover ring-2 ring-gold/40"
                        loading="lazy"
                      />
                      ) : null}
                      <div>
                        <p className="text-sm font-semibold">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.event}</p>
                      </div>
                    </figcaption>
                  </figure>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
