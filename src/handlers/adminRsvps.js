function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

function isAuthorized(request, env) {
  const supplied = request.headers.get("x-admin-password") || "";
  const expected = env.ADMIN_PASSWORD || "";
  return expected && timingSafeEqual(supplied, expected);
}

const DIETARY_LABELS = {
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  kosher: "Kosher",
  halal: "Halal",
  gluten_free: "Gluten-free",
  none: "None",
  other: "Other",
};

const ATTENDING_LABELS = {
  yes: "Yes",
  no_ilse: "No - arranged with Ilse",
};

const TABLE_PREF_LABELS = {
  playing: "Playing at the tables",
  not_playing: "Not playing - food, drinks and company",
  not_sure: "Not sure yet",
};

function csvEscape(value) {
  const str = (value ?? "").toString();
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function handleAdminRsvps(request, env) {
  if (!isAuthorized(request, env)) {
    return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const { results } = await env.DB.prepare(
    `SELECT id, full_name, email, attending, bringing_partner, dietary, dietary_other, table_preference, submitted_at
     FROM rsvps ORDER BY submitted_at DESC`
  ).all();

  const url = new URL(request.url);
  if (url.searchParams.get("format") === "csv") {
    const header = [
      "Full name",
      "Email",
      "Attending",
      "Bringing partner",
      "Dietary",
      "Dietary (other)",
      "Table preference",
      "Submitted at",
    ];
    const rows = results.map((r) =>
      [
        r.full_name,
        r.email,
        ATTENDING_LABELS[r.attending] || r.attending,
        r.bringing_partner === "yes" ? "Yes" : r.bringing_partner === "no" ? "No" : "",
        DIETARY_LABELS[r.dietary] || r.dietary || "",
        r.dietary_other || "",
        TABLE_PREF_LABELS[r.table_preference] || r.table_preference || "",
        r.submitted_at,
      ]
        .map(csvEscape)
        .join(",")
    );
    const csv = [header.join(","), ...rows].join("\r\n");
    return new Response(csv, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="casino-night-rsvps.csv"`,
      },
    });
  }

  const summary = {
    total: results.length,
    attending_yes: results.filter((r) => r.attending === "yes").length,
    attending_no: results.filter((r) => r.attending === "no_ilse").length,
    bringing_partner: results.filter((r) => r.bringing_partner === "yes").length,
    playing_tables: results.filter((r) => r.table_preference === "playing").length,
  };

  return new Response(JSON.stringify({ ok: true, summary, rows: results }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
