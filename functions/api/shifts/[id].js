// PUT /api/shifts/:id  → aggiorna tipo di una singola cella turno

const VALID = ['Pranzo', 'Cena', 'Pranzo e cena', 'Dayoff', 'Altro', 'P 📞', 'C 📞'];

export async function onRequestPut({ params, request, env }) {
  try {
    const { shift_type } = await request.json();
    // Normalizza "Altro: testo" → "Altro" prima della validazione
    // Accept 'Altro: testo' as a valid free-text variant
    const normalised = typeof shift_type === 'string' && shift_type.startsWith('Altro')
      ? shift_type   // store full string (Approach A)
      : shift_type;
    if (!VALID.includes(normalised) && !normalised.startsWith('Altro'))
      return Response.json({ error: 'Tipo turno non valido.' }, { status: 400 });
    await env.DB.prepare(
      `UPDATE shifts SET shift_type = ? WHERE id = ?`
    ).bind(normalised, params.id).run();
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
