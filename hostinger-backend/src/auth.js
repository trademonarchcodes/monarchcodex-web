import {Router} from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import {pool} from "../db.js";
const router=Router();
const tokenFor=user=>jwt.sign({sub:user.id,role:user.role,email:user.email},process.env.JWT_SECRET,{expiresIn:"7d"});
router.post("/register",async(req,res)=>{
 try{
  const {email,password,full_name}=req.body||{};
  if(!email||!password||!full_name)return res.status(400).json({ok:false,error:"Full name, email and password are required."});
  if(password.length<8)return res.status(400).json({ok:false,error:"Password must be at least 8 characters."});
  const normalized=email.trim().toLowerCase();
  const [existing]=await pool.query("SELECT id FROM profiles WHERE email=? LIMIT 1",[normalized]);
  if(existing.length)return res.status(409).json({ok:false,error:"An account with this email already exists."});
  const id=crypto.randomUUID(),hash=await bcrypt.hash(password,12);
  await pool.query("INSERT INTO profiles (id,email,full_name,password_hash,role,status) VALUES (?,?,?,?,?,?)",[id,normalized,full_name.trim(),hash,"member","pending_kyc"]);
  const user={id,email:normalized,full_name:full_name.trim(),role:"member",status:"pending_kyc"};
  res.status(201).json({ok:true,user,access_token:tokenFor(user)});
 }catch(e){res.status(500).json({ok:false,error:"Registration failed."});}
});
router.post("/login",async(req,res)=>{
 try{
  const {email,password}=req.body||{};
  const [rows]=await pool.query("SELECT id,email,full_name,password_hash,role,status,balance FROM profiles WHERE email=? LIMIT 1",[String(email||"").trim().toLowerCase()]);
  if(!rows.length||!(await bcrypt.compare(String(password||""),rows[0].password_hash)))return res.status(401).json({ok:false,error:"Invalid email or password."});
  const u=rows[0],user={id:u.id,email:u.email,full_name:u.full_name,role:u.role,status:u.status,balance:u.balance};
  res.json({ok:true,user,access_token:tokenFor(user)});
 }catch(e){res.status(500).json({ok:false,error:"Login failed."});}
});
export default router;
