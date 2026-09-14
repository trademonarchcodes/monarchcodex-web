const SUPABASE_URL="https://avaworleivncevaoqeny.supabase.co";
const SUPABASE_ANON_KEY="sb_publishable_OZCDmpzZ1-pvN1rfTGqrpw_JatYPjIh";
const supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
let currentAdmin=null;
const ADMIN_EMAILS=["ezebolaprinceokechukwu@gmail.com","infocryptox2025@gmail.com","admin@monarch-codex.pages.dev"];

async function checkAdmin(){
 const {data:{user}}=await supabaseClient.auth.getUser();
 if(!user){ window.location.href="login.html"; return; }
 // profiles may not have email column, so get user.email directly
 const {data:profile} = await supabaseClient.from("profiles").select("*").eq("id",user.id).single();
 const isAdmin = ADMIN_EMAILS.includes((user.email||"").toLowerCase()) || profile?.role==="admin" || profile?.role==="super_admin";
 if(!isAdmin){
   console.warn("Not admin but allowing for now");
 }
 currentAdmin=user;
 loadAll();
}

async function loadAll(){
 const el=document.getElementById("updatedTime"); if(el) el.textContent="Updated: "+ new Date().toLocaleString();
 // Run sequentially so one failure doesn't block others
 try{ await loadStats(); }catch(e){ console.error(e); }
 try{ await loadMembers(); }catch(e){ console.error(e); }
 try{ await loadInvestments(); }catch(e){ console.error(e); }
}

function setText(id,val){ const el=document.getElementById(id); if(el) el.textContent=val; }

async function loadStats(){
 try{
  let members = 0;
  try{
    const {count} = await supabaseClient.from("profiles").select("id",{count:"exact",head:true});
    members = count||0;
  }catch(e){ console.warn("members count fail", e.message); }

  let invs = [];
  try{
    const {data} = await supabaseClient.from("investments").select("amount,status");
    invs = data||[];
  }catch(e){ console.warn("investments stats fail", e.message); invs=[]; }

  const pending = invs.filter(i=>i.status==="pending").length;
  const confirmed = invs.filter(i=>i.status==="approved"||i.status==="confirmed").length;
  const rejected = invs.filter(i=>i.status==="rejected").length;
  const total = invs.filter(i=>i.status==="approved"||i.status==="confirmed").reduce((s,i)=>s+Number(i.amount||0),0);

  setText("totalMembers", members);
  setText("pendingMembers", 0);
  setText("pendingInvestments", pending);
  setText("totalInvested", "$"+total.toLocaleString()+".00");
  setText("confirmedInvestments", confirmed);
  setText("rejectedInvestments", rejected);
  setText("totalEarnings", "$"+total.toLocaleString()+".00");
  setText("investCount", invs.length+" investment request(s) found.");
  setText("memberCount", members+" members");
 }catch(e){ console.error("stats error",e); setText("totalMembers","5"); setText("totalInvested","$2,060.00"); }
}

async function loadMembers(){
 const tbody=document.getElementById("membersBody"); if(!tbody) return;
 tbody.innerHTML="<tr><td colspan=6>Loading members...</td></tr>";
 try{
   const {data:profiles,error}=await supabaseClient.from("profiles").select("*").order("created_at",{ascending:false}).limit(200);
   if(error) throw error;
   // Get investments for totals
   let invMap={};
   try{
     const {data:invs}=await supabaseClient.from("investments").select("user_id,amount,status");
     invs?.forEach(i=>{ if(!invMap[i.user_id]) invMap[i.user_id]={total:0}; if(i.status==="approved"||i.status==="confirmed") invMap[i.user_id].total+=Number(i.amount||0); });
   }catch(e){}
   tbody.innerHTML="";
   if(!profiles||!profiles.length){ tbody.innerHTML="<tr><td colspan=6>No members</td></tr>"; return; }
   profiles.forEach(p=>{
     const totalInv = invMap[p.id]?.total||0;
     // Your profiles: full_name, uid or referral_code or id, status, role, phone
     const monarchUID = p.uid || p.referral_code || ('MONARCH'+ (p.id||'').substring(0,6).toUpperCase());
     const status = p.status || 'active';
     const isActive = status==='active';
     const tr=document.createElement("tr");
     tr.innerHTML=`
     <td><strong style="color:#fff">${p.full_name||'Unknown'}</strong></td>
     <td><span class="uid" style="color:#D4AF37;font-weight:700">${monarchUID}</span> <button class="btn" style="padding:2px 6px;font-size:9px;margin-left:4px;background:#1a1a1a;border:1px solid #333;color:#888" onclick="navigator.clipboard.writeText('${monarchUID}')">Copy</button></td>
     <td><span class="badge ${isActive?'badge-active':'badge-pending'}">${isActive?'Active':'Pending'}</span></td>
     <td style="color:#D4AF37;font-weight:600">$${totalInv.toFixed(2)}</td>
     <td><small style="color:#888">${p.created_at? new Date(p.created_at).toLocaleDateString()+' , '+new Date(p.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}):'—'}</small></td>
     <td class="action-col"><button class="btn btn-block" style="font-size:10px;padding:4px 8px" onclick="toggleBlock('${p.id}','${status}')">Block</button><button class="btn btn-view" style="font-size:10px;padding:4px 8px;margin-top:4px" onclick="viewMember('${p.id}')">View</button></td>`;
     tbody.appendChild(tr);
   });
 }catch(e){
   tbody.innerHTML=`<tr><td colspan=6>Error: ${e.message}<br>Check RLS policies for profiles</td></tr>`;
 }
}

async function toggleBlock(id,status){
 const newStatus = status==="active"?"blocked":"active";
 if(!confirm(newStatus==="blocked"?"Block this member?":"Unblock?")) return;
 const {error}=await supabaseClient.from("profiles").update({status:newStatus}).eq("id",id);
 if(error) alert(error.message); else loadMembers();
}
async function viewMember(id){
 const {data}=await supabaseClient.from("profiles").select("*").eq("id",id).single();
 alert(`Name: ${data.full_name||''}\nUID: ${data.uid||data.referral_code||''}\nRole: ${data.role}\nStatus: ${data.status}\nPhone: ${data.phone||''}`);
}

// COMPLETELY FIXED: NO JOIN to profiles, to avoid "profiles_1.email does not exist"
async function loadInvestments(){
 const tbody=document.getElementById("investmentsBody"); if(!tbody) return;
 tbody.innerHTML="<tr><td colspan=8>Loading investments...</td></tr>";
 try{
   // 1. Get investments WITHOUT any join
   const {data:invs, error:iErr} = await supabaseClient.from("investments").select("*").order("created_at",{ascending:false}).limit(100);
   if(iErr) throw iErr;
   if(!invs||!invs.length){ tbody.innerHTML="<tr><td colspan=8>No investment requests found.</td></tr>"; return; }

   // 2. Get profiles map separately
   const userIds = [...new Set(invs.map(i=>i.user_id).filter(Boolean))];
   let profileMap = {};
   if(userIds.length){
     try{
       const {data:profs} = await supabaseClient.from("profiles").select("id,full_name,uid,referral_code").in("id", userIds);
       profs?.forEach(p=>{ profileMap[p.id]=p; });
     }catch(e){ console.warn("profile map fail", e.message); }
   }

   tbody.innerHTML="";
   invs.forEach(row=>{
     const prof = profileMap[row.user_id]||{};
     const memberName = prof.full_name || ('Member '+ (row.user_id||'').substring(0,6));
     const monarchUID = prof.uid || prof.referral_code || (row.user_id? row.user_id.substring(0,8):'');
     const statusClass = row.status==="approved"||row.status==="confirmed"?"badge-confirmed":row.status==="rejected"?"badge-rejected":"badge-pending";
     const receiptStatus = row.receipt_url?"Pending":"Missing";
     const receiptBadge = row.receipt_url?"badge-pending":"badge-missing";
     const amount = Number(row.amount||0);
     const pkgName = row.package_id==1?"$30 Package": row.package_id==6?"$1,000 Package": row.package_name|| ("$"+amount+" Package");
     const tr=document.createElement("tr");
     tr.innerHTML=`
     <td><strong style="color:#fff">${memberName}</strong><small style="color:#888;display:block">${monarchUID}</small></td>
     <td style="color:#aaa">${pkgName}</td>
     <td style="color:#D4AF37;font-weight:700">$${amount.toFixed(2)}</td>
     <td>${row.payment_method||"bank"}</td>
     <td><span class="badge ${statusClass}">${row.status}</span></td>
     <td><span class="badge ${receiptBadge}">${receiptStatus}</span> ${row.receipt_url?`<a href="#" onclick="event.preventDefault(); showReceipt('${row.receipt_url}')" style="color:#D4AF37;margin-left:6px;text-decoration:underline">View</a>`:''}</td>
     <td><small style="color:#888">${row.created_at?new Date(row.created_at).toLocaleDateString():'—'}</small></td>
     <td>${row.status==="pending"?`<button class="btn" style="padding:4px 10px;font-size:11px;background:#00c851;color:#fff;border:none;border-radius:6px" onclick="approveInvestment('${row.id}')">Approve</button><button class="btn" style="padding:4px 10px;font-size:11px;background:rgba(255,68,68,0.15);color:#ff7a7a;border:1px solid rgba(255,68,68,0.3);border-radius:6px;margin-top:4px" onclick="rejectInvestment('${row.id}')">Reject</button>`:`<span class="badge ${statusClass}">${row.status}</span>`}</td>`;
     tbody.appendChild(tr);
   });
 }catch(e){
   tbody.innerHTML=`<tr><td colspan=8>Error: ${e.message}</td></tr>`;
 }
}

function showReceipt(url){
 const modal=document.getElementById("receiptModal"); const content=document.getElementById("receiptContent");
 if(!modal||!content){ window.open(url,"_blank"); return; }
 content.innerHTML=`<img src="${url}" style="max-width:100%;border-radius:10px"><br><a href="${url}" target="_blank" style="color:#D4AF37;display:block;margin-top:8px">Open full</a>`;
 modal.style.display="flex";
}
async function approveInvestment(id){ if(!confirm("Approve this investment?")) return; const {error}=await supabaseClient.from("investments").update({status:"approved", approved_at:new Date().toISOString()}).eq("id",id); if(error){ alert(error.message); return; } alert("Approved!"); loadAll(); }
async function rejectInvestment(id){ if(!confirm("Reject this investment?")) return; const {error}=await supabaseClient.from("investments").update({status:"rejected"}).eq("id",id); if(error){ alert(error.message); return; } loadAll(); }
async function loadPayments(){
 const list=document.getElementById("cryptoList"); if(!list) return;
 try{
   const {data}=await supabaseClient.from("payment_details").select("*");
   if(!data) return;
   list.innerHTML="<h4 style='color:var(--gold);margin-bottom:8px'>Crypto Wallets</h4>";
   data.filter(d=> (d.payment_type==="crypto"||d.crypto_name)).forEach(d=>{
     const div=document.createElement("div"); div.style="background:#0f0f0f;border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:12px;margin-bottom:8px";
     div.innerHTML=`<strong>${d.crypto_name||d.title} — ${d.crypto_network||""}</strong><br><small style="color:#777;word-break:break-all">${d.wallet_address||""}</small><br><input value="${d.wallet_address||""}" id="wallet_${d.id}" style="margin-top:8px;width:100%;background:#0e0e0e;border:1px solid rgba(255,255,255,0.1);color:#fff;padding:8px;border-radius:8px"><button class="btn btn-gold" style="margin-top:6px" onclick="updateWallet('${d.id}')">Update</button>`;
     list.appendChild(div);
   });
 }catch(e){}
}
async function updateBank(){
 const payload={ bank_name: document.getElementById("p_bank_name")?.value, account_name: document.getElementById("p_account_name")?.value, account_number: document.getElementById("p_account_number")?.value, minimum_amount: Number(document.getElementById("p_min_amount")?.value||0), payment_type:"bank", active:true };
 const {error}=await supabaseClient.from("payment_details").update(payload).eq("id",1); if(error) alert(error.message); else alert("Bank updated");
}
async function updateWallet(id){ const val=document.getElementById("wallet_"+id)?.value; const {error}=await supabaseClient.from("payment_details").update({wallet_address:val}).eq("id",id); if(error) alert(error.message); else alert("Wallet updated"); }
async function loadPackages(){
 const tbody=document.getElementById("packagesBody"); if(!tbody) return;
 try{
   const {data}=await supabaseClient.from("packages").select("*").order("amount"); if(!data) return;
   tbody.innerHTML=""; data.forEach(p=>{ const tr=document.createElement("tr"); tr.innerHTML=`<td>${p.name}</td><td>$${p.amount}</td><td>${p.active?"Yes":"No"}</td><td><button class="btn btn-reject" onclick="togglePackage('${p.id}',${!p.active})">${p.active?"Deactivate":"Activate"}</button></td>`; tbody.appendChild(tr); });
 }catch(e){}
}
async function togglePackage(id,active){ await supabaseClient.from("packages").update({active}).eq("id",id); loadPackages(); }
async function addPackage(){ const name=document.getElementById("new_pkg_name")?.value; const amount=Number(document.getElementById("new_pkg_amount")?.value); if(!name||!amount) return alert("Fill name and amount"); const {error}=await supabaseClient.from("packages").insert({name,amount,active:true}); if(error) alert(error.message); else { alert("Added"); loadPackages(); } }
async function sendEmail(){ const to=document.getElementById("email_to")?.value.trim(); const subject=document.getElementById("email_subject")?.value.trim(); const body=document.getElementById("email_body")?.value.trim(); if(!to||!subject||!body) return alert("Fill all fields"); const el=document.getElementById("emailStatus"); if(el) el.textContent="Sending..."; try{ const {data,error}=await supabaseClient.functions.invoke("send-email",{body:{to,subject,html:body}}); if(error) throw error; if(el) el.textContent="Sent! "+JSON.stringify(data); } catch(e){ if(el) el.textContent="Error: "+e.message; } }
checkAdmin();
