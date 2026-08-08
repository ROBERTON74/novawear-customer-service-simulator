const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OWNER_DASHBOARD_KEY = process.env.OWNER_DASHBOARD_KEY;

function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

async function supabaseRequest(path, options = {}) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase no configurado");
  }
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      ...options.headers
    }
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Supabase respondió ${response.status}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
      const startedAt = body.started_at ? new Date(body.started_at) : null;
      const finishedAt = body.finished_at ? new Date(body.finished_at) : null;
      const durationSeconds = startedAt && finishedAt ? Math.max(0, Math.round((finishedAt - startedAt) / 1000)) : 0;
      await supabaseRequest("training_progress", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          agent_name: body.agent_name || "Mari Luz Sanabria",
          call_id: body.call_id || null,
          order_number: body.order_number || null,
          customer_name: body.customer_name || null,
          scenario_type: body.scenario_type || null,
          started_at: body.started_at || null,
          finished_at: body.finished_at || new Date().toISOString(),
          duration_seconds: durationSeconds,
          score: Number.isFinite(body.score) ? body.score : null,
          actions: body.actions || {},
          verification: body.verification || {},
          result: body.result || {}
        })
      });
      return json(res, 200, { ok: true });
    }

    if (req.method === "GET") {
      const ownerKey = req.headers["x-owner-key"];
      if (!OWNER_DASHBOARD_KEY || ownerKey !== OWNER_DASHBOARD_KEY) {
        return json(res, 403, { error: "Acceso privado" });
      }
      const rows = await supabaseRequest("training_progress?select=*&order=finished_at.desc&limit=500");
      return json(res, 200, rows);
    }

    return json(res, 405, { error: "Método no permitido" });
  } catch (error) {
    return json(res, 500, { error: error.message });
  }
}
