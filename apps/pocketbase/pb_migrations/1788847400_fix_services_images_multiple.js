/// <reference path="../pb_data/types.d.ts" />

// Corrige el campo `images` de la colección `services` para que sea
// realmente multicarga. La migración anterior (1788846737) dejó
// `maxSelect: 0`, que PocketBase 0.39 interpreta como campo de un solo
// archivo (devuelve una cadena y descarta todo archivo salvo el último).
// Un valor > 1 convierte el campo en multicarga (arreglo) y permite
// cargar, reordenar, reemplazar y eliminar fotografías sin límite
// artificial. Los registros existentes tienen `images` vacío, así que la
// conversión de tipo de columna es segura.
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("services");
    const field = collection.fields.getByName("images");
    if (!field) {
      throw new Error(
        "Campo 'images' no encontrado en 'services' — no se pudo corregir maxSelect",
      );
    }
    field.maxSelect = 50;
    app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("services");
    const field = collection.fields.getByName("images");
    if (field) {
      field.maxSelect = 0;
      app.save(collection);
    }
  },
);
