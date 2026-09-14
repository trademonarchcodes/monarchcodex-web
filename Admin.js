const SUPABASE_URL="https://avaworleivncevaoqeny.supabase.co";
const SUPABASE_ANON_KEY="sb_publishable_OZCDmpzZ1-pvN1rfTGqrpw_JatYPjIh";
const supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
let currentAdmin=null;
const ADMIN_EMAILS=["ezebolaprinceokechukwu@gmail.com","infocryptox2025@gmail.com","admin@monarch-codex.pages.dev","princeokechukwu@monarch.com"];

async function checkAdmin(){
 const {data:{user}}=await supabaseClient.auth.getUser();
 if(!user){ window.location.href="login.html"; return; }
 const {data:profile}=await supabaseClient.from("profiles").select("*").eq("id",user.id).single();
 const emailToCheck = (profile?.email||user.email||"").toLowerCase();
 const isAdminByEmail = ADMIN_EMAILS.includes(emailToCheck) || emailToCheck==="ezebolaprinceokechukwu@gmail.com";
 if(isAdminByEmail && profile && profile.role==="member"){
   await supabaseClient.from("profiles").update({role:"admin"}).eq("id",user.id);
 }
 currentAdmin=user;
 loadAll();
}

async function loadAll(){
 const el=document.getElementById("updatedTime"); if(el) el.textContent="Updated: "+ new Date().toLocaleString();
 await Promise.all([loadStats(), loadMembers(), loadInvestments(), loadPayments(), loadPackages()]);
}

function setText(id,val){ const el=document.getElementById(id); if(el) el.textContent=val; }

async function loadStats(){
 try{
  const {count:members, error:mErr} = await supabaseClient.from("profiles").select("*",{count:"exact",head:true});
  if(mErr) console.warn(mErr);
  const {data:invs, error:iErr}=await supabaseClient.from("investments").select("amount,status");
  if(iErr) console.warn(iErr);
  const pending = invs?.filter(i=>i.status==="pending").length||0;
  const confirmed = invs?.filter(i=>i.status==="approved"||i.status==="confirmed").length||0;
  const rejected = invs?.filter(i=>i.status==="rejected").length||0;
  const total = invs?.filter(i=>i.status==="approved"||i.status==="confirmed").reduce((s,i)=>s+Number(i.amount||0),0)||0;
  
  // Pending members - may not have status column, wrap try
  let pendingMembers = 0;
  try{
    const {count} = await supabaseClient.from("profiles").select("*",{count:"exact",head:true}).eq("status","pending");
    pendingMembers = count||0;
  }catch(e){ pendingMembers = 0; }

  setText("totalMembers", members||0);
  setText("pendingMembers", pendingMembers);
  setText("pendingInvestments", pending);
  setText("totalInvested", "$"+total.toLocaleString()+".00");
  setText("confirmedInvestments", confirmed);
  setText("rejectedInvestments", rejected);
  setText("totalEarnings", "$"+total.toLocaleString()+".00");
  setText("investCount", (invs?.length||0)+" investment request(s) found.");
  setText("memberCount", (members||0)+" members");
 }catch(e){ console.error("stats error",e); }
}

async function loadMembers(){
 const tbody=document.getElementById("membersBody"); if(!tbody) return;
 tbody.innerHTML="<tr><td colspan=6>Loading members...</td></tr>";
 const {data:profiles,error}=await supabaseClient.from("profiles").select("*").order("created_at",{ascending:false}).limit(200);
 if(error){ tbody.innerHTML=`<tr><td colspan=6>${error.message}</td></tr>`; return; }
 const {data:invs}=await supabaseClient.from("investments").select("user_id,amount,status");
 const invMap={};
 invs?.forEach(i=>{
   if(!invMap[i.user_id]) invMap[i.user_id]={total:0};
   if(i.status==="approved"||i.status==="confirmed") invMap[i.user_id].total+=Number(i.amount||0);
 });
 tbody.innerHTML="";
 if(!profiles||!profiles.length){ tbody.innerHTML="<tr><td colspan=6>No members found.</td></tr>"; return; }
 profiles.forEach(p=>{
   const totalInv = invMap[p.id]?.total||0;
   const monarchUID = p.uid || p.referral_code || p.monarch_uid || (p.id? 'MONARCH'+p.id.substring(0,6).toUpperCase() : '—');
   const status = p.status || 'active';
   const isActive = status==='active' || !status;
   const role = p.role || 'member';
   const isAdmin = role==='admin' || role==='super_admin';
   const tr=document.createElement("tr");
   // MATCH YOUR BEAUTIFUL DESIGN: MEMBER | UID | STATUS | INVESTMENT | DATE | ACTION
   tr.innerHTML=`
   <td><strong style="color:#fff">${p.full_name||'Unknown'}</strong></td>
   <td><span class="uid" style="color:#D4AF37;font-weight:700">${monarchUID}</span> <button class="btn" style="padding:2px 6px;font-size:9px;margin-left:4px;background:#1a1a1a;border:1px solid #333" onclick="navigator.clipboard.writeText('${monarchUID}')">Copy</button></td>
   <td><span class="badge ${isActive?'badge-active':'badge-pending'}">${isActive?'Active':'Pending'}</span> ${isAdmin?'<span class="badge" style="background:#D4AF37;color:#000;margin-left:4px">admin</span>':''}</td>
   <td style="color:var(--gold);font-weight:600">$${totalInv.toFixed(2)}</td>
   <td><small style="color:#888">${p.created_at? new Date(p.created_at).toLocaleDateString()+' , '+new Date(p.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}):'—'}</small></td>
   <td class="action-col"><button class="btn btn-block" style="font-size:10px;padding:4px 8px" onclick="toggleBlock('${p.id}','${status}')">Block</button><button class="btn btn-view" style="font-size:10px;padding:4px 8px;margin-top:4px" onclick="viewMember('${p.id}')">View</button></td>
   `;
   tbody.appendChild(tr);
 });
}

async function toggleBlock(id,status){
 const newStatus = status==="active"?"blocked":"active";
 if(!confirm((newStatus==="blocked"?"Block":"Unblock")+" this member?")) return;
 const {error}=await supabaseClient.from("profiles").update({status:newStatus}).eq("id",id);
 if(error) alert(error.message); else loadMembers();
}
async function viewMember(id){
 const {data}=await supabaseClient.from("profiles").select("*").eq("id",id).single();
 if(!data) return alert("No data");
 let info = `Name: ${data.full_name||''}\nUID: ${data.uid||data.referral_code||''}\nStatus: ${data.status}\nRole: ${data.role}\nPhone: ${data.phone||''}\nCreated: ${data.created_at}`;
 alert(info);
}

// FIXED: No email column in profiles, so don't select email!
async function loadInvestments(){
 const tbody=document.getElementById("investmentsBody"); if(!tbody) return;
 tbody.innerHTML="<tr><td colspan=8>Loading investments...</td></tr>";
 try{
   // Try join without email column
   let {data, error} = await supabaseClient.from("investments").select("*, profiles(full_name,uid,referral_code)").order("created_at",{ascending:false}).limit(100);
   if(error){
     console.warn("Join failed, trying without join", error.message);
     const res2 = await supabaseClient.from("investments").select("*").order("created_at",{ascending:false}).limit(100);
     data = res2.data; error = res2.error;
   }
   if(error){ tbody.innerHTML=`<tr><td colspan=8>${error.message}</td></tr>`; return; }
   if(!data||!data.length){ tbody.innerHTML="<tr><td colspan=8>No investment requests found.</td></tr>"; return; }
   tbody.innerHTML="";
   data.forEach(row=>{
     const memberName = row.profiles?.full_name || 'Member ' + (row.user_id||'').substring(0,6);
     const monarchUID = row.profiles?.uid || row.profiles?.referral_code || (row.user_id? row.user_id.substring(0,8) : '');
     const statusClass = row.status==="approved"||row.status==="confirmed"?"badge-confirmed":row.status==="rejected"?"badge-rejected":"badge-pending";
     const receiptStatus = row.receipt_url?"Pending":row.receipt?"Pending":"Missing";
     const receiptBadge = row.receipt_url||row.receipt?"badge-pending":"badge-missing";
     const amount = Number(row.amount||0);
     const pkg = row.package_name || (row.package_id==1?"$30 Package": row.package_id==6?"$1,000 Package": row.package_id? row.package_id : "$30 Package");
     const tr=document.createElement("tr");
     tr.innerHTML=`
     <td><strong style="color:#fff">${memberName}</strong> <small style="color:#888;display:block">${monarchUID}</small></td>
     <td style="color:#aaa">${pkg}</td>
     <td style="color:var(--gold);font-weight:700">$${amount.toFixed(2)}</td>
     <td>${row.payment_method||"bank"}</td>
     <td><span class="badge ${statusClass}">${row.status}</span></td>
     <td><span class="badge ${receiptBadge}">${receiptStatus}</span> ${row.receipt_url?`<a href="#" onclick="showReceipt('${row.receipt_url}');return false" style="color:#D4AF37;margin-left:6px;text-decoration:underline">View</a>`:''}</td>
     <td><small style="color:#888">${row.created_at?new Date(row.created_at).toLocaleDateString():'—'}</small></td>
     <td>${row.status==="pending"?`<button class="btn btn-approve" style="padding:4px 10px;font-size:11px;background:#00c851;color:#fff;border:none;border-radius:6px" onclick="approveInvestment('${row.id}')">Approve</button> <button class="btn btn-reject" style="padding:4px 10px;font-size:11px;background:rgba(255,68,68,0.15);color:#ff7a7a;border:1px solid rgba(255,68,68,0.3);border-radius:6px;margin-top:4px" onclick="rejectInvestment('${row.id}')">Reject</button>`:`<span class="badge ${statusClass}">${row.status}</span>`}</td>
     `;
     tbody.appendChild(tr);
   });
 }catch(e){
   tbody.innerHTML=`<tr><td colspan=8>Error: ${e.message}</td></tr>`;
 }
}

function showReceipt(url){
 const modal=document.getElementById("receiptModal"); const content=document.getElementById("receiptContent");
 if(!modal||!content){ window.open(url,"_blank"); return; }
 if(url.match(/\.(jpg|jpeg|png|webp|gif)$/i)){ content.innerHTML=`<img src="${url}" style="max-width:100%;border-radius:10px"><br><a href="${url}" target="_blank" style="color:#D4AF37;display:block;margin-top:8px">Open full image</a>`; }
 else{ content.innerHTML=`<a href="${url}" target="_blank" style="color:#D4AF37;word-break:break-all">${url}</a>`; }
 modal.style.display="flex";
}
async function approveInvestment(id){ if(!confirm("Approve this investment? Member will be activated.")) return; const {error}=await supabaseClient.from("investments").update({status:"approved", approved_at:new Date().toISOString()}).eq("id",id); if(error){ alert(error.message); return; } alert("Approved!"); loadAll(); }
async function rejectInvestment(id){ if(!confirm("Reject this investment?")) return; const {error}=await supabaseClient.from("investments").update({status:"rejected"}).eq("id",id); if(error){ alert(error.message); return; } loadAll(); }
async function loadPayments(){
 const list=document.getElementById("cryptoList"); if(!list) return;
 const {data}=await supabaseClient.from("payment_details").select("*");
 if(!data) return;
 list.innerHTML="<h4 style='color:var(--gold);margin-bottom:8px'>Crypto Wallets</h4>";
 data.filter(d=> (d.payment_type==="crypto"||d.crypto_name)).forEach(d=>{
   const div=document.createElement("div"); div.style="background:#0f0f0f;border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:12px;margin-bottom:8px";
   div.innerHTML=`<strong>${d.crypto_name||d.title} — ${d.crypto_network||""}</strong><br><small style="color:#777;word-break:break-all">${d.wallet_address||""}</small><br><input value="${d.wallet_address||""}" id="wallet_${d.id}" style="margin-top:8px;width:100%;background:#0e0e0e;border:1px solid rgba(255,255,255,0.1);color:#fff;padding:8px;border-radius:8px"><button class="btn btn-gold" style="margin-top:6px" onclick="updateWallet('${d.id}')">Update</button>`;
   list.appendChild(div);
 });
}
async function updateBank(){
 const payload={ bank_name: document.getElementById("p_bank_name")?.value, account_name: document.getElementById("p_account_name")?.value, account_number: document.getElementById("p_account_number")?.value, minimum_amount: Number(document.getElementById("p_min_amount")?.value||0), payment_type:"bank", active:true };
 const {error}=await supabaseClient.from("payment_details").update(payload).eq("id",1); if(error) alert(error.message); else alert("Bank updated");
}
async function updateWallet(id){ const val=document.getElementById("wallet_"+id)?.value; const {error}=await supabaseClient.from("payment_details").update({wallet_address:val}).eq("id",id); if(error) alert(error.message); else alert("Wallet updated"); }
async function loadPackages(){
 const tbody=document.getElementById("packagesBody"); if(!tbody) return;
 const {data}=await supabaseClient.from("packages").select("*").order("amount"); if(!data) return;
 tbody.innerHTML=""; data.forEach(p=>{ const tr=document.createElement("tr"); tr.innerHTML=`<td>${p.name}</td><td>$${p.amount}</td><td>${p.active?"Yes":"No"}</td><td><button class="btn btn-reject" onclick="togglePackage('${p.id}',${!p.active})">${p.active?"Deactivate":"Activate"}</button></td>`; tbody.appendChild(tr); });
}
async function togglePackage(id,active){ await supabaseClient.from("packages").update({active}).eq("id",id); loadPackages(); }
async function addPackage(){ const name=document.getElementById("new_pkg_name")?.value; const amount=Number(document.getElementById("new_pkg_amount")?.value); if(!name||!amount) return alert("Fill name and amount"); const {error}=await supabaseClient.from("packages").insert({name,amount,active:true}); if(error) alert(error.message); else { alert("Added"); loadPackages(); } }
async function sendEmail(){ const to=document.getElementById("email_to")?.value.trim(); const subject=document.getElementById("email_subject")?.value.trim(); const body=document.getElementById("email_body")?.value.trim(); if(!to||!subject||!body) return alert("Fill all fields"); const el=document.getElementById("emailStatus"); if(el) el.textContent="Sending..."; try{ const {data,error}=await supabaseClient.functions.invoke("send-email",{body:{to,subject,html:body}}); if(error) throw error; if(el) el.textContent="Sent! "+JSON.stringify(data); } catch(e){ if(el) el.textContent="Error: "+e.message; } }
checkAdmin();
