/// <reference path="../pb_data/types.d.ts" />

// Añade `account_email` a `google_tokens` para poder mostrar en el panel
// /admin qué cuenta de Google Calendar quedó vinculada (sin exponer tokens).

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("google_tokens");
    collection.fields.add(new TextField({ name: "account_email", max: 200 }));
    app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("google_tokens");
    collection.fields.removeByName("account_email");
    app.save(collection);
  },
);
