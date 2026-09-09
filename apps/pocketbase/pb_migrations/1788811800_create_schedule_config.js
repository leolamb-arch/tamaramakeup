/// <reference path="../pb_data/types.d.ts" />

// Panel privado de administración de agenda.
// 1) Añade un campo `role` a `users` (member/admin), cierra el registro
//    público y siembra la cuenta administradora de la propietaria.
// 2) Crea la colección `schedule_config` (solo la admin puede editarla)
//    con la configuración de disponibilidad: días activos, bloques de
//    horario, duración de cada cita, descansos y fechas bloqueadas.
//    Un registro por defecto queda sembrado para que el calendario
//    público funcione desde el primer momento.

migrate(
  (app) => {
    // ── 1) Colección `users` ya existe: la resolvemos y la extendemos.
    const users = app.findCollectionByNameOrId("users");

    if (!users.fields.getByName("role")) {
      users.fields.add(
        new SelectField({
          name: "role",
          required: false,
          maxSelect: 1,
          values: ["member", "admin"],
        }),
      );
    }

    // Registro público cerrado: nadie puede crear su propia cuenta.
    // Solo la admin sembrada existe. Usa "" únicamente si se pidiera
    // registro público explícito.
    users.createRule = null;
    app.save(users);

    // ── Siembra de la cuenta administradora (solo si no existe).
    let admin = null;
    try {
      admin = app.findAuthRecordByEmail("users", "admin@tamaraaldrete.com");
    } catch (_) {
      admin = new Record(users);
      admin.setEmail("admin@tamaraaldrete.com");
      admin.setPassword("Tamara#Admin2026!");
      admin.set("name", "Tamara Aldrete");
      admin.set("role", "admin");
      admin.set("verified", true);
      app.save(admin);
    }

    // ── 2) Colección `schedule_config` (acceso solo para la admin).
    let schedule;
    try {
      schedule = app.findCollectionByNameOrId("schedule_config");
    } catch (_) {
      schedule = new Collection({
        type: "base",
        name: "schedule_config",
        listRule: "@request.auth.role = 'admin'",
        viewRule: "@request.auth.role = 'admin'",
        createRule: "@request.auth.role = 'admin'",
        updateRule: "@request.auth.role = 'admin'",
        deleteRule: "@request.auth.role = 'admin'",
        fields: [
          { name: "active_days", type: "json", maxSize: 2000 },
          { name: "time_blocks", type: "json", maxSize: 20000 },
          { name: "appointment_duration", type: "number", onlyInt: true },
          { name: "breaks", type: "json", maxSize: 20000 },
          { name: "blocked_dates", type: "json", maxSize: 20000 },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
      });
      app.save(schedule);
    }

    // ── Registro de configuración por defecto (si no hay ninguno).
    let cfg = null;
    try {
      cfg = app.findFirstRecordByFilter("schedule_config", "id != ''");
    } catch (_) {
      cfg = null;
    }
    if (!cfg) {
      cfg = new Record(schedule);
      cfg.set("active_days", [1, 2, 3, 4, 5, 6]); // Lun–Sáb (0=Domingo)
      cfg.set("time_blocks", [{ start: "09:00", end: "19:00" }]);
      cfg.set("appointment_duration", 60);
      cfg.set("breaks", []);
      cfg.set("blocked_dates", []);
      app.save(cfg);
    }
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId("schedule_config"));
    } catch (_) {}
    try {
      const admin = app.findAuthRecordByEmail("users", "admin@tamaraaldrete.com");
      app.delete(admin);
    } catch (_) {}
    try {
      const users = app.findCollectionByNameOrId("users");
      users.fields.removeByName("role");
      app.save(users);
    } catch (_) {}
  },
);
