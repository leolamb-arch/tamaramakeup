/// <reference path="../pb_data/types.d.ts" />

// ============================================================
// Limpia las URLs de imágenes predeterminadas (Hostinger) que
// quedaron almacenadas en `legacy_images` de cada servicio.
//
// La página principal y el panel /admin leen únicamente las
// fotografías subidas por la administradora (campo `images`).
// Este migration vacía `legacy_images` para garantizar que
// ninguna URL de respaldo predeterminada permanezca en la base
// de datos, de modo que nunca se muestren imágenes
// predeterminadas —ni en la galería de servicios ni en /admin—
// incluso después de recargar.
// ============================================================

migrate(
  (app) => {
    const recs = app.findAllRecords("services");
    recs.forEach((rec) => {
      rec.set("legacy_images", []);
      app.save(rec);
    });
  },
  (app) => {
    // No-op: las URLs predeterminadas originales no se restauran.
  },
);
