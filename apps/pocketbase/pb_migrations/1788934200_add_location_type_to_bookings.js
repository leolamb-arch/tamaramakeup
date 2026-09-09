/// <reference path="../pb_data/types.d.ts" />

// Añade el campo `location_type` (select: studio | external) a la colección
// `bookings` para registrar si la clienta eligió el estudio de Tamara o una
// ubicación externa. La dirección completa confirmada se guarda en `location`.
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("bookings");

    if (collection.fields.getByName("location_type")) return;

    collection.fields.add(
      new SelectField({
        name: "location_type",
        required: false,
        maxSelect: 1,
        values: ["studio", "external"],
      }),
    );
    app.save(collection);
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId("bookings");
      collection.fields.removeByName("location_type");
      app.save(collection);
    } catch (e) {
      if (e.message && e.message.includes("no rows in result set")) {
        console.log("Collection not found, skipping revert");
        return;
      }
      throw e;
    }
  },
);
