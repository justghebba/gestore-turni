// PUT /api/shifts/:id  → aggiorna tipo di una singola cella turno

const VALID = ['Pranzo', 'Cena', 'Pranzo e cena', 'Dayoff'];

export async function onRequestPut({ params, request, env }) {
  try {
    const { shift_type } = await request.json();
    if (!VALID.includes(shift_type))
      return Response.json({ error: 'Tipo turno non valido.' }, { status: 400 });
    await env.DB.prepare(
      `UPDATE shifts SET shift_type = ? WHERE id = ?`
    ).bind(shift_type, params.id).run();
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
