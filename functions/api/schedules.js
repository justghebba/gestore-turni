// GET  /api/schedules  → lista turni salvati
// POST /api/schedules  → crea nuovo turno completo

export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare(
      `SELECT id, title, week_start, week_end, created_at
       FROM schedules ORDER BY created_at DESC LIMIT 100`
    ).all();
    return Response.json({ schedules: results });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const { title, week_start, week_end, employees } = await request.json();

    if (!week_start || !week_end || !Array.isArray(employees) || !employees.length)
      return Response.json({ error: 'Dati mancanti.' }, { status: 400 });

    const label = title?.trim() || `Turni ${week_start} - ${week_end}`;

    const sched = await env.DB.prepare(
      `INSERT INTO schedules (title, week_start, week_end) VALUES (?,?,?)`
    ).bind(label, week_start, week_end).run();
    const scheduleId = sched.meta.last_row_id;

    const shiftMap = {};
    for (const emp of employees) {
      const e = await env.DB.prepare(
        `INSERT INTO employees (schedule_id, name) VALUES (?,?)`
      ).bind(scheduleId, emp.name).run();
      const empId = e.meta.last_row_id;
      shiftMap[emp.name] = {};
      for (const [date, type] of Object.entries(emp.shifts)) {
        const shiftType = (typeof type === 'string' && type.startsWith('Altro')) ? 'Altro' : type;
        const s = await env.DB.prepare(
          `INSERT INTO shifts (employee_id, shift_date, shift_type) VALUES (?,?,?)`
        ).bind(empId, date, shiftType).run();
        shiftMap[emp.name][date] = s.meta.last_row_id;
      }
    }

    return Response.json({ id: scheduleId, shiftMap }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
