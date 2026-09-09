/// <reference path="../pb_data/types.d.ts" />

// Bloqueo de horarios individuales.
// Añade un campo `blocked_slots` (json) a `schedule_config` para que la
// administradora pueda bloquear una hora concreta de una fecha sin afectar
// el resto del día. Además, siembra el bloque solicitado para el
// 2026-09-08 a las 16:00 (zona horaria America/Mexico_City).

migrate(
  (app) => {
    const schedule = app.findCollectionByNameOrId("schedule_config");

    if (!schedule.fields.getByName("blocked_slots")) {
      schedule.fields.add(
        new JSONField({ name: "blocked_slots", maxSize: 20000 }),
      );
      app.save(schedule);
    }

    // ── Siembra del bloque solicitado: 2026-09-08 16:00 (CDMX).
    let cfg = null;
    try {
      cfg = app.findFirstRecordByFilter("schedule_config", "id != ''");
    } catch (_) {
      cfg = null;
    }
    if (cfg) {
      // Normaliza el valor actual a un array JS plano (evita valores Go
      // crudos que no revalidan como JSON al guardar).
      let existing = [];
      try {
        const raw = cfg.get("blocked_slots");
        if (raw != null && raw !== "") {
          const s = typeof raw === "string" ? raw : JSON.stringify(raw);
          const parsed = JSON.parse(s);
          if (Array.isArray(parsed)) existing = parsed;
        }
      } catch (_) {
        existing = [];
      }
      const target = { date: "2026-09-08", time: "16:00" };
      const exists = existing.some(
        (b) => b && b.date === target.date && b.time === target.time,
      );
      if (!exists) existing.push(target);
      existing.sort((a, b) =>
        a.date === b.date
          ? String(a.time).localeCompare(String(b.time))
          : String(a.date).localeCompare(String(b.date)),
      );
      cfg.set("blocked_slots", JSON.stringify(existing));
      app.save(cfg);
    }
  },
  (app) => {
    try {
      const schedule = app.findCollectionByNameOrId("schedule_config");
      schedule.fields.removeByName("blocked_slots");
      app.save(schedule);
    } catch (_) {}
  },
);
