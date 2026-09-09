import React from 'react';
import { Sparkles } from 'lucide-react';
import { useSiteData } from '@/contexts/SiteDataContext';
import SocialIcon from '@/components/SocialIcon';

const socials = [
  { key: 'whatsapp', label: 'WhatsApp', href: 'whatsapp' },
  { key: 'instagram', label: 'Instagram', href: 'instagram' },
  { key: 'facebook', label: 'Facebook', href: 'facebook' },
  { key: 'tiktok', label: 'TikTok', href: 'tiktok' },
];

export default function Footer() {
  const { site } = useSiteData();
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-secondary/35">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col items-center gap-6 text-center">
          <a href="#inicio" className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md">
            {site.logoUrl ? (
              <img
                src={site.logoUrl}
                alt={site.logoAlt || site.name}
                className="h-11 w-auto max-w-[180px] object-contain sm:h-12"
              />
            ) : (
              <>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="font-display text-xl font-semibold tracking-wide">{site.name}</span>
              </>
            )}
          </a>

          <nav aria-label="Redes sociales">
            <ul className="flex items-center gap-3">
              {socials.map((s) => (
                <li key={s.key}>
                  <a
                    href={site.socials[s.href] || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${s.label} (se abre en una pestaña nueva)`}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground/75 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <SocialIcon name={s.key} className="h-5 w-5" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <p className="max-w-xl text-xs font-light leading-relaxed text-muted-foreground">
            {site.footerNote}
          </p>

          <p className="text-xs text-muted-foreground">
            © {year} {site.name} · Maquillaje profesional en Guadalajara, Jalisco, México
          </p>
        </div>
      </div>
    </footer>
  );
}
