import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, Instagram, MapPin } from 'lucide-react';
import { useSiteData } from '@/contexts/SiteDataContext';

export default function Hero() {
  const { site } = useSiteData();
  return (
    <section id="inicio" className="relative flex min-h-[100dvh] items-center overflow-hidden">
      {/* Decoración de fondo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-secondary/70 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-24 h-80 w-80 rounded-full bg-gold/15 blur-3xl"
      />

      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 pb-16 pt-28 sm:px-6 md:pt-32 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {site.logoUrl && (
            <img
              src={site.logoUrl}
              alt={site.logoAlt || site.name}
              className="mb-6 max-h-20 w-auto max-w-[220px] object-contain sm:max-h-24 sm:max-w-[280px]"
            />
          )}
          <p className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-card/70 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-gold">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {site.city}
          </p>

          <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {site.name}
            <span className="mt-2 block text-primary">
              {site.heroTitleSuffix}
            </span>
          </h1>

          <p className="mt-5 max-w-md text-lg font-light leading-relaxed text-muted-foreground sm:text-xl">
            {site.tagline}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#servicios"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-primary px-8 text-base font-medium text-primary-foreground shadow-[0_16px_35px_-14px_hsl(var(--primary)/0.8)] transition-all hover:bg-primary/90 hover:shadow-[0_20px_40px_-14px_hsl(var(--primary)/0.8)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {site.heroButtonPrimary || 'Agenda tu cita'}
              <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              href="#cotizar"
              className="inline-flex h-14 items-center justify-center rounded-full border border-primary/35 bg-card/60 px-8 text-base font-medium text-primary transition-colors hover:bg-secondary active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {site.heroButtonSecondary || 'Pide una cotización'}
            </a>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            {site.heroSubtext || 'Bodas · XV años · Graduaciones · Sesiones de fotos · Eventos sociales'}
          </p>
        </motion.div>

        {/* Collage — solo se muestra si hay una foto principal propia
            guardada en Live (cargada desde /admin → Apariencia). Sin
            imagen propia, el bloque queda oculto y no se usa ningún
            respaldo de demostración. */}
        {site.heroImages.main ? (
        <motion.div
          className="relative mx-auto w-full max-w-md lg:max-w-none"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
        >
          <div
            aria-hidden="true"
            className="absolute -left-4 -top-4 h-full w-full rounded-[2rem] border-2 border-gold/50"
          />
          <div className="relative overflow-hidden rounded-[2rem] shadow-[0_35px_70px_-30px_hsl(var(--primary)/0.45)]">
            <img
              src={site.heroImages.main}
              alt={site.heroImages.mainAlt}
              className="aspect-[3/4] w-full object-cover"
              loading="eager"
            />
          </div>
          {site.heroImages.detail ? (
          <motion.div
            className="absolute -bottom-8 -left-6 w-36 overflow-hidden rounded-2xl border-4 border-background shadow-xl sm:-left-10 sm:w-44"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.45 }}
          >
            <img
              src={site.heroImages.detail}
              alt={site.heroImages.detailAlt}
              className="aspect-square w-full object-cover"
              loading="lazy"
            />
          </motion.div>
          ) : null}
          <a
            href={site.socials.instagram}
            target="_blank"
            rel="noreferrer"
            aria-label="Visita el perfil de Instagram @tamara.makeupart"
            className="absolute -right-3 top-8 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-card/90 px-4 py-2 text-xs font-medium tracking-wide text-foreground shadow-lg backdrop-blur transition-colors hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:-right-6"
          >
            <Instagram className="h-4 w-4" aria-hidden="true" />
            <span>{site.instagramHandle || '@tamara.makeupart'}</span>
          </a>
        </motion.div>
        ) : null}
      </div>
    </section>
  );
}
