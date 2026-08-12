export async function handleRsvpCount(request, env) {
  const row = await env.DB.prepare(
    `SELECT COUNT(*) AS count FROM rsvps WHERE attending = 'yes'`
  ).first();

  return new Response(JSON.stringify({ ok: true, count: row?.count || 0 }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
