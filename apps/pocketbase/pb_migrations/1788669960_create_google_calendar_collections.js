/// <reference path="../pb_data/types.d.ts" />

// Colecciones de servidor para la integración con Google Calendar.
// Solo Express (superusuario) lee/escribe estos registros; ningún
// cliente accede por REST, por eso todas las reglas son null.

migrate(
  (app) => {
    // Tokens OAuth de Google (un solo registro).
    const tokens = new Collection({
      type: "base",
      name: "google_tokens",
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: "access_token", type: "text", max: 4000 },
        { name: "refresh_token", type: "text", max: 4000 },
        { name: "expiry", type: "text", max: 40 },
        { name: "scope", type: "text", max: 500 },
        { name: "created", type: "autodate", onCreate: true, onUpdate: false },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
    });
    app.save(tokens);

    // Registro de reservas confirmadas (prevención de duplicados).
    const bookings = new Collection({
      type: "base",
      name: "bookings",
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      indexes: [
        "create index bookings_date_time on bookings (event_date, event_time)",
      ],
      fields: [
        { name: "client_name", type: "text", max: 200 },
        { name: "phone", type: "text", max: 40 },
        { name: "email", type: "text", max: 200 },
        { name: "service", type: "text", max: 100 },
        { name: "event_type", type: "text", max: 100 },
        { name: "event_date", type: "text", max: 20 },
        { name: "event_time", type: "text", max: 10 },
        { name: "duration_hours", type: "number", onlyInt: true },
        { name: "location", type: "text", max: 300 },
        { name: "people", type: "number", onlyInt: true },
        { name: "deposit", type: "number" },
        { name: "total", type: "number" },
        { name: "payment_ref", type: "text", max: 100 },
        { name: "google_event_id", type: "text", max: 200 },
        {
          name: "status",
          type: "select",
          maxSelect: 1,
          values: ["confirmed", "cancelled"],
        },
        { name: "created", type: "autodate", onCreate: true, onUpdate: false },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
    });
    app.save(bookings);
  },
  (app) => {
    try { app.delete(app.findCollectionByNameOrId("google_tokens")); } catch (_) {}
    try { app.delete(app.findCollectionByNameOrId("bookings")); } catch (_) {}
  },
);
