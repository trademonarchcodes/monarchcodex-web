
const SUPABASE_URL="https://avaworleivncevaoqeny.supabase.co";
const SUPABASE_ANON_KEY="sb_publishable_OZCDmpzZ1-pvN1rfTGqrpw_JatYPjIh";
const supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
let currentUser=null, currentProfile=null, selectedPackage=null, selectedPayment=null;

// Professional Toast System - replaces ash alert
function showToast(message, type="info"){
  let container = document.getElementById("toastContainer");
  if(!container){
    container = document.createElement("div");
    container.id = "toastContainer";
    container.style = "position:fixed;top:20px;right:20px;z-index:99999;display:flex;flex-direction:column;gap:10px;max-width:380px";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  const bg = type==="success" ? "linear-gradient(135deg,#00c851,#00a63d)" : type==="error" ? "linear-gradient(135deg,#ff4444,#cc0000)" : type==="warning" ? "linear-gradient(135deg,#D4AF37,#B8941F)" : "linear-gradient(135deg,#121212,#1a1a1a)";
  const color = type==="warning" ? "#000" : "#fff";
  const icon = type==="success" ? "✓" : type==="error" ? "✕" : type==="warning" ? "⚠" : "ℹ";
  toast.style = `background:${bg};color:${color};padding:14px 18px;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.5);border:1px solid rgba(212,175,55,0.3);font-size:13px;line-height:1.5;animation:slideIn 0.3s ease;display:flex;gap:10px;align-items:flex-start`;
  toast.innerHTML = `<span style="font-size:16px;font-weight:800">${icon}</span><span style="flex:1">${message}</span><button onclick="this.parentElement.remove()" style="background:transparent;border:none;color:inherit;cursor:pointer;font-size:16px;opacity:0.7">×</button>`;
  container.appendChild(toast);
  setTimeout(()=>{ if(toast.parentElement) toast.remove(); }, 5000);
}

function showConfirm(message){
  return new Promise(resolve=>{
    let container = document.getElementById("confirmContainer");
    if(container) container.remove();
    container = document.createElement("div");
    container.id="confirmContainer";
    container.style="position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px";
    container.innerHTML=`<div style="background:#121212;border:1px solid rgba(212,175,55,0.3);border-radius:16px;padding:24px;max-width:400px;width:100%"><h3 style="color:#D4AF37;margin-bottom:12px;font-family:Cinzel">Confirm Action</h3><p style="color:#aaa;font-size:13px;line-height:1.6">${message}</p><div style="display:flex;gap:12px;margin-top:20px"><button id="confirmYes" style="flex:1;background:linear-gradient(135deg,#D4AF37,#B8941F);color:#000;border:none;padding:12px;border-radius:8px;font-weight:800;cursor:pointer">Yes, Continue</button><button id="confirmNo" style="flex:1;background:#1a1a1a;border:1px solid #333;color:#ccc;padding:12px;border-radius:8px;cursor:pointer">Cancel</button></div></div>`;
    document.body.appendChild(container);
    document.getElementById("confirmYes").onclick=()=>{container.remove(); resolve(true);};
    document.getElementById("confirmNo").onclick=()=>{container.remove(); resolve(false);};
  });
}

// Add slideIn animation
if(!document.getElementById("toastStyle")){
  const style=document.createElement("style");
  style.id="toastStyle";
  style.textContent="@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}";
  document.head.appendChild(style);
}

async function init(){
  const {data:{user}}=await supabaseClient.auth.getUser();
  if(!user){document.getElementById("appLoading").classList.add("hidden");document.getElementById("authError").classList.remove("hidden");return;}
  currentUser=user;
  const {data:profile}=await supabaseClient.from("profiles").select("*").eq("id",user.id).single();
  currentProfile=profile;
  document.getElementById("appLoading").classList.add("hidden");
  document.getElementById("appShell").classList.remove("hidden");
  document.getElementById("sidebarMemberName").textContent=profile.full_name;
  document.getElementById("sidebarMemberUID").textContent=profile.uid;
  document.getElementById("sidebarMemberInitial").textContent=profile.full_name[0];
  document.getElementById("displayUsername").textContent=profile.display_username||profile.full_name.split(" ")[0];
  await loadOverview();
  loadPackages();
  loadTransactions();
  loadReferrals();
  loadProfile();
}

function switchSection(name){
  document.querySelectorAll(".dashboard-section").forEach(s=>s.classList.add("hidden"));
  document.getElementById(name+"Section")?.classList.remove("hidden");
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.remove("active"));
  document.querySelector(`[data-section="${name}"]`)?.classList.add("active");
  document.getElementById("topbarTitle").textContent=name.charAt(0).toUpperCase()+name.slice(1);
}

document.querySelectorAll(".nav-item").forEach(btn=>{
  btn.addEventListener("click",()=>switchSection(btn.dataset.section));
});
document.getElementById("logoutBtn")?.addEventListener("click",async()=>{await supabaseClient.auth.signOut();location.href="login.html";});

async function loadOverview(){
  const {data:investments}=await supabaseClient.from("investments").select("amount,status,created_at").eq("user_id",currentUser.id);
  const totalInv=investments?.filter(i=>i.status==="approved").reduce((s,i)=>s+Number(i.amount),0)||0;
  const {data:trans}=await supabaseClient.from("transactions").select("amount,type").eq("user_id",currentUser.id);
  const earnings=trans?.filter(t=> Number(t.amount)>0 && (t.type==="earning"||t.type==="referral_bonus"||t.type==="profit"||t.type==="bonus"||t.type==="admin_add")).reduce((s,i)=>s+Number(i.amount),0)||0;
  const totalWithdrawn=trans?.filter(t=> Number(t.amount)<0).reduce((s,i)=>s+Math.abs(Number(i.amount)),0)||0;
  let balance = currentProfile.balance;
  if(balance===null || balance===undefined) balance = earnings - totalWithdrawn;
  if(balance < 0 && totalInv>0 && earnings===0) balance = 0;
  document.getElementById("balance").textContent="$"+Number(balance).toFixed(2);
  document.getElementById("totalInvested").textContent="$"+totalInv.toFixed(2);
  document.getElementById("totalEarnings").textContent="$"+earnings.toFixed(2);
  document.getElementById("refEarnings").textContent="$"+earnings.toFixed(2);
  const earnEl=document.getElementById("earningsTotal"); if(earnEl) earnEl.textContent="$"+earnings.toFixed(2);
  const kycBadge=document.getElementById("kycStatusBadge");
  if(currentProfile.kyc_status==="approved"){
    kycBadge.innerHTML='<span style="background:#00c851;color:#fff;padding:4px 10px;border-radius:20px;font-size:11px">KYC Approved - Active</span>';
    document.getElementById("kycStatusText").textContent="KYC: Approved — You can invest. Profile picture can be updated in Profile.";
    const kycFormInner=document.getElementById("kycForm");
    if(kycFormInner) kycFormInner.style.display="none";
    const approvedMsg=document.getElementById("kycApprovedMsg");
    if(!approvedMsg){
      const msg=document.createElement("div");
      msg.id="kycApprovedMsg";
      msg.style="background:rgba(0,200,81,0.1);border:1px solid rgba(0,200,81,0.3);padding:16px;border-radius:10px;margin-top:16px;text-align:center";
      msg.innerHTML="<h4 style='color:#4ee58a'>✓ KYC Approved</h4><p style='color:#aaa;font-size:12px;margin-top:8px'>Your KYC is verified. You can now update your profile picture in Profile section.</p><button class='btn-gold' style='margin-top:12px' onclick=\"switchSection('profile')\">Go to Profile</button>";
      const card=document.querySelector("#kycSection .card");
      if(card) card.appendChild(msg);
    }
  } else if(currentProfile.kyc_status==="rejected"){
    kycBadge.innerHTML='<span style="background:#ff4444;color:#fff;padding:4px 10px;border-radius:20px;font-size:11px">KYC Rejected - Please resubmit</span>';
  } else {
    kycBadge.innerHTML='<span style="background:#D4AF37;color:#000;padding:4px 10px;border-radius:20px;font-size:11px">KYC Pending</span>';
  }
  window._earnings = earnings;
  window._totalInv = totalInv;
  window._investments = investments;
  window._totalWithdrawn = totalWithdrawn;
}

async function loadPackages(){
  const {data:pkgs}=await supabaseClient.from("packages").select("*").order("amount");
  const list=document.getElementById("packagesList");
  if(!pkgs||!list)return;
  list.innerHTML="";
  pkgs.forEach(p=>{
    const div=document.createElement("div");
    div.className="payment-method-card";
    div.innerHTML=`<strong>${p.name}</strong><br><span style="color:var(--gold)">$${p.amount}</span><br><small style="color:#888">${p.profit_percent}% target</small>`;
    div.onclick=()=>{selectedPackage=p;document.querySelectorAll("#packagesList .payment-method-card").forEach(c=>c.classList.remove("selected"));div.classList.add("selected");loadPaymentMethods();};
    list.appendChild(div);
  });
}

async function loadPaymentMethods(){
  const {data:methods}=await supabaseClient.from("payment_details").select("*").eq("active",true);
  const grid=document.getElementById("paymentMethods");
  if(!methods||!grid)return;
  grid.innerHTML="<h4 style='color:var(--gold);grid-column:1/-1'>Select Payment Method</h4>";
  methods.forEach(m=>{
    const div=document.createElement("div");
    div.className="payment-method-card";
    const name=m.payment_type==="bank"?`${m.bank_name} - ${m.account_name}`:`${m.crypto_name} ${m.crypto_network}`;
    div.innerHTML=`<strong style="font-size:12px">${name}</strong><br><small style="color:#777;word-break:break-all">${(m.wallet_address||m.account_number||'').substring(0,20)}...</small>`;
    div.onclick=()=>{
      selectedPayment=m;
      document.querySelectorAll("#paymentMethods .payment-method-card").forEach(c=>c.classList.remove("selected"));
      div.classList.add("selected");
      showPaymentDetail(m);
    };
    grid.appendChild(div);
  });
}

function showPaymentDetail(m){
  const panel=document.getElementById("paymentDetailPanel");
  panel.classList.remove("hidden");
  if(m.payment_type==="bank"){
    panel.innerHTML=`<h4 style="color:var(--gold)">Bank Transfer Details</h4><div style="margin-top:10px"><p><small>Bank:</small> <strong>${m.bank_name}</strong></p><p><small>Account Name:</small> <strong>${m.account_name}</strong></p><p><small>Account Number:</small> <strong>${m.account_number}</strong> <button class="copy-btn" onclick="navigator.clipboard.writeText('${m.account_number}');showToast('Account number copied!','success')">Copy</button></p><div style="margin-top:12px;background:rgba(212,175,55,0.1);border:1px solid var(--border);padding:10px;border-radius:8px"><small>Amount to Pay:</small><br><strong style="color:var(--gold);font-size:18px">$${selectedPackage?.amount||0}</strong><br><small>Pay exact amount and upload receipt</small></div></div>`;
  }else{
    panel.innerHTML=`<h4 style="color:var(--gold)">${m.crypto_name} - ${m.crypto_network}</h4><p style="word-break:break-all;color:#fff;margin-top:8px">${m.wallet_address} <button class="copy-btn" onclick="navigator.clipboard.writeText('${m.wallet_address}');showToast('Wallet address copied!','success')">Copy</button></p><div style="margin-top:12px;background:rgba(212,175,55,0.1);border:1px solid var(--border);padding:10px;border-radius:8px"><small>Amount:</small><br><strong style="color:var(--gold);font-size:18px">$${selectedPackage?.amount||0} in ${m.crypto_name}</strong></div>`;
  }
  document.getElementById("receiptArea").classList.remove("hidden");
}

document.getElementById("submitInvestmentBtn")?.addEventListener("click",async()=>{
  if(!selectedPackage){showToast("Select a package first","warning");return;}
  if(!selectedPayment){showToast("Select payment method","warning");return;}
  const receipt=document.getElementById("receiptFile")?.files[0];
  if(!receipt){showToast("Upload payment receipt","warning");return;}
  const btn=document.getElementById("submitInvestmentBtn");
  btn.disabled=true; btn.textContent="Uploading...";
  try{
    const {data,error}=await supabaseClient.storage.from("receipts").upload(`${currentUser.id}/${Date.now()}_${receipt.name}`, receipt);
    if(error) throw error;
    const {data:url}=supabaseClient.storage.from("receipts").getPublicUrl(data.path);
    const {error:invErr}=await supabaseClient.from("investments").insert({user_id:currentUser.id,package_name:selectedPackage.name,amount:selectedPackage.amount,payment_method:selectedPayment.payment_type==="bank"?selectedPayment.bank_name:selectedPayment.crypto_name,receipt_url:url.publicUrl,status:"pending"});
    if(invErr) throw invErr;
    showToast(`Investment $${selectedPackage.amount} submitted! Admin will verify receipt within 24 hours.`,"success");
    btn.disabled=false; btn.textContent="Submit Investment";
    loadTransactions();
  }catch(e){
    showToast(e.message,"error");
    btn.disabled=false; btn.textContent="Submit Investment";
  }
});

async function loadTransactions(){
  const {data:trans}=await supabaseClient.from("transactions").select("*").eq("user_id",currentUser.id).order("created_at",{ascending:false}).limit(100);
  const list=document.getElementById("transactionsList");
  if(!trans||!list)return;
  list.innerHTML="";
  if(!trans.length){list.innerHTML="<p style='color:#777'>No transactions yet</p>";return;}
  const seen=new Set(); const deduped=[];
  trans.forEach(t=>{
    const key=`${t.description||t.type}-${t.amount}-${new Date(t.created_at).toDateString()}`;
    if(!seen.has(key)){seen.add(key); deduped.push(t);}
  });
  deduped.slice(0,50).forEach(t=>{
    const div=document.createElement("div");
    const isPlus=Number(t.amount)>0||String(t.display_amount||'').startsWith("+");
    div.style="display:flex;justify-content:space-between;padding:10px;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px";
    div.innerHTML=`<span>${t.description||t.type} <small style="color:#777">${new Date(t.created_at).toLocaleDateString()}</small></span><strong style="color:${isPlus?'#4ee58a':'#ff7777'}">${t.display_amount||(isPlus?'+':'-')+'$'+Math.abs(Number(t.amount))}</strong>`;
    list.appendChild(div);
  });
  loadMyInvestments(); loadMyWithdrawals();
}

async function loadMyInvestments(){
  const {data:invs}=await supabaseClient.from("investments").select("*").eq("user_id",currentUser.id).order("created_at",{ascending:false});
  const list=document.getElementById("myInvestmentsList");
  if(!list) return;
  if(!invs||!invs.length){list.innerHTML="<p style='color:#777;font-size:12px'>No investments yet</p>";return;}
  list.innerHTML="";
  invs.forEach(inv=>{
    const div=document.createElement("div");
    div.style="display:flex;justify-content:space-between;padding:10px;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px";
    const statusColor=inv.status==="approved"?"#4ee58a":inv.status==="rejected"?"#ff7777":"#D4AF37";
    div.innerHTML=`<span>${inv.package_name||'Package'} $${inv.amount} <small style="color:#777">${new Date(inv.created_at).toLocaleDateString()}</small></span><strong style="color:${statusColor}">${inv.status}</strong>`;
    list.appendChild(div);
  });
}

async function loadMyWithdrawals(){
  const {data:wds}=await supabaseClient.from("withdrawals").select("*").eq("user_id",currentUser.id).order("created_at",{ascending:false});
  const list=document.getElementById("withdrawalsList");
  if(!list) return;
  if(!wds||!wds.length){list.innerHTML="<p style='color:#777;font-size:12px'>No withdrawals yet</p>";return;}
  list.innerHTML="";
  wds.forEach(w=>{
    const div=document.createElement("div");
    div.style="display:flex;justify-content:space-between;padding:10px;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px";
    const statusColor=w.status==="approved"?"#4ee58a":w.status==="rejected"?"#ff7777":"#D4AF37";
    div.innerHTML=`<span>$${w.amount} to ${w.bank_name} <small style="color:#777">${new Date(w.created_at).toLocaleDateString()}</small></span><strong style="color:${statusColor}">${w.status}</strong>`;
    list.appendChild(div);
  });
}

async function loadReferrals(){
  const {data:refs}=await supabaseClient.from("profiles").select("full_name,uid,created_at,status").eq("referred_by",currentUser.id);
  document.getElementById("totalReferrals").textContent=refs?.length||0;
  document.getElementById("activeReferrals").textContent=refs?.filter(r=>r.status==="active").length||0;
  document.getElementById("referralCode").textContent=currentProfile.referral_code||"";
  document.getElementById("referralLink").value=location.origin+"/register.html?ref="+(currentProfile.referral_code||"");
  const list=document.getElementById("referralsList");
  if(list){list.innerHTML="";refs?.forEach(r=>{const d=document.createElement("div");d.style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.05);display:flex;justify-content:space-between";d.innerHTML=`<span>${r.full_name} <small>${r.uid}</small></span><span style="color:#4ee58a">${r.status}</span>`;list.appendChild(d);});}
}

async function loadProfile(){
  const info=document.getElementById("profileInfo");
  if(!info)return;
  let html=`<p><strong>Name (NIN):</strong> ${currentProfile.full_name} (cannot be changed)</p><p><strong>Phone:</strong> ${currentProfile.phone} (cannot be changed)</p><p><strong>UID:</strong> ${currentProfile.uid}</p><p><strong>Referral Code:</strong> ${currentProfile.referral_code}</p><p><strong>Status:</strong> ${currentProfile.status} | KYC: ${currentProfile.kyc_status}</p>`;
  if(currentProfile.avatar_url){
    html+=`<p style="margin-top:10px"><strong>Profile Picture:</strong><br><img src="${currentProfile.avatar_url}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:2px solid var(--gold);margin-top:8px"></p>`;
  }
  info.innerHTML=html;
  const avatarSection=document.getElementById("avatarUploadSection");
  if(currentProfile.kyc_status==="approved" && !avatarSection){
    const section=document.createElement("div");
    section.id="avatarUploadSection";
    section.style="margin-top:16px;background:rgba(212,175,55,0.08);border:1px solid rgba(212,175,55,0.2);border-radius:10px;padding:12px";
    section.innerHTML=`<h4 style="color:var(--gold);font-size:13px">Profile Picture (KYC Approved - You can now add picture)</h4><input type="file" id="avatarFile" accept="image/*" style="margin-top:8px"><button id="uploadAvatarBtn" class="btn-gold" style="margin-top:8px;padding:8px 16px;font-size:12px">Upload Picture</button><small style="color:#888;display:block;margin-top:6px">Visible to admin and community</small>`;
    info.parentElement.appendChild(section);
    setTimeout(()=>{
      document.getElementById("uploadAvatarBtn")?.addEventListener("click", async()=>{
        const file=document.getElementById("avatarFile")?.files[0];
        if(!file){showToast("Choose picture first","warning");return;}
        try{
          const {data,error}=await supabaseClient.storage.from("avatars").upload(`${currentUser.id}/avatar_${Date.now()}_${file.name}`, file, {upsert:true});
          if(error) throw error;
          const {data:url}=supabaseClient.storage.from("avatars").getPublicUrl(data.path);
          await supabaseClient.from("profiles").update({avatar_url:url.publicUrl}).eq("id",currentUser.id);
          showToast("Profile picture updated!","success");
          location.reload();
        }catch(e){showToast(e.message,"error");}
      });
    },500);
  }
  const lastChanged=currentProfile.username_last_changed?new Date(currentProfile.username_last_changed):null;
  const now=new Date();
  const diff=lastChanged? (now-lastChanged)/(1000*60*60*24):10;
  const cd=document.getElementById("usernameCooldown");
  if(cd){
    if(diff<7){cd.textContent=`You can change username again in ${(7-diff).toFixed(1)} days`;document.getElementById("saveUsernameBtn").disabled=true;}
    else{cd.textContent="You can change username now";document.getElementById("saveUsernameBtn").disabled=false;}
  }
}

document.getElementById("saveUsernameBtn")?.addEventListener("click",async()=>{
  const newName=document.getElementById("newDisplayUsername").value.trim();
  if(!newName){showToast("Enter username","warning");return;}
  const lastChanged=currentProfile.username_last_changed?new Date(currentProfile.username_last_changed):null;
  const now=new Date();
  if(lastChanged && (now-lastChanged)/(1000*60*60*24)<7){showToast("You can only change username every 7 days","warning");return;}
  const {error}=await supabaseClient.from("profiles").update({display_username:newName,username_last_changed:now.toISOString()}).eq("id",currentUser.id);
  if(error){showToast(error.message,"error");return;}
  showToast("Username updated!","success");location.reload();
});

document.getElementById("copyReferralCodeBtn")?.addEventListener("click",()=>{navigator.clipboard.writeText(document.getElementById("referralCode").textContent);showToast("Referral code copied!","success");});
document.getElementById("copyReferralLinkBtn")?.addEventListener("click",()=>{navigator.clipboard.writeText(document.getElementById("referralLink").value);showToast("Referral link copied!","success");});

document.getElementById("submitKYCBtn")?.addEventListener("click",async()=>{
  const country=document.getElementById("kycCountry").value.trim();
  const state=document.getElementById("kycState").value.trim();
  const city=document.getElementById("kycCity").value.trim();
  const address=document.getElementById("kycAddress").value.trim();
  const nin=document.getElementById("kycNIN").value.trim();
  const front=document.getElementById("kycNINFront").files[0];
  const back=document.getElementById("kycNINBack").files[0];
  const selfie=document.getElementById("kycSelfie").files[0];
  if(!country||!state||!city||!address||!nin||!front||!back||!selfie){showToast("Fill all KYC fields and upload NIN front/back + selfie","warning");return;}
  const btn=document.getElementById("submitKYCBtn"); btn.disabled=true; btn.textContent="Uploading...";
  async function uploadFile(file,path){const {data,error}=await supabaseClient.storage.from("kyc").upload(`${currentUser.id}/${path}_${Date.now()}_${file.name}`,file);if(error)throw error;const {data:url}=supabaseClient.storage.from("kyc").getPublicUrl(data.path);return url.publicUrl;}
  try{
    const frontUrl=await uploadFile(front,"front");
    const backUrl=await uploadFile(back,"back");
    const selfieUrl=await uploadFile(selfie,"selfie");
    const {error}=await supabaseClient.from("profiles").update({country,state,city,address,nin_number:nin,nin_front_url:frontUrl,nin_back_url:backUrl,selfie_url:selfieUrl,kyc_status:"pending",status:"kyc_under_review"}).eq("id",currentUser.id);
    if(error)throw error;
    showToast("KYC submitted! Admin will verify each section (name, NIN card, selfie).","success");
    setTimeout(()=>location.reload(),1500);
  }catch(e){showToast(e.message,"error"); btn.disabled=false; btn.textContent="Submit KYC for Verification";}
});

document.getElementById("submitWithdrawalBtn")?.addEventListener("click",async()=>{
  const amount=Number(document.getElementById("withdrawAmount").value);
  const accName=document.getElementById("withdrawAccountName").value.trim();
  const accNum=document.getElementById("withdrawAccountNumber").value.trim();
  const bank=document.getElementById("withdrawBankName").value.trim();
  if(!amount||amount<5){showToast("Minimum withdrawal is $5 and above (earnings only)","warning");return;}
  if(!accName||!accNum||!bank){showToast("Fill account details - must match NIN name exactly, no third party","warning");return;}
  if(accName.toLowerCase()!==currentProfile.full_name.toLowerCase()){
    const ok=await showConfirm(`Account name does NOT match your NIN name (${currentProfile.full_name}). Withdrawal must bear your original names, no third party. Continue?`);
    if(!ok) return;
  }
  const availableEarnings = window._earnings || 0;
  const totalInvested = window._totalInv || 0;
  const investments = window._investments || [];
  const threeMonthsAgo = new Date(); threeMonthsAgo.setMonth(threeMonthsAgo.getMonth()-3);
  const hasMaturedInvestment = investments.some(inv=> inv.status==="approved" && new Date(inv.created_at) < threeMonthsAgo);
  if(amount > availableEarnings && !hasMaturedInvestment){
    showToast(`You can only withdraw your earnings ($${availableEarnings.toFixed(2)} available). Investment capital cannot be withdrawn until after 3 months holding. You have $${totalInvested} invested. Earnings withdrawal minimum $5.`,"error");
    return;
  }
  if(amount > (currentProfile.balance||0) && (currentProfile.balance||0)>0 && amount > availableEarnings){
    showToast(`Insufficient available balance. Available: $${Number(currentProfile.balance).toFixed(2)}`,"error");
    return;
  }
  const btn=document.getElementById("submitWithdrawalBtn"); btn.disabled=true; btn.textContent="Processing...";
  try{
    const {error}=await supabaseClient.from("withdrawals").insert({user_id:currentUser.id,amount,account_name:accName,account_number:accNum,bank_name:bank,status:"pending"});
    if(error) throw error;
    showToast("Withdrawal requested! Minimum $5 earnings. Investment capital locked for 3 months. Admin will process.","success");
    btn.disabled=false; btn.textContent="Request Withdrawal";
    loadTransactions();
  }catch(e){
    showToast(e.message,"error");
    btn.disabled=false; btn.textContent="Request Withdrawal";
  }
});

init();
