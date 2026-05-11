// GET    /api/schedules/:id  → dettaglio completo con celle
// PUT    /api/schedules/:id  → aggiorna titolo + tutti i turni
// DELETE /api/schedules/:id  → elimina (cascade su employees e shifts)

export async function onRequestGet({ params, env }) {
  try {
    const schedule = await env.DB.prepare(
      `SELECT * FROM schedules WHERE id = ?`
    ).bind(params.id).first();

    if (!schedule)
      return Response.json({ error: 'Non trovato.' }, { status: 404 });

    const { results: rows } = await env.DB.prepare(
      `SELECT e.id AS emp_id, e.name,
              s.id AS shift_id, s.shift_date, s.shift_type
       FROM employees e
       LEFT JOIN shifts s ON s.employee_id = e.id
       WHERE e.schedule_id = ?
       ORDER BY e.id, s.shift_date`
    ).bind(params.id).all();

    const empMap = {};
    for (const row of rows) {
      if (!empMap[row.emp_id])
        empMap[row.emp_id] = { id: row.emp_id, name: row.name, shifts: {} };
      if (row.shift_date)
        empMap[row.emp_id].shifts[row.shift_date] = { id: row.shift_id, type: row.shift_type };
    }

    return Response.json({ schedule, employees: Object.values(empMap) });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function onRequestPut({ params, env, request }) {
  try {
    const { title, week_start, week_end, employees } = await request.json();
    const id = params.id;

    // 1. Aggiorna metadati schedule
    await env.DB.prepare(
      `UPDATE schedules SET title = ?, week_start = ?, week_end = ? WHERE id = ?`
    ).bind(title, week_start, week_end, id).run();

    // 2. Recupera dipendenti esistenti
    const { results: existingEmps } = await env.DB.prepare(
      `SELECT id, name FROM employees WHERE schedule_id = ?`
    ).bind(id).all();

    const existingMap = Object.fromEntries(existingEmps.map(e => [e.name, e.id]));
    const shiftMap = {};

    for (const emp of employees) {
      let empId = existingMap[emp.name];

      // Crea dipendente se non esiste
      if (!empId) {
        const res = await env.DB.prepare(
          `INSERT INTO employees (schedule_id, name) VALUES (?, ?)`
        ).bind(id, emp.name).run();
        empId = res.meta.last_row_id;
      }

      shiftMap[emp.name] = {};

      for (const [date, type] of Object.entries(emp.shifts)) {
        // Normalizza "Altro: testo" → "Altro" per D1
        // Approach A: store full string (Altro: testo, P 📞, C 📞)
        const shiftType = typeof type === 'string' ? type : 'Dayoff';

        // Upsert turno (inserisci o aggiorna se già esiste per quella data)
        const existing = await env.DB.prepare(
          `SELECT id FROM shifts WHERE employee_id = ? AND shift_date = ?`
        ).bind(empId, date).first();

        if (existing) {
          await env.DB.prepare(
            `UPDATE shifts SET shift_type = ? WHERE id = ?`
          ).bind(shiftType, existing.id).run();
          shiftMap[emp.name][date] = existing.id;
        } else {
          const res = await env.DB.prepare(
            `INSERT INTO shifts (employee_id, shift_date, shift_type) VALUES (?, ?, ?)`
          ).bind(empId, date, shiftType).run();
          shiftMap[emp.name][date] = res.meta.last_row_id;
        }
      }
    }

    return Response.json({ id: parseInt(id), shiftMap });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function onRequestDelete({ params, env }) {
  try {
    await env.DB.prepare(`DELETE FROM schedules WHERE id = ?`).bind(params.id).run();
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
