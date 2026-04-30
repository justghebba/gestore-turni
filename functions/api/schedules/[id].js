// GET    /api/schedules/:id  → dettaglio completo con celle
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

export async function onRequestDelete({ params, env }) {
  try {
    await env.DB.prepare(`DELETE FROM schedules WHERE id = ?`).bind(params.id).run();
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
