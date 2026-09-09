/// <reference path="../pb_data/types.d.ts" />

// Reemplaza la función de comentarios escritos de los testimonios por
// una valoración de 1 a 5 estrellas asignada por la administradora.
//   • Elimina el campo `quote` de cada testimonio existente.
//   • Añade `rating` (entero 1–5, por defecto 5) a cada testimonio.
// Solo transforma el JSON guardado en `site_content.data.testimonials`;
// no toca colecciones, reglas ni otras secciones del panel.

migrate(
  (app) => {
    let content;
    try {
      content = app.findCollectionByNameOrId("site_content");
    } catch (_) {
      // No existe la colección: nada que migrar.
      return;
    }

    let records = [];
    try {
      records = app.findAllRecords("site_content");
    } catch (_) {
      records = [];
    }

    records.forEach((rec) => {
      let data;
      try {
        data = typeof rec.get("data") === "string" ? JSON.parse(rec.get("data")) : rec.get("data");
      } catch (_) {
        data = null;
      }
      if (!data || !Array.isArray(data.testimonials)) return;

      let changed = false;
      data.testimonials = data.testimonials.map((t) => {
        if (!t || typeof t !== "object") return t;
        const next = { ...t };
        if ("quote" in next) {
          delete next.quote;
          changed = true;
        }
        let rating = Number(next.rating);
        if (!Number.isFinite(rating)) rating = 5;
        rating = Math.max(1, Math.min(5, Math.round(rating)));
        if (next.rating !== rating) changed = true;
        next.rating = rating;
        return next;
      });

      if (changed) {
        rec.set("data", data);
        app.save(rec);
      }
    });
  },
  (app) => {
    // Revertir: quitar `rating` y restaurar `quote` vacío.
    let content;
    try {
      content = app.findCollectionByNameOrId("site_content");
    } catch (_) {
      return;
    }
    let records = [];
    try {
      records = app.findAllRecords("site_content");
    } catch (_) {
      records = [];
    }
    records.forEach((rec) => {
      let data;
      try {
        data = typeof rec.get("data") === "string" ? JSON.parse(rec.get("data")) : rec.get("data");
      } catch (_) {
        data = null;
      }
      if (!data || !Array.isArray(data.testimonials)) return;
      let changed = false;
      data.testimonials = data.testimonials.map((t) => {
        if (!t || typeof t !== "object") return t;
        const next = { ...t };
        if ("rating" in next) {
          delete next.rating;
          changed = true;
        }
        if (!("quote" in next)) {
          next.quote = "";
          changed = true;
        }
        return next;
      });
      if (changed) {
        rec.set("data", data);
        app.save(rec);
      }
    });
  },
);
