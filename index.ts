// supabase/functions/send-email/index.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "Monarch Codex <no-reply@monarchcodex.com>";
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" } });
  }
  try {
    if (!RESEND_API_KEY) return new Response(JSON.stringify({error:"RESEND_API_KEY not set"}), {status:500, headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
    const {to, subject, html} = await req.json();
    if (!to||!subject||!html) return new Response(JSON.stringify({error:"Missing to,subject,html"}), {status:400, headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
    let recipients = typeof to === "string" ? to.split(",").map(s=>s.trim()) : to;
    if (recipients.length===0) recipients=[to];
    const results=[];
    for (const email of recipients) {
      if (email.toLowerCase()==="all") continue;
      const res = await fetch("https://api.resend.com/emails", {method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${RESEND_API_KEY}`},body:JSON.stringify({from:FROM_EMAIL,to:[email],subject,html})});
      const data = await res.json();
      results.push({email, success:res.ok, data});
    }
    return new Response(JSON.stringify({success:true, results}), {headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}});
  } catch(e){ return new Response(JSON.stringify({error:e.message}), {status:500, headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}}); }
});
