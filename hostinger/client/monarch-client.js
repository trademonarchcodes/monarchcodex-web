(function(){
"use strict";
const API=window.MONARCH_API_BASE||"/api";
let token=localStorage.getItem("monarch_access_token")||null;
const headers=()=>token?{Authorization:"Bearer "+token}:{};
async function req(url,opt={}){
 const r=await fetch(API+url,{...opt,headers:{...headers(),...(opt.headers||{})}});
 let j=null;try{j=await r.json()}catch(_){}
 if(!r.ok)return {data:null,error:{message:j?.error||j?.message||("Request failed: "+r.status),status:r.status}};
 return j||{data:null,error:null};
}
class Q{
 constructor(t){this.t=t;this.filters=[];this.orderBy=null;this.limitN=null;this.op="select";this.data=null;this.single=false}
 select(s="*"){this.sel=s;return this}
 eq(c,v){this.filters.push({column:c,op:"eq",value:v});return this}
 neq(c,v){this.filters.push({column:c,op:"neq",value:v});return this}
 is(c,v){this.filters.push({column:c,op:"is",value:v});return this}
 order(c,o={}){this.orderBy={column:c,ascending:o.ascending!==false};return this}
 limit(n){this.limitN=n;return this}
 maybeSingle(){this.single=true;return this.run()}
 single(){this.single=true;return this.run()}
 insert(d){this.op="insert";this.data=d;return this}
 update(d){this.op="update";this.data=d;return this}
 delete(){this.op="delete";return this}
 upsert(d){this.op="insert";this.data=d;return this}
 then(a,b){return this.run().then(a,b)}
 async run(){
  const body={table:this.t,op:this.op,select:this.sel,filters:this.filters,data:this.data,order:this.orderBy,limit:this.limitN};
  const r=await req("/query",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  if(this.single&&!r.error)r.data=Array.isArray(r.data)?(r.data[0]||null):r.data;
  return r;
 }
}
function client(){
 return {
  from:t=>new Q(t),
  rpc:(name,args={})=>req("/rpc",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,args})),
  functions:{invoke:(name,opt={})=>req("/functions/"+encodeURIComponent(name),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(opt.body||{})})},
  auth:{
   async getSession(){if(!token)return {data:{session:null},error:null};const r=await req("/auth/session",{method:"POST"});if(r.error){token=null;localStorage.removeItem("monarch_access_token");return {data:{session:null},error:r.error}}return {data:{session:{...r.session,access_token:token,user:r.user}},error:null}},
   async signInWithPassword(x){const r=await req("/auth/signin",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(x)});if(!r.error){token=r.session.access_token;localStorage.setItem("monarch_access_token",token)}return {data:r.data||{user:r.user,session:r.session},error:r.error}},
   async signUp(x){const d=x.options?.data||{};const r=await req("/auth/signup",{method:"POST",headers:{"Content-Type":"application/json"},body:{email:x.email,password:x.password,full_name:d.full_name,phone:d.phone,referral_code:d.referral_code}});if(!r.error&&r.session){token=r.session.access_token;localStorage.setItem("monarch_access_token",token)}return {data:r.data||{user:r.user,session:r.session},error:r.error}},
   async signOut(){token=null;localStorage.removeItem("monarch_access_token");return {error:null}},
   onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}}}
  },
  storage:{from:bucket=>({
   async upload(p,file){const fd=new FormData();fd.append("bucket",bucket);fd.append("path",p);fd.append("file",file);const r=await req("/storage/upload",{method:"POST",body:fd});return r.error?{data:null,error:r.error}:{data:{path:r.path||r.data?.path},error:null}},
   getPublicUrl:p=>({data:{publicUrl:API+"/storage/public?path="+encodeURIComponent(p)},error:null}),
   async createSignedUrl(p,seconds=300){const r=await req("/storage/signed-create",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({bucket,path:p,seconds})});return r.error?{data:null,error:r.error}:{data:{signedUrl:r.url||r.data?.url},error:null}}
  })}
 };
}
window.supabase={createClient:client};
})();
