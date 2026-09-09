import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import pb from '@/lib/pocketbaseClient';
import { site as defaultSite } from '@/data/site';
import { calculatorConfig as defaultCalc } from '@/data/calculator';
import {
  quizQuestions as defaultQuizQuestions,
  extrasNote as defaultExtrasNote,
  quizTexts as defaultQuizTexts,
} from '@/data/quiz';
import { hexToHslString, hslStringToHex, contrastText } from '@/lib/colorUtils';

// ============================================================
// CONTEXTO DE CONTENIDO, SERVICIOS Y APARIENCIA
// ------------------------------------------------------------
// La página principal lee aquí en lugar de los archivos estáticos.
// Si hay datos guardados en el backend (panel de administración),
// se usan; si no, caen los valores por defecto. La apariencia
// (fuentes + colores) se aplica solo dentro de la página principal.
// ============================================================

const SiteDataContext = createContext(null);

// Normaliza un registro de servicio de PocketBase al shape que
// esperan los componentes (con URLs de imagen resueltas).
function normalizeService(rec) {
  // Solo se muestran las fotografías guardadas por la administradora
  // desde /admin. No se usa ningún respaldo (imágenes predeterminadas
  // de Hostinger) aunque el servicio no tenga fotos propias.
  const files = Array.isArray(rec.images) ? rec.images : [];
  // URLs a resolución completa (para el visor ampliado) y miniaturas
  // generadas por PocketBase (parámetro `thumb`) para las tarjetas y la
  // cuadrícula de la galería. Las miniaturas pesan unos pocos KB frente
  // a los varios MB de la foto original, por lo que aparecen de inmediato
  // al renderizar la página, sin pantalla blanca ni imágenes de respaldo.
  let images = files.map((fn) => pb.files.getURL(rec, fn));
  let thumbs = files.map((fn) => pb.files.getURL(rec, fn, { thumb: '600x600' }));
  const coverIndex = Math.min(Number(rec.cover_index) || 0, Math.max(0, images.length - 1));
  // La portada va primero para los componentes que usan images[0].
  if (coverIndex > 0 && images[coverIndex]) {
    images = [images[coverIndex], ...images.filter((_, i) => i !== coverIndex)];
    thumbs = [thumbs[coverIndex], ...thumbs.filter((_, i) => i !== coverIndex)];
  }
  const includes = Array.isArray(rec.includes) ? rec.includes : [];
  return {
    id: rec.slug || rec.id,
    _pbId: rec.id,
    name: rec.name || '',
    short: rec.short || '',
    description: rec.description || '',
    price: rec.price || '',
    priceAmount: Number(rec.price_amount) || 0,
    duration: rec.duration || '',
    includes,
    images,
    thumbs,
    active: rec.active !== false,
    sortOrder: Number(rec.sort_order) || 0,
  };
}

export function SiteDataProvider({ children }) {
  const [content, setContent] = useState(null);
  const [services, setServices] = useState([]);
  const [appearance, setAppearance] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    // Las tres consultas a PocketBase se lanzan en paralelo (una sola
    // ventana de red) en lugar de encadenarse secuencialmente. Así la
    // estructura de la página —que ya se renderiza de inmediato con los
    // valores por defecto— recibe los datos Live en una fracción del
    // tiempo y se sustituye sin pantalla blanca ni imágenes de respaldo.
    const [contentList, svcRecs, appList] = await Promise.all([
      pb.collection('site_content').getFullList({ sort: '-created' }).catch(() => []),
      pb.collection('services').getFullList({ sort: 'sort_order' }).catch(() => []),
      pb.collection('appearance').getFullList({ sort: '-created' }).catch(() => []),
    ]);

    // Contenido
    let savedContent = null;
    try {
      if (contentList[0]?.data) {
        savedContent = typeof contentList[0].data === 'string' ? JSON.parse(contentList[0].data) : contentList[0].data;
      }
    } catch (_) {}
    setContent(savedContent || {});

    // Servicios
    let svcList = [];
    try {
      svcList = (svcRecs || []).map(normalizeService);
    } catch (_) {}
    setServices(svcList);

    // Apariencia
    let savedApp = null;
    try {
      if (appList[0]) {
        const d = typeof appList[0].data === 'string' ? JSON.parse(appList[0].data) : appList[0].data;
        savedApp = d || {};
        if (appList[0].logo) {
          savedApp.logoUrl = pb.files.getURL(appList[0], appList[0].logo);
          savedApp.logoAlt = appList[0].logo_alt || '';
        }
        if (appList[0].hero_image) {
          // Miniatura generada por PocketBase para la foto principal: misma
          // proporción 3:4 que el bloque del hero, pero mucho más ligera,
          // carga de inmediato al primer renderizado.
          savedApp.heroImageUrl = pb.files.getURL(appList[0], appList[0].hero_image, { thumb: '900x1200' });
          savedApp.heroImageAlt = appList[0].hero_image_alt || '';
        }
      }
    } catch (_) {}
    setAppearance(savedApp || null);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Sitio "final" = defaults + guardado.
  const site = useMemo(() => {
    const c = content || {};
    return {
      ...defaultSite,
      ...c,
      socials: { ...defaultSite.socials, ...(c.socials || {}) },
      heroImages: {
        ...defaultSite.heroImages,
        ...(appearance?.heroImageUrl
          ? { main: appearance.heroImageUrl, mainAlt: appearance.heroImageAlt || defaultSite.heroImages.mainAlt }
          : {}),
      },
      testimonials: c.testimonials && c.testimonials.length ? c.testimonials : defaultSite.testimonials,
      logoUrl: appearance?.logoUrl || null,
      logoAlt: appearance?.logoAlt || '',
    };
  }, [content, appearance]);

  // Servicios activos para la página principal y el formulario de reservas.
  const activeServices = useMemo(
    () => services.filter((s) => s.active && s.name).sort((a, b) => a.sortOrder - b.sortOrder),
    [services],
  );

  // Configuración de la calculadora grupal: defaults + guardado en backend.
  const calculator = useMemo(() => {
    const c = content || {};
    const saved = c.calculator || {};
    return {
      basePrice: Number(saved.basePrice ?? defaultCalc.basePrice) || 0,
      perPerson: Number(saved.perPerson ?? defaultCalc.perPerson) || 0,
      baseLabel: saved.baseLabel ?? defaultCalc.baseLabel,
      perPersonLabel: saved.perPersonLabel ?? defaultCalc.perPersonLabel,
      addons:
        Array.isArray(saved.addons) && saved.addons.length
          ? saved.addons.map((a) => ({
              id: a.id || `addon-${Math.random().toString(36).slice(2, 8)}`,
              label: a.label || '',
              price: Number(a.price) || 0,
              perPerson: !!a.perPerson,
            }))
          : defaultCalc.addons,
      currency: { ...defaultCalc.currency, ...(saved.currency || {}) },
      texts: { ...defaultCalc.texts, ...(saved.texts || {}) },
    };
  }, [content]);

  // Configuración del quiz "Encuentra tu look ideal": defaults + guardado.
  const quiz = useMemo(() => {
    const c = content || {};
    const saved = c.quiz || {};
    const questions =
      Array.isArray(saved.questions) && saved.questions.length
        ? saved.questions.map((q) => ({
            id: q.id || `q-${Math.random().toString(36).slice(2, 8)}`,
            question: q.question || '',
            options: Array.isArray(q.options)
              ? q.options.map((o) => ({
                  id: o.id || `o-${Math.random().toString(36).slice(2, 8)}`,
                  label: o.label || '',
                  service: o.service || '',
                }))
              : [],
          }))
        : defaultQuizQuestions;
    const extrasNote = { ...defaultExtrasNote, ...(saved.extrasNote || {}) };
    const texts = { ...defaultQuizTexts, ...(saved.texts || {}) };
    return { questions, extrasNote, texts };
  }, [content]);

  // Configuración del paso de ubicación del flujo de reserva:
  // defaults + guardado en backend (panel de administración).
  const locationConfig = useMemo(() => {
    const c = content || {};
    const saved = c.locationConfig || {};
    const def = defaultSite.locationConfig || {};
    return {
      sectionTitle: saved.sectionTitle ?? def.sectionTitle,
      sectionInstructions: saved.sectionInstructions ?? def.sectionInstructions,
      studioOptionLabel: saved.studioOptionLabel ?? def.studioOptionLabel,
      externalOptionLabel: saved.externalOptionLabel ?? def.externalOptionLabel,
      studio: { ...def.studio, ...(saved.studio || {}) },
      external: {
        ...def.external,
        ...(saved.external || {}),
        fields:
          Array.isArray(saved.external?.fields) && saved.external.fields.length
            ? saved.external.fields
            : def.external.fields,
      },
    };
  }, [content]);

  const value = useMemo(
    () => ({ site, services, activeServices, appearance, loading, refresh: loadAll, calculator, quiz, locationConfig }),
    [site, services, activeServices, appearance, loading, loadAll, calculator, quiz, locationConfig],
  );

  return <SiteDataContext.Provider value={value}>{children}</SiteDataContext.Provider>;
}

export function useSiteData() {
  const ctx = useContext(SiteDataContext);
  if (!ctx) {
    // Fuera del provider (p. ej. panel admin): devolver defaults seguros.
    return {
      site: defaultSite,
      services: [],
      activeServices: [],
      appearance: null,
      loading: false,
      refresh: async () => {},
      calculator: defaultCalc,
      quiz: { questions: defaultQuizQuestions, extrasNote: defaultExtrasNote, texts: defaultQuizTexts },
      locationConfig: defaultSite.locationConfig,
    };
  }
  return ctx;
}

// ============================================================
// APLICADOR DE APARIENCIA — solo para la página principal
// ============================================================
const FONT_CATALOG = {
  'Cormorant Garamond': { family: '"Cormorant Garamond"', stack: 'Georgia, serif', url: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@0,400;0,500;0,600;0,700;1,400&display=swap' },
  'Playfair Display': { family: '"Playfair Display"', stack: 'Georgia, serif', url: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@0,400;0,500;0,600;0,700;1,400&display=swap' },
  'Bodoni Moda': { family: '"Bodoni Moda"', stack: 'Georgia, serif', url: 'https://fonts.googleapis.com/css2?family=Bodoni+Moda:wght@0,400;0,500;0,600;0,700&display=swap' },
  Prata: { family: 'Prata', stack: 'Georgia, serif', url: 'https://fonts.googleapis.com/css2?family=Prata&display=swap' },
  Marcellus: { family: 'Marcellus', stack: 'Georgia, serif', url: 'https://fonts.googleapis.com/css2?family=Marcellus&display=swap' },
  'DM Serif Display': { family: '"DM Serif Display"', stack: 'Georgia, serif', url: 'https://fonts.googleapis.com/css2?family=DM+Serif+Display:wght@0,400;1,400&display=swap' },
  Lora: { family: 'Lora', stack: 'Georgia, serif', url: 'https://fonts.googleapis.com/css2?family=Lora:wght@0,400;0,500;0,600;1,400&display=swap' },
  Jost: { family: 'Jost', stack: 'ui-sans-serif, system-ui, sans-serif', url: 'https://fonts.googleapis.com/css2?family=Jost:wght@0,300;0,400;0,500;0,600;1,400&display=swap' },
  Montserrat: { family: 'Montserrat', stack: 'ui-sans-serif, system-ui, sans-serif', url: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@0,300;0,400;0,500;0,600&display=swap' },
  Poppins: { family: 'Poppins', stack: 'ui-sans-serif, system-ui, sans-serif', url: 'https://fonts.googleapis.com/css2?family=Poppins:wght@0,300;0,400;0,500;0,600&display=swap' },
  Inter: { family: 'Inter', stack: 'ui-sans-serif, system-ui, sans-serif', url: 'https://fonts.googleapis.com/css2?family=Inter:wght@0,300;0,400;0,500;0,600&display=swap' },
  Lato: { family: 'Lato', stack: 'ui-sans-serif, system-ui, sans-serif', url: 'https://fonts.googleapis.com/css2?family=Lato:wght@0,300;0,400;0,700&display=swap' },
  Raleway: { family: 'Raleway', stack: 'ui-sans-serif, system-ui, sans-serif', url: 'https://fonts.googleapis.com/css2?family=Raleway:wght@0,300;0,400;0,500;0,600&display=swap' },
  'Work Sans': { family: '"Work Sans"', stack: 'ui-sans-serif, system-ui, sans-serif', url: 'https://fonts.googleapis.com/css2?family=Work+Sans:wght@0,300;0,400;0,500;0,600&display=swap' },
};

export function getFontCatalog() {
  return FONT_CATALOG;
}

export function applyAppearance(app) {
  const root = document.documentElement;
  // Limpieza previa
  document.getElementById('appearance-fonts-link')?.remove();
  document.getElementById('appearance-fonts-style')?.remove();
  // Limpia variables inyectadas
  ['--primary','--primary-foreground','--secondary','--secondary-foreground','--background','--foreground','--gold','--ring','--button'].forEach((v) => root.style.removeProperty(v));

  if (!app) return;

  const colors = app.colors || {};
  const setVar = (name, hslStr) => {
    if (hslStr) root.style.setProperty(name, hslStr);
  };

  // Colores: el botón hereda del principal si no se define aparte.
  const primaryHsl = colors.primary || '346 32% 42%';
  const buttonHsl = colors.button || primaryHsl;
  setVar('--primary', buttonHsl);
  setVar('--ring', primaryHsl);
  setVar('--secondary', colors.secondary || '350 32% 92%');
  setVar('--background', colors.background || '30 33% 96%');
  setVar('--foreground', colors.foreground || '20 18% 17%');
  setVar('--gold', colors.gold || '38 46% 52%');
  setVar('--button', buttonHsl);

  // Texto contrastante derivado para primary y secondary.
  try {
    setVar('--primary-foreground', contrastText(hslStringToHex(buttonHsl)));
    setVar('--secondary-foreground', contrastText(hslStringToHex(colors.secondary || '350 32% 92%')));
  } catch (_) {}

  // Fuentes
  const titleFont = FONT_CATALOG[app.titleFont] || FONT_CATALOG['Cormorant Garamond'];
  const bodyFont = FONT_CATALOG[app.bodyFont] || FONT_CATALOG['Jost'];
  const urls = Array.from(new Set([titleFont.url, bodyFont.url]));
  const link = document.createElement('link');
  link.id = 'appearance-fonts-link';
  link.rel = 'stylesheet';
  link.href = urls.length > 1
    ? `https://fonts.googleapis.com/css2?family=${urls.map((u) => u.split('family=')[1]).join('&family=')}`
    : urls[0];
  document.head.appendChild(link);

  const style = document.createElement('style');
  style.id = 'appearance-fonts-style';
  style.textContent = `
    body { font-family: ${bodyFont.family}, ${bodyFont.stack} !important; }
    .font-display { font-family: ${titleFont.family}, ${titleFont.stack} !important; }
  `;
  document.head.appendChild(style);
}

export function AppearanceApplier() {
  const { appearance } = useSiteData();
  useEffect(() => {
    applyAppearance(appearance);
    return () => {
      // Al desmontar (salir de la página principal) restaura el tema base.
      applyAppearance(null);
    };
  }, [appearance]);
  return null;
}
