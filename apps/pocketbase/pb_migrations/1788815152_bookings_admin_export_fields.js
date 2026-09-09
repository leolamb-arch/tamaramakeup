/// <reference path="../pb_data/types.d.ts" />

// Campos de notas, estado de anticipo y seguimiento de exportación
// para el panel "Calendario y reservas". Lectura/actualización solo admin.

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("bookings");

    if (!collection.fields.getByName("notes")) {
      collection.fields.add(
        new TextField({ name: "notes", required: false, max: 1000 }),
      );
    }

    if (!collection.fields.getByName("deposit_status")) {
      collection.fields.add(
        new SelectField({
          name: "deposit_status",
          required: false,
          maxSelect: 1,
          values: ["pending", "paid", "refunded"],
        }),
      );
    }

    if (!collection.fields.getByName("exported_google")) {
      collection.fields.add(
        new BoolField({ name: "exported_google", required: false }),
      );
    }

    if (!collection.fields.getByName("exported_apple")) {
      collection.fields.add(
        new BoolField({ name: "exported_apple", required: false }),
      );
    }

    // La administradora puede listar, ver y marcar exportaciones.
    // Crear sigue siendo solo servidor (null); borrar solo admin.
    collection.listRule = "@request.auth.role = 'admin'";
    collection.viewRule = "@request.auth.role = 'admin'";
    collection.updateRule = "@request.auth.role = 'admin'";
    collection.deleteRule = "@request.auth.role = 'admin'";

    app.save(collection);

    // Marca como pagado el anticipo de reservas ya confirmadas con referencia.
    const existing = app.findAllRecords("bookings");
    for (let i = 0; i < existing.length; i++) {
      const r = existing[i];
      let changed = false;
      if (!r.get("deposit_status")) {
        const ref = r.get("payment_ref") || "";
        r.set("deposit_status", ref ? "paid" : "pending");
        changed = true;
      }
      if (r.get("google_event_id") && !r.get("exported_google")) {
        r.set("exported_google", true);
        changed = true;
      }
      if (changed) app.save(r);
    }
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId("bookings");
      collection.listRule = null;
      collection.viewRule = null;
      collection.updateRule = null;
      collection.deleteRule = null;
      ["notes", "deposit_status", "exported_google", "exported_apple"].forEach(
        (n) => {
          try {
            collection.fields.removeByName(n);
          } catch (_) {}
        },
      );
      app.save(collection);
    } catch (_) {}
  },
);
