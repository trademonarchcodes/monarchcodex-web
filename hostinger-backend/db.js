import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();
export const pool=mysql.createPool({host:process.env.MYSQL_HOST,port:Number(process.env.MYSQL_PORT||3306),database:process.env.MYSQL_DATABASE,user:process.env.MYSQL_USER,password:process.env.MYSQL_PASSWORD,waitForConnections:true,connectionLimit:10,charset:"utf8mb4"});
