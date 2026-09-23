export async function onRequest(context) {
  const { request, env } = context;
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (request.method !== "GET") return new Response(JSON.stringify({ ok:false, error:"Method not allowed" }), { status:405, headers:{...headers,"Content-Type":"application/json; charset=UTF-8"} });

  const targetBase = "https://monarch-codex-telegram.trademarchofficial.workers.dev";
  const target = new URL("/telegram/admin-chat-members", targetBase);
  const incoming = new URL(request.url);
  incoming.searchParams.forEach((value, key) => target.searchParams.set(key, value));

  const auth = request.headers.get("Authorization");
  const upstream = env.TELEGRAM_SERVICE
    ? await env.TELEGRAM_SERVICE.fetch(new Request(target.toString(), { method:"GET", headers:{ Authorization: auth || "" } }))
    : await fetch(target.toString(), { headers:{ Authorization: auth || "" } });

  const body = await upstream.text();
  return new Response(body, {
    status: upstream.status,
    headers: {
      ...headers,
      "Content-Type": upstream.headers.get("Content-Type") || "application/json; charset=UTF-8",
    },
  });
}