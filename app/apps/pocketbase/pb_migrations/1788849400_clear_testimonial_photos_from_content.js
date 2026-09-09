/// <reference path="../pb_data/types.d.ts" />

// ============================================================
// Limpia las URLs de fotos de demostración de Hostinger que
// quedaron almacenadas en el campo `data.testimonials[].photo`
// del registro único de `site_content`.
//
// La interfaz pública y el panel /admin ya no muestran fotos de
// respaldo: si un testimonio no tiene una foto propia guardada
// por la administradora, el avatar se oculta. Esta migración
// vacía las URLs heredadas para garantizar que ninguna imagen
// de demostración de Hostinger permanezca en los datos Live.
// ============================================================

migrate(
  (app) => {
    let rec = null;
    try {
      rec = app.findFirstRecordByFilter("site_content", "id != ''");
    } catch (_) {
      rec = null;
    }
    if (!rec) return;

    let data = rec.get("data");
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch (_) {
        data = {};
      }
    }
    if (!data || typeof data !== "object") data = {};

    let changed = false;
    if (Array.isArray(data.testimonials)) {
      data.testimonials = data.testimonials.map((t) => {
        if (t && typeof t === "object" && typeof t.photo === "string" && t.photo.includes("hostinger.com")) {
          changed = true;
          return { ...t, photo: "" };
        }
        return t;
      });
    }

    if (changed) {
      rec.set("data", data);
      app.save(rec);
    }
  },
  (app) => {
    // No-op: las URLs de demostración originales no se restauran.
  },
);
