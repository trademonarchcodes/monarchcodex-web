import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import {pool} from "./db.js";
const secret=()=>process.env.JWT_SECRET;
export async function issue(user){return jwt.sign({sub:user.id,email:user.email},secret(),{expiresIn:"7d"});}
export async function auth(req,res,next){try{const h=req.headers.authorization||"";const token=h.startsWith("Bearer ")?h.slice(7):null;if(!token)throw new Error();const p=jwt.verify(token,secret());const [rows]=await pool.query("SELECT id,email,role,full_name FROM users WHERE id=? AND active=1 LIMIT 1",[p.sub]);if(!rows[0])throw new Error();req.user=rows[0];next()}catch(e){res.status(401).json({ok:false,error:"Unauthorized."})}}
export async function passwordHash(p){return bcrypt.hash(p,12)}
export async function passwordCheck(p,h){return bcrypt.compare(p,h)}