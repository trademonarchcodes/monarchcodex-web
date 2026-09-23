const TELEGRAM_WORKER_URL = "https://monarch-codex-telegram.trademarchofficial.workers.dev";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Cache-Control": "no-store"
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json; charset=UTF-8"
    }
  });
}

export async function onRequest(context) {
  const { request, params } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== "GET" && request.method !== "POST") {
    return json({ ok: false, error: "Method not allowed" }, 405);
  }

  const segments = Array.isArray(params.path) ? params.path : [params.path].filter(Boolean);
  const endpoint = segments.join("/");

  const allowed = new Set([
    "admin-chats",
    "admin-chat-assignment",
    "admin-action"
  ]);

  if (!allowed.has(endpoint)) {
    return json({ ok: false, error: "Telegram admin endpoint not found." }, 404);
  }

  try {
    const headers = new Headers();
    const authorization = request.headers.get("Authorization");
    if (authorization) headers.set("Authorization", authorization);

    const contentType = request.headers.get("Content-Type");
    if (contentType) headers.set("Content-Type", contentType);

    const upstream = await fetch(TELEGRAM_WORKER_URL + "/telegram/" + endpoint, {
      method: request.method,
      headers,
      body: request.method === "POST" ? await request.text() : undefined
    });

    const text = await upstream.text();

    return new Response(text, {
      status: upstream.status,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": upstream.headers.get("Content-Type") || "application/json; charset=UTF-8"
      }
    });
  } catch (error) {
    return json({
      ok: false,
      error: "Telegram operations service could not be reached.",
      detail: error?.message || "Upstream request failed."
    }, 502);
  }
}
