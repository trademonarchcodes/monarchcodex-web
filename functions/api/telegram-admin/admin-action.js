const TELEGRAM_WORKER_URL = "https://monarch-codex-telegram.trademarchofficial.workers.dev";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Cache-Control": "no-store"
};

function json(body, status=200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {...CORS_HEADERS, "Content-Type":"application/json; charset=UTF-8"}
  });
}

async function forward(context) {
  const {request, env} = context;
  const headers = new Headers();
  const auth = request.headers.get("Authorization");
  if (auth) headers.set("Authorization", auth);
  headers.set("Content-Type", request.headers.get("Content-Type") || "application/json");
  const body = await request.text();

  const target = new URL("/telegram/admin-action", "https://telegram-internal.invalid");
  const forwarded = new Request(target.toString(), {method:"POST", headers, body});

  if (env.TELEGRAM_SERVICE) {
    return env.TELEGRAM_SERVICE.fetch(forwarded);
  }

  return fetch(TELEGRAM_WORKER_URL + "/telegram/admin-action", {method:"POST", headers, body});
}

export async function onRequest(context) {
  const {request}=context;
  if (request.method==="OPTIONS") return new Response(null,{status:204,headers:CORS_HEADERS});
  if (request.method!=="POST") return json({ok:false,error:"Method not allowed"},405);

  try {
    const upstream = await forward(context);
    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: {...CORS_HEADERS, "Content-Type": upstream.headers.get("Content-Type") || "application/json; charset=UTF-8"}
    });
  } catch(error) {
    return json({
      ok:false,
      error:"Telegram operations service could not be reached.",
      detail:error?.message || "Upstream request failed."
    },502);
  }
}
