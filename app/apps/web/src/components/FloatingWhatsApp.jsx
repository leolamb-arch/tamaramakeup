import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { site } from '@/data/site';

// Botón flotante persistente de WhatsApp.
export default function FloatingWhatsApp() {
  const [open, setOpen] = useState(true); // globo de texto visible

  const waUrl = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(
    `¡Hola, ${site.name}! Tengo dudas sobre mi evento y me gustaría más información.`
  )}`;

  return (
    <div className="fixed bottom-5 right-4 z-40 flex items-end gap-2 sm:bottom-6 sm:right-6">
      {open && (
        <div className="relative mb-1 max-w-[15rem] rounded-2xl rounded-br-sm border border-border bg-card px-4 py-3 text-sm font-light text-foreground shadow-lg">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar mensaje"
            className="absolute -right-2 -top-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow transition-colors hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          ¿Dudas sobre tu evento? ¡Hablemos aquí!
        </div>
      )}
      <a
        id="floating-whatsapp"
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Escríbeme por WhatsApp"
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_16px_35px_-12px_hsl(var(--primary)/0.85)] transition-all hover:bg-primary/90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-primary/40 motion-safe:animate-[wa-pulse_2.4s_ease-out_infinite]"
        />
        <MessageCircle className="relative h-6 w-6" aria-hidden="true" />
      </a>
    </div>
  );
}
