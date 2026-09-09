import React, { useEffect, useState } from 'react';
import { Menu, HelpCircle, LockKeyhole } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle } from '@/components/ui/sheet';
import { useSiteData } from '@/contexts/SiteDataContext';
import { cn } from '@/lib/utils';

const links = [
  { href: '#inicio', label: 'Inicio' },
  { href: '#servicios', label: 'Servicios' },
  { href: '#cotizar', label: 'Cotizar' },
  { href: '#contacto', label: 'Contacto' },
];

export default function Navbar() {
  const { site } = useSiteData();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-background/90 shadow-[0_1px_0_hsl(var(--border)),0_8px_30px_-18px_hsl(var(--primary)/0.35)] backdrop-blur-md'
          : 'bg-transparent'
      )}
    >
      <nav
        aria-label="Navegación principal"
        className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 md:h-20"
      >
        <a href="#inicio" className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md">
          {site.logoUrl && (
            <img
              src={site.logoUrl}
              alt={site.logoAlt || site.name}
              className="h-9 w-auto max-w-[140px] object-contain sm:h-10 sm:max-w-[180px]"
            />
          )}
        </a>

        <ul className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="text-sm font-medium tracking-wide text-foreground/80 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
              >
                {l.label}
              </a>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-tutorial'))}
              aria-label="Abrir tutorial de bienvenida"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground/80 transition-all hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <HelpCircle className="h-5 w-5" aria-hidden="true" />
            </button>
          </li>
          <li>
            <a
              href="/admin"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground/80 transition-all hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <LockKeyhole className="h-4 w-4" aria-hidden="true" />
              Admin
            </a>
          </li>
          <li>
            <a
              href="#servicios"
              className="inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-[0_10px_25px_-12px_hsl(var(--primary)/0.7)] transition-all hover:bg-primary/90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Agenda tu cita
            </a>
          </li>
        </ul>

        <Sheet>
          <SheetTrigger
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground md:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </SheetTrigger>
          <SheetContent side="right" className="w-72 bg-background">
            <SheetTitle className="font-display text-xl font-semibold">
              {site.logoUrl ? (
                <img
                  src={site.logoUrl}
                  alt={site.logoAlt || site.name}
                  className="h-10 w-auto max-w-[160px] object-contain"
                />
              ) : (
                site.name
              )}
            </SheetTitle>
            <ul className="mt-8 flex flex-col gap-2">
              {links.map((l) => (
                <li key={l.href}>
                  <SheetClose asChild>
                    <a
                      href={l.href}
                      className="block rounded-lg px-4 py-3 text-base font-medium text-foreground/85 transition-colors hover:bg-secondary hover:text-secondary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {l.label}
                    </a>
                  </SheetClose>
                </li>
              ))}
              <li className="pt-3">
                <SheetClose asChild>
                  <button
                    type="button"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('open-tutorial'));
                    }}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-border bg-card text-base font-medium text-foreground active:scale-[0.98]"
                  >
                    <HelpCircle className="h-5 w-5" aria-hidden="true" />
                    Tutorial de bienvenida
                  </button>
                </SheetClose>
              </li>
              <li className="pt-3">
                <SheetClose asChild>
                  <a
                    href="/admin"
                    className="flex h-12 items-center justify-center gap-2 rounded-full border border-border bg-card text-base font-medium text-foreground active:scale-[0.98]"
                  >
                    <LockKeyhole className="h-5 w-5" aria-hidden="true" />
                    Admin
                  </a>
                </SheetClose>
              </li>
              <li className="pt-3">
                <SheetClose asChild>
                  <a
                    href="#servicios"
                    className="flex h-12 items-center justify-center rounded-full bg-primary text-base font-medium text-primary-foreground active:scale-[0.98]"
                  >
                    Agenda tu cita
                  </a>
                </SheetClose>
              </li>
            </ul>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
}
