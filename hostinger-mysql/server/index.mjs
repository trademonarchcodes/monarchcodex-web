import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mysql from 'mysql2/promise';
import crypto from 'node:crypto';

const app=express();
app.use(cors({origin:true,credentials:true}));
app.use(express.json({limit:'2mb'}));
const pool=mysql.createPool({host:process.env.MYSQL_HOST,port:Number(process.env.MYSQL_PORT||3306),user:process.env.MYSQL_USER,password:process.env.MYSQL_PASSWORD,database:process.env.MYSQL_DATABASE,connectionLimit:10});
const JWT_SECRET=process.env.JWT_SECRET;
const send=(res,status,body)=>res.status(status).json(body);
function auth(req,res,next){try{const h=req.headers.authorization||'';if(!h.startsWith('Bearer '))return send(res,401,{error:'Unauthorized'});req.user=jwt.verify(h.slice(7),JWT_SECRET);next()}catch{return send(res,401,{error:'Invalid session'})}}
function tokenFor(user){return jwt.sign({id:user.id,email:user.email,role:user.role},JWT_SECRET,{expiresIn:'7d'})}

app.get('/api/health',async(_req,res)=>{try{await pool.query('SELECT 1');send(res,200,{ok:true,service:'monarch-codex-hostinger',database:'mysql'})}catch(e){send(res,500,{ok:false,error:e.message})}});
app.post('/api/auth/register',async(req,res)=>{const {email,password,full_name,phone,country,state,city,address,referral_code}=req.body||{};if(!email||!password||!full_name||password.length<6)return send(res,400,{error:'Email, full name and a password of at least 6 characters are required.'});const c=await pool.getConnection();try{await c.beginTransaction();const [exists]=await c.query('SELECT id FROM users WHERE email=? LIMIT 1',[email.toLowerCase().trim()]);if(exists.length){await c.rollback();return send(res,409,{error:'An account with that email already exists.'})}const id=crypto.randomUUID();const hash=await bcrypt.hash(password,12);await c.query('INSERT INTO users(id,email,password_hash,created_at) VALUES(?,?,?,NOW())',[id,email.toLowerCase().trim(),hash]);await c.query('INSERT INTO profiles(id,full_name,email,phone,country,state,city,address,role,status,kyc_status,balance,referral_code,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())',[id,full_name.trim(),email.toLowerCase().trim(),phone||'',country||null,state||null,city||null,address||null,'member','pending_kyc','pending',0,referral_code||null]);await c.commit();send(res,201,{ok:true,token:tokenFor({id,email:email.toLowerCase().trim(),role:'member'})})}catch(e){await c.rollback();send(res,500,{error:e.message})}finally{c.release()}});
app.post('/api/auth/login',async(req,res)=>{const email=String(req.body?.email||'').trim().toLowerCase(),password=String(req.body?.password||'');const [rows]=await pool.query('SELECT u.id,u.email,u.password_hash,p.role,p.status FROM users u JOIN profiles p ON p.id=u.id WHERE u.email=? LIMIT 1',[email]);if(!rows.length||!(await bcrypt.compare(password,rows[0].password_hash)))return send(res,401,{error:'Invalid email or password.'});if(rows[0].status==='blocked')return send(res,403,{error:'Your account is blocked.'});send(res,200,{ok:true,token:tokenFor(rows[0]),user:{id:rows[0].id,email:rows[0].email,role:rows[0].role}})});
app.get('/api/auth/me',auth,async(req,res)=>{const [rows]=await pool.query('SELECT p.*,u.email FROM profiles p JOIN users u ON u.id=p.id WHERE p.id=? LIMIT 1',[req.user.id]);if(!rows.length)return send(res,404,{error:'Profile not found'});send(res,200,{user:rows[0]})});
app.post('/api/auth/logout',(_req,res)=>send(res,200,{ok:true}));

const readable=new Set(['profiles','packages','academy_lessons','academy_courses','academy_settings','academy_subscriptions','academy_progress','investments','earnings','withdrawals','transactions','wallet_transactions','wallet_funding_requests','payment_details','notifications','site_content','testimonies','online_cooperative_accounts','telegram_signals','telegram_chats','telegram_members','notification_settings','transaction_fee_settings']);
app.get('/api/table/:table',auth,async(req,res)=>{const table=req.params.table;if(!readable.has(table))return send(res,403,{error:'Table not available'});const filters=[];const values=[];for(const key of ['user_id','id'])if(req.query[key]){filters.push(key+'=?');values.push(req.query[key])}const sql='SELECT * FROM '+table+(filters.length?' WHERE '+filters.join(' AND '):'')+' LIMIT 500';try{const [rows]=await pool.query(sql,values);send(res,200,{data:rows})}catch(e){send(res,500,{error:e.message})}});
app.listen(Number(process.env.PORT||3000),()=>console.log('MONARCH CODEX Hostinger API listening'));
