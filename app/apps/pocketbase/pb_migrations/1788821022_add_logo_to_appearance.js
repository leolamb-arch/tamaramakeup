/// <reference path="../pb_data/types.d.ts" />

// Añade campos de logotipo a la colección `appearance`:
//   • logo      → archivo de imagen (PNG/JPG/WebP/SVG/GIF), 1 archivo, 2 MB máx.
//   • logo_alt  → texto alternativo para accesibilidad.
// Lectura pública (la página principal lo consume sin sesión);
// escritura solo para la administradora (reglas existentes).

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("appearance");

    collection.fields.add(
      new FileField({
        name: "logo",
        maxSelect: 1,
        maxSize: 2097152,
        mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "image/gif"],
      }),
    );

    collection.fields.add(new TextField({ name: "logo_alt", max: 200 }));

    app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("appearance");
    collection.fields.removeByName("logo");
    collection.fields.removeByName("logo_alt");
    app.save(collection);
  },
);
