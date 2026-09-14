const SUPABASE_URL="https://avaworleivncevaoqeny.supabase.co";
const SUPABASE_ANON_KEY="sb_publishable_OZCDmpzZ1-pvN1rfTGqrpw_JatYPjIh";
const supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);

let currentAdmin=null;

async function checkAdmin(){
 const {data:{user}}=await supabaseClient.auth.getUser();
 if(!user){ window.location.href="login.html"; return; }
 const {data:profile}=await supabaseClient.from("profiles").select("*").eq("id",user.id).single();
 if(!profile || (profile.role!=="admin" && profile.role!=="super_admin")){
   alert("Access denied - Admin only. Your role: "+(profile?.role||"member"));
   // window.location.href="dashboard.html";
 }
 currentAdmin=user;
 loadAll();
}

function switchTab(name){
 document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
 document.querySelector(`[data-tab="${name}"]`)?.classList.add("active");
 ["investments","members","payments","packages","emails"].forEach(n=>{
   document.getElementById("tab-"+n).style.display = n===name ? "block":"none";
 });
 if(name==="investments") loadInvestments();
 if(name==="members") loadMembers();
 if(name==="payments") loadPayments();
 if(name==="packages") loadPackages();
}

async function loadAll(){
 loadStats();
 loadInvestments();
}

async function loadStats(){
 const {count:members} = await supabaseClient.from("profiles").select("*",{count:"exact",head:true});
 const {data:invs}=await supabaseClient.from("investments").select("amount,status");
 const pending = invs?.filter(i=>i.status==="pending").length||0;
 const total = invs?.filter(i=>i.status==="approved").reduce((s,i)=>s+Number(i.amount||0),0)||0;
 document.getElementById("totalMembers").textContent=members||0;
 document.getElementById("pendingInvestments").textContent=pending;
 document.getElementById("totalInvested").textContent="$"+total.toLocaleString();
}

async function loadInvestments(){
 const tbody=document.getElementById("investmentsBody");
 tbody.innerHTML="<tr><td colspan=7>Loading...</td></tr>";
 const {data,error}=await supabaseClient.from("investments").select("*, profiles!investments_user_id_fkey(full_name,email), packages(name)").order("created_at",{ascending:false}).limit(100);
 if(error){ tbody.innerHTML=`<tr><td colspan=7>${error.message}</td></tr>`; return; }
 if(!data||!data.length){ tbody.innerHTML="<tr><td colspan=7>No investments</td></tr>"; return; }
 tbody.innerHTML="";
 data.forEach(row=>{
   const tr=document.createElement("tr");
   tr.innerHTML=`
   <td>${row.profiles?.full_name||row.user_id.substring(0,8)}<br><small style="color:#777">${row.profiles?.email||""}</small></td>
   <td>${row.packages?.name||row.package_id}</td>
   <td>$${row.amount}</td>
   <td>${row.payment_method||""} ${row.payment_detail_id||""}</td>
   <td>${row.receipt_url?`<a href="${row.receipt_url}" target="_blank" style="color:#D4AF37">View</a>`:"No receipt"}</td>
   <td><span style="background:${row.status==="approved"?"#00c851":row.status==="rejected"?"#ff4444":"#D4AF37"};color:#000;padding:2px 8px;border-radius:12px;font-size:11px">${row.status}</span></td>
   <td>
   ${row.status==="pending"?`<button class="btn btn-approve" onclick="approveInvestment('${row.id}','${row.user_id}',${row.amount})">Approve</button> <button class="btn btn-reject" onclick="rejectInvestment('${row.id}')">Reject</button>`:"—"}
   </td>`;
   tbody.appendChild(tr);
 });
}

async function approveInvestment(id,userId,amount){
 if(!confirm("Approve this investment of $"+amount+"?")) return;
 const {error}=await supabaseClient.from("investments").update({status:"approved", approved_at:new Date().toISOString()}).eq("id",id);
 if(error){ alert(error.message); return; }
 // Create earning entry for member (example 20% after approval, you can adjust)
 // await supabaseClient.from("earnings").insert({user_id:userId, amount: amount*0.2, source:"investment", investment_id:id, status:"pending"});
 alert("Approved!");
 loadInvestments(); loadStats();
}

async function rejectInvestment(id){
 if(!confirm("Reject?")) return;
 const {error}=await supabaseClient.from("investments").update({status:"rejected"}).eq("id",id);
 if(error){ alert(error.message); return; }
 loadInvestments(); loadStats();
}

async function loadMembers(){
 const tbody=document.getElementById("membersBody");
 tbody.innerHTML="<tr><td colspan=6>Loading...</td></tr>";
 const {data}=await supabaseClient.from("profiles").select("*").order("created_at",{ascending:false}).limit(200);
 tbody.innerHTML="";
 data.forEach(p=>{
   const tr=document.createElement("tr");
   tr.innerHTML=`<td>${p.full_name||"—"}</td><td>${p.email||""}</td><td>${p.phone||""}</td><td>${p.uid||p.id.substring(0,6)}</td><td>${p.status}</td><td>${new Date(p.created_at).toLocaleDateString()}</td>`;
   tbody.appendChild(tr);
 });
}

async function loadPayments(){
 const {data}=await supabaseClient.from("payment_details").select("*").eq("active",true);
 const list=document.getElementById("cryptoList");
 if(!data) return;
 list.innerHTML="<h4>Crypto Wallets</h4>";
 data.filter(d=>d.payment_type==="crypto").forEach(d=>{
   const div=document.createElement("div");
   div.className="card";
   div.innerHTML=`<strong>${d.crypto_name} — ${d.crypto_network}</strong><br><small style="color:#777;word-break:break-all">${d.wallet_address}</small><br><input value="${d.wallet_address}" id="wallet_${d.id}" style="margin-top:8px"><button class="btn btn-gold" style="margin-top:6px" onclick="updateWallet(${d.id})">Update</button>`;
   list.appendChild(div);
 });
}

async function updateBank(){
 const payload={
  bank_name: document.getElementById("p_bank_name").value,
  account_name: document.getElementById("p_account_name").value,
  account_number: document.getElementById("p_account_number").value,
  minimum_amount: Number(document.getElementById("p_min_amount").value),
  fee_amount: Number(document.getElementById("p_fee").value),
  instructions: document.getElementById("p_instruction").value,
  payment_type:"bank",
  title:"Bank Transfer",
  active:true
 };
 const {error}=await supabaseClient.from("payment_details").upsert(payload,{onConflict:"id"}).eq("id",1);
 // Actually update id 1
 const {error:err2}=await supabaseClient.from("payment_details").update(payload).eq("id",1);
 if(err2) alert(err2.message); else alert("Bank updated");
}

async function updateWallet(id){
 const val=document.getElementById("wallet_"+id).value;
 const {error}=await supabaseClient.from("payment_details").update({wallet_address:val}).eq("id",id);
 if(error) alert(error.message); else alert("Wallet updated");
}

async function loadPackages(){
 const tbody=document.getElementById("packagesBody");
 const {data}=await supabaseClient.from("packages").select("*").order("amount");
 tbody.innerHTML="";
 data.forEach(p=>{
   const tr=document.createElement("tr");
   tr.innerHTML=`<td>${p.name}</td><td>$${p.amount}</td><td>${p.active?"Yes":"No"}</td><td><button class="btn btn-reject" onclick="togglePackage(${p.id},${!p.active})">${p.active?"Deactivate":"Activate"}</button></td>`;
   tbody.appendChild(tr);
 });
}
async function togglePackage(id,active){
 await supabaseClient.from("packages").update({active}).eq("id",id);
 loadPackages();
}
async function addPackage(){
 const name=document.getElementById("new_pkg_name").value;
 const amount=Number(document.getElementById("new_pkg_amount").value);
 if(!name||!amount) return alert("Fill name and amount");
 const {error}=await supabaseClient.from("packages").insert({name,amount,active:true});
 if(error) alert(error.message); else { alert("Added"); loadPackages(); }
}

// EMAIL SENDER - Requires Supabase Edge Function with Resend API
async function sendEmail(){
 const to=document.getElementById("email_to").value.trim();
 const subject=document.getElementById("email_subject").value.trim();
 const body=document.getElementById("email_body").value.trim();
 if(!to||!subject||!body) return alert("Fill all fields");
 document.getElementById("emailStatus").textContent="Sending...";
 try{
  // Call edge function: supabase/functions/send-email
  const {data,error}=await supabaseClient.functions.invoke("send-email",{body:{to,subject,html:body}});
  if(error) throw error;
  document.getElementById("emailStatus").textContent="Sent! "+JSON.stringify(data);
 } catch(e){
  document.getElementById("emailStatus").textContent="Error: "+e.message+" - Make sure Edge Function send-email is deployed with RESEND_API_KEY";
 }
}

checkAdmin();
