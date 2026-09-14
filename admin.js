const SUPABASE_URL="https://avaworleivncevaoqeny.supabase.co";
const SUPABASE_ANON_KEY="sb_publishable_OZCDmpzZ1-pvN1rfTGqrpw_JatYPjIh";
const supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
let currentAdmin=null;
const ADMIN_EMAILS=["ezebolaprinceokechukwu@gmail.com","infocryptox2025@gmail.com","admin@monarch-codex.pages.dev","princeokechukwu@monarch.com"];
async function checkAdmin(){
 const {data:{user}}=await supabaseClient.auth.getUser();
 if(!user){ window.location.href="login.html"; return; }
 const {data:profile}=await supabaseClient.from("profiles").select("*").eq("id",user.id).single();
 const isAdminByEmail = ADMIN_EMAILS.includes((profile?.email||user.email||"").toLowerCase());
 if(isAdminByEmail && profile && profile.role==="member"){
   await supabaseClient.from("profiles").update({role:"admin"}).eq("id",user.id);
 }
 if(!isAdminByEmail && (!profile || (profile.role!=="admin" && profile.role!=="super_admin"))){
   console.warn("Not admin role, but email allowed:", user.email);
 }
 currentAdmin=user;
 loadAll();
}
async function loadAll(){
 const el=document.getElementById("updatedTime"); if(el) el.textContent="Updated: "+ new Date().toLocaleString();
 await loadStats(); await loadMembers(); await loadInvestments(); await loadPayments(); await loadPackages();
}
function setText(id,val){ const el=document.getElementById(id); if(el) el.textContent=val; }
async function loadStats(){
 try{
  const {count:members} = await supabaseClient.from("profiles").select("*",{count:"exact",head:true});
  const {data:invs}=await supabaseClient.from("investments").select("amount,status,user_id,created_at");
  const pending = invs?.filter(i=>i.status==="pending").length||0;
  const confirmed = invs?.filter(i=>i.status==="approved"||i.status==="confirmed").length||0;
  const rejected = invs?.filter(i=>i.status==="rejected").length||0;
  const total = invs?.filter(i=>i.status==="approved"||i.status==="confirmed").reduce((s,i)=>s+Number(i.amount||0),0)||0;
  const {count:pendingMembers} = await supabaseClient.from("profiles").select("*",{count:"exact",head:true}).eq("status","pending");
  setText("totalMembers", members||0);
  setText("pendingMembers", pendingMembers||0);
  setText("pendingInvestments", pending);
  setText("totalInvested", "$"+total.toLocaleString()+".00");
  setText("confirmedInvestments", confirmed);
  setText("rejectedInvestments", rejected);
  setText("totalEarnings", "$"+total.toLocaleString()+".00");
  setText("investCount", (invs?.length||0)+" investment request(s) found.");
  setText("memberCount", (members||0)+" members");
 }catch(e){ console.error("stats",e); }
}
async function loadMembers(){
 const tbody=document.getElementById("membersBody"); if(!tbody) return;
 tbody.innerHTML="<tr><td colspan=6>Loading members...</td></tr>";
 const {data:profiles,error}=await supabaseClient.from("profiles").select("*").order("created_at",{ascending:false}).limit(200);
 if(error){ tbody.innerHTML=`<tr><td colspan=6>${error.message}</td></tr>`; return; }
 const {data:invs}=await supabaseClient.from("investments").select("user_id,amount,status");
 const invMap={}; invs?.forEach(i=>{ if(!invMap[i.user_id]) invMap[i.user_id]={total:0}; if(i.status==="approved"||i.status==="confirmed") invMap[i.user_id].total+=Number(i.amount||0); });
 tbody.innerHTML=""; if(!profiles||!profiles.length){ tbody.innerHTML="<tr><td colspan=6>No members found. Check RLS policies for profiles.</td></tr>"; return; }
 profiles.forEach(p=>{
   const totalInv = invMap[p.id]?.total||0; const isActive = (p.status==="active"||!p.status);
   const tr=document.createElement("tr");
   tr.innerHTML=`<td><strong>${p.full_name||p.email||"Unknown"}</strong></td><td><span class="uid">${p.uid||p.referral_code||p.id.substring(0,8).toUpperCase()}</span> <button class="btn" style="padding:2px 6px;font-size:9px;margin-left:4px" onclick="copyUID('${p.uid||p.id}')">Copy</button></td><td><span class="badge ${isActive?'badge-active':'badge-pending'}">${isActive?'Active':'Pending'}</span></td><td>$${totalInv.toFixed(2)}</td><td><small>${p.created_at?new Date(p.created_at).toLocaleDateString()+' , '+new Date(p.created_at).toLocaleTimeString():'—'}</small></td><td class="action-col"><button class="btn btn-block" onclick="toggleBlock('${p.id}','${p.status}')">Block</button><button class="btn btn-view" onclick="viewMember('${p.id}')">View</button></td>`;
   tbody.appendChild(tr);
 });
}
function copyUID(uid){ navigator.clipboard.writeText(uid); alert("Copied: "+uid); }
async function toggleBlock(id,status){ const newStatus = status==="active"?"blocked":"active"; if(!confirm((newStatus==="blocked"?"Block":"Unblock")+" member?")) return; const {error}=await supabaseClient.from("profiles").update({status:newStatus}).eq("id",id); if(error) alert(error.message); else loadMembers(); }
async function viewMember(id){ const {data}=await supabaseClient.from("profiles").select("*").eq("id",id).single(); alert(JSON.stringify(data,null,2)); }
async function loadInvestments(){
 const tbody=document.getElementById("investmentsBody"); if(!tbody) return;
 tbody.innerHTML="<tr><td colspan=8>Loading investments...</td></tr>";
 let data, error; const res = await supabaseClient.from("investments").select("*, profiles(full_name,uid,email)").order("created_at",{ascending:false}).limit(100);
 data=res.data; error=res.error;
 if(error){ const res2=await supabaseClient.from("investments").select("*").order("created_at",{ascending:false}).limit(100); data=res2.data; error=res2.error; }
 if(error){ tbody.innerHTML=`<tr><td colspan=8>${error.message} — Check RLS for investments table</td></tr>`; return; }
 if(!data||!data.length){ tbody.innerHTML="<tr><td colspan=8>No investment requests found. Table empty.</td></tr>"; return; }
 tbody.innerHTML="";
 data.forEach(row=>{
   const memberName = row.profiles?.full_name || row.user_id?.substring(0,8) || "Member"; const uid = row.profiles?.uid || row.user_id?.substring(0,8) || "";
   const statusClass = row.status==="approved"||row.status==="confirmed"?"badge-confirmed":row.status==="rejected"?"badge-rejected":"badge-pending";
   const receiptStatus = row.receipt_url?"Pending":row.receipt?"Pending":"Missing"; const receiptBadge = row.receipt_url||row.receipt?"badge-pending":"badge-missing";
   const tr=document.createElement("tr");
   tr.innerHTML=`<td><strong>${memberName}</strong> <small>${uid}</small></td><td>${row.package_name||row.package_id||"$30 Package"}</td><td>$${Number(row.amount||0).toFixed(2)}</td><td>${row.payment_method||"bank"}</td><td><span class="badge ${statusClass}">${row.status}</span></td><td><span class="badge ${receiptBadge}">${receiptStatus}</span> ${row.receipt_url?`<a href="#" onclick="showReceipt('${row.receipt_url}');return false" style="color:var(--gold);margin-left:6px">View</a>`:''}</td><td><small>${row.created_at?new Date(row.created_at).toLocaleDateString():'—'}</small></td><td>${row.status==="pending"?`<button class="btn btn-approve" style="padding:4px 8px;font-size:10px" onclick="approveInvestment('${row.id}')">Approve</button> <button class="btn btn-reject" style="padding:4px 8px;font-size:10px;margin-top:4px" onclick="rejectInvestment('${row.id}')">Reject</button>`:`<span class="badge ${statusClass}">${row.status}</span>`}</td>`;
   tbody.appendChild(tr);
 });
}
function showReceipt(url){ const modal=document.getElementById("receiptModal"); const content=document.getElementById("receiptContent"); if(!modal||!content) { window.open(url,"_blank"); return; } if(url.match(/\.(jpg|jpeg|png|webp)$/i)){ content.innerHTML=`<img src="${url}" style="max-width:100%"> <br><a href="${url}" target="_blank" style="color:var(--gold)">Open full</a>`; } else { content.innerHTML=`<a href="${url}" target="_blank" style="color:var(--gold);word-break:break-all">${url}</a>`; } modal.style.display="flex"; }
async function approveInvestment(id){ if(!confirm("Approve this investment?")) return; const {error}=await supabaseClient.from("investments").update({status:"approved", approved_at:new Date().toISOString()}).eq("id",id); if(error){ alert(error.message); return; } alert("Approved!"); loadAll(); }
async function rejectInvestment(id){ if(!confirm("Reject this investment?")) return; const {error}=await supabaseClient.from("investments").update({status:"rejected"}).eq("id",id); if(error){ alert(error.message); return; } loadAll(); }
async function loadPayments(){
 const list=document.getElementById("cryptoList"); if(!list) return;
 const {data}=await supabaseClient.from("payment_details").select("*");
 if(!data) return; list.innerHTML="<h4 style='color:var(--gold);margin-bottom:8px'>Crypto Wallets</h4>";
 data.filter(d=> (d.payment_type==="crypto"||d.crypto_name) ).forEach(d=>{
   const div=document.createElement("div"); div.style="background:#0f0f0f;border:1px solid var(--border2);border-radius:10px;padding:12px;margin-bottom:8px";
   div.innerHTML=`<strong>${d.crypto_name||d.title} — ${d.crypto_network||""}</strong><br><small style="color:#777;word-break:break-all">${d.wallet_address||""}</small><br><input value="${d.wallet_address||""}" id="wallet_${d.id}" style="margin-top:8px;width:100%;background:#0e0e0e;border:1px solid var(--border2);color:#fff;padding:8px;border-radius:8px"><button class="btn btn-gold" style="margin-top:6px" onclick="updateWallet('${d.id}')">Update</button>`;
   list.appendChild(div);
 });
}
async function updateBank(){
 const payload={ bank_name: document.getElementById("p_bank_name")?.value, account_name: document.getElementById("p_account_name")?.value, account_number: document.getElementById("p_account_number")?.value, minimum_amount: Number(document.getElementById("p_min_amount")?.value||0), payment_type:"bank", active:true };
 const {error}=await supabaseClient.from("payment_details").update(payload).eq("id",1); if(error) alert(error.message); else alert("Bank updated");
}
async function updateWallet(id){ const val=document.getElementById("wallet_"+id)?.value; const {error}=await supabaseClient.from("payment_details").update({wallet_address:val}).eq("id",id); if(error) alert(error.message); else alert("Wallet updated"); }
async function loadPackages(){
 const tbody=document.getElementById("packagesBody"); if(!tbody) return; const {data}=await supabaseClient.from("packages").select("*").order("amount"); if(!data) return; tbody.innerHTML=""; data.forEach(p=>{ const tr=document.createElement("tr"); tr.innerHTML=`<td>${p.name}</td><td>$${p.amount}</td><td>${p.active?"Yes":"No"}</td><td><button class="btn btn-reject" onclick="togglePackage('${p.id}',${!p.active})">${p.active?"Deactivate":"Activate"}</button></td>`; tbody.appendChild(tr); });
}
async function togglePackage(id,active){ await supabaseClient.from("packages").update({active}).eq("id",id); loadPackages(); }
async function addPackage(){ const name=document.getElementById("new_pkg_name")?.value; const amount=Number(document.getElementById("new_pkg_amount")?.value); if(!name||!amount) return alert("Fill name and amount"); const {error}=await supabaseClient.from("packages").insert({name,amount,active:true}); if(error) alert(error.message); else { alert("Added"); loadPackages(); } }
async function sendEmail(){ const to=document.getElementById("email_to")?.value.trim(); const subject=document.getElementById("email_subject")?.value.trim(); const body=document.getElementById("email_body")?.value.trim(); if(!to||!subject||!body) return alert("Fill all fields"); const el=document.getElementById("emailStatus"); if(el) el.textContent="Sending..."; try{ const {data,error}=await supabaseClient.functions.invoke("send-email",{body:{to,subject,html:body}}); if(error) throw error; if(el) el.textContent="Sent! "+JSON.stringify(data); } catch(e){ if(el) el.textContent="Error: "+e.message; } }
checkAdmin();
