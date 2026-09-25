const SUPABASE_URL = "https://avaworleivncevaoqeny.supabase.co";
const SUPABASE_KEY = "sb_publishable_OZCDmpzZ1-pvN1rfTGqrpw_JatYPjIh";

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS"
    }
  });
}

async function getCurrentUser(request) {
  const authorization = request.headers.get("Authorization");
  if (!authorization) return null;

  const response = await fetch(SUPABASE_URL + "/auth/v1/user", {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: authorization
    }
  });

  if (!response.ok) return null;
  return await response.json();
}

async function getProfile(userId, authorization) {
  const response = await fetch(
    SUPABASE_URL + "/rest/v1/profiles?select=id,email,role,status&id=eq." + encodeURIComponent(userId) + "&limit=1",
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: authorization
      }
    }
  );
  if (!response.ok) return null;
  const rows = await response.json();
  return Array.isArray(rows) ? rows[0] || null : null;
}

function isAdmin(profile) {
  const role = String(profile?.role || "").toLowerCase();
  return [
    "admin",
    "super_admin",
    "sovereign_desk",
    "sovereign-desk",
    "kyc_admin",
    "payment_admin",
    "support_admin"
  ].includes(role);
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      }
    });
  }

  if (request.method !== "POST") {
    return json({ ok: false, error: "Method not allowed." }, 405);
  }

  const authorization = request.headers.get("Authorization");
  const user = await getCurrentUser(request);
  if (!user?.id || !authorization) {
    return json({ ok: false, error: "Unauthorized." }, 401);
  }

  const profile = await getProfile(user.id, authorization);
  if (!profile || !isAdmin(profile)) {
    return json({ ok: false, error: "Admin access required." }, 403);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body." }, 400);
  }

  const eventKey = String(body?.event_key || "").trim();
  const eventType = String(body?.event_type || "").trim();
  const message = String(body?.message || "").trim();

  if (!eventKey || !eventType || !message) {
    return json({ ok: false, error: "event_key, event_type and message are required." }, 400);
  }

  const upstream = await fetch(
    "https://monarch-codex-telegram.trademarchofficial.workers.dev/notifications/dispatch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-MONARCH-NOTIFICATION-SECRET": env.NOTIFICATION_INTERNAL_SECRET || ""
      },
      body: JSON.stringify({
        event_key: eventKey,
        event_type: eventType,
        message,
        template_name: body?.template_name || "hello_world",
        payload: body?.payload || {}
      })
    })
  );

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") || "application/json; charset=UTF-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
