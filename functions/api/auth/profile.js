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
      "Access-Control-Allow-Methods": "GET, OPTIONS"
    }
  });
}

export async function onRequest(context) {
  const { request } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
      "Access-Control-Allow-Methods": "GET, OPTIONS"
    }});
  }

  if (request.method !== "GET") {
    return json({ ok: false, error: "Method not allowed." }, 405);
  }

  const authorization = request.headers.get("Authorization");
  const userId = new URL(request.url).searchParams.get("id");
  if (!authorization) {
    return json({ ok: false, error: "Missing authorization." }, 401);
  }
  if (!userId) {
    return json({ ok: false, error: "Missing user id." }, 400);
  }

  try {
    const upstream = await fetch(
      SUPABASE_URL + "/rest/v1/profiles?select=*&id=eq." + encodeURIComponent(userId),
      {
        method: "GET",
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": authorization
        }
      }
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
  } catch (error) {
    return json({
      ok: false,
      error: "Profile service could not be reached.",
      detail: error?.message || "Upstream profile request failed."
    }, 502);
  }
}
