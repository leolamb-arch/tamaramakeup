/// <reference path="../pb_data/types.d.ts" />

// Elimina el límite artificial de 4 fotografías por servicio.
// maxSelect: 0 significa "sin límite" en PocketBase (restricción
// real = almacenamiento del proyecto). Conserva el tamaño máximo
// por archivo (10 MB) y los mime types permitidos.

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("services");
    const field = collection.fields.getByName("images");
    if (!field) {
      throw new Error(
        "El campo 'images' no existe en la colección 'services'.",
      );
    }
    field.maxSelect = 0; // 0 = ilimitado
    app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("services");
    const field = collection.fields.getByName("images");
    if (field) {
      field.maxSelect = 4;
      app.save(collection);
    }
  },
);
