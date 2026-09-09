/// <reference path="../pb_data/types.d.ts" />

// Colección pública para captar leads (lead magnet de la guía de piel).
// Cualquier visitante puede registrarse (createRule ""); las reglas de
// lectura/edición quedan privadas (null) para que solo el admin las vea.

migrate(
  (app) => {
    const leads = new Collection({
      type: "base",
      name: "leads",
      listRule: null,
      viewRule: null,
      createRule: "",
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: "name", type: "text", max: 200, required: true },
        { name: "email", type: "email", max: 200, required: true },
        { name: "source", type: "text", max: 100 },
        { name: "created", type: "autodate", onCreate: true, onUpdate: false },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
    });
    app.save(leads);
  },
  (app) => {
    try { app.delete(app.findCollectionByNameOrId("leads")); } catch (_) {}
  },
);
