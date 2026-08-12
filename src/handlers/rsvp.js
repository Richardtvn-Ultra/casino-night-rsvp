const ATTENDING_VALUES = new Set(["yes", "no_ilse"]);
const PARTNER_VALUES = new Set(["yes", "no"]);
const DIETARY_VALUES = new Set([
  "vegetarian",
  "vegan",
  "kosher",
  "halal",
  "gluten_free",
  "none",
  "other",
]);
const TABLE_PREF_VALUES = new Set(["playing", "not_playing", "not_sure"]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function badRequest(message) {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status: 400,
    headers: { "content-type": "application/json" },
  });
}

export async function handleRsvp(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid submission.");
  }

  const full_name = (body.full_name || "").toString().trim().slice(0, 200);
  const email = (body.email || "").toString().trim().slice(0, 200);
  const attending = (body.attending || "").toString().trim();
  const bringing_partner = (body.bringing_partner || "").toString().trim();
  const dietary = (body.dietary || "").toString().trim();
  const dietary_other = (body.dietary_other || "").toString().trim().slice(0, 200);
  const table_preference = (body.table_preference || "").toString().trim();

  if (!full_name) return badRequest("Please enter your full name.");
  if (!email || !EMAIL_RE.test(email)) return badRequest("Please enter a valid email address.");
  if (!ATTENDING_VALUES.has(attending)) return badRequest("Please let us know if you're attending.");
  if (!PARTNER_VALUES.has(bringing_partner)) return badRequest("Please let us know about bringing a partner.");
  if (!DIETARY_VALUES.has(dietary)) return badRequest("Please choose a dietary option.");
  if (dietary === "other" && !dietary_other) return badRequest("Please tell us your dietary requirement.");
  if (table_preference && !TABLE_PREF_VALUES.has(table_preference)) return badRequest("Invalid table preference.");

  await env.DB.prepare(
    `INSERT INTO rsvps (full_name, email, attending, bringing_partner, dietary, dietary_other, table_preference)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      full_name,
      email,
      attending,
      bringing_partner,
      dietary,
      dietary === "other" ? dietary_other : null,
      table_preference || null
    )
    .run();

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
