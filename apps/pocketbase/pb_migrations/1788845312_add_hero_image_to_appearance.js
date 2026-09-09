/// <reference path="../pb_data/types.d.ts" />

// Añade campos de "Foto principal de la página de inicio" a la colección
// `appearance`:
//   • hero_image     → archivo de imagen (PNG/JPG/WebP/SVG/GIF), 1 archivo, 10 MB máx.
//   • hero_image_alt → texto alternativo para accesibilidad.
// Lectura pública (la página principal lo consume sin sesión);
// escritura solo para la administradora (reglas existentes).

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("appearance");

    if (!collection.fields.getByName("hero_image")) {
      collection.fields.add(
        new FileField({
          name: "hero_image",
          maxSelect: 1,
          maxSize: 10485760,
          mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "image/gif"],
        }),
      );
    }

    if (!collection.fields.getByName("hero_image_alt")) {
      collection.fields.add(new TextField({ name: "hero_image_alt", max: 200 }));
    }

    app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("appearance");
    collection.fields.removeByName("hero_image");
    collection.fields.removeByName("hero_image_alt");
    app.save(collection);
  },
);
