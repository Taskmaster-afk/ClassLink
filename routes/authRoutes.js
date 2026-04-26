import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { getPool } from "../config/db.js";

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

router.post("/register", async (req, res) => {
  const pool = getPool();
  const { name, email, password, role } = req.body;
  try {
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.execute("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)", [name, email, hashedPassword, role]);
    
    const [userRows] = await pool.execute("SELECT id, name, email, role FROM users WHERE id = ?", [result.insertId]);
    const user = userRows[0];
    
    const token = jwt.sign(user, JWT_SECRET);
    res.cookie("token", token, { 
      httpOnly: true, 
      sameSite: 'none',
      secure: process.env.NODE_ENV === "production",
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    }).json(user);
  } catch (err) {
    console.error("Registration error:", err);
    res.status(400).json({ error: "User already exists or invalid data" });
  }
});

router.post("/login", async (req, res) => {
  const pool = getPool();
  const { email, password } = req.body;
  try {
    const [userRows] = await pool.execute("SELECT * FROM users WHERE email = ?", [email]);
    const user = userRows[0];
    
    if (user && await bcrypt.compare(password, user.password)) {
      const { password: _, ...userSafe } = user;
      const token = jwt.sign(userSafe, JWT_SECRET);
      res.cookie("token", token, { 
        httpOnly: true, 
        sameSite: 'none',
        secure: process.env.NODE_ENV === "production",
        path: '/',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      }).json(userSafe);
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/me", (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.json(null);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json(decoded);
  } catch (err) {
    console.error("Token verification failed:", err.message);
    res.json(null);
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "none",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  }).json({ success: true });
});

export default router;
