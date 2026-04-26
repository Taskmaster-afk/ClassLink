console.log("ENV DB_HOST:", process.env.DB_HOST);
import express from "express";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET not set");
}
const JWT_SECRET = process.env.JWT_SECRET;

// Initialize Database Connection
const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  multipleStatements: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  ssl: {
    rejectUnauthorized: false
  }
};

let pool;

async function initDB() {
  // First connect without database to create it if it doesn't exist
  const tempPool = await mysql.createConnection({
    host: dbConfig.host,
    user: dbConfig.user,
    password: dbConfig.password,
  });
  
  await tempPool.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`);
  await tempPool.end();

  pool = mysql.createPool(dbConfig);

  // Initialize Database Schema
  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('teacher', 'student') NOT NULL
    );

    CREATE TABLE IF NOT EXISTS classes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      teacher_id INT NOT NULL,
      invite_code VARCHAR(255) UNIQUE NOT NULL,
      FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS enrollments (
      user_id INT NOT NULL,
      class_id INT NOT NULL,
      PRIMARY KEY (user_id, class_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS assignments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      class_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      due_date DATETIME,
      points INT DEFAULT 100,
      file_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      assignment_id INT NOT NULL,
      student_id INT NOT NULL,
      content TEXT,
      grade FLOAT,
      feedback TEXT,
      status ENUM('pending', 'graded') DEFAULT 'pending',
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      file_path TEXT,
      FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      class_id INT NOT NULL,
      author_id INT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS resources (
      id INT AUTO_INCREMENT PRIMARY KEY,
      class_id INT,
      title VARCHAR(255),
      description TEXT,
      file_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
    );
  `;
  
  await pool.query(schema);
  
  // Auto-migrate schema: add created_at to assignments if missing
  try {
    await pool.execute("ALTER TABLE assignments ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP");
    console.log("Migration: added created_at to assignments");
  } catch (err) {
    // Ignore if column already exists (ER_DUP_FIELDNAME)
    if (err.code !== 'ER_DUP_FIELDNAME') {
      console.error("Migration error (assignments):", err);
    }
  }

  console.log("Database initialized and migrated");
}

async function startServer() {
  await initDB();

  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (
        origin.includes("vercel.app") || origin.includes("localhost")
      ) {
        return callback(null, true);
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  }));
  app.use(express.json());
  app.use(cookieParser());
  app.set("trust proxy", 1);

  // Configure Multer
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: "classlink_uploads",
      resource_type: "auto",
    },
  });

  const upload = multer({ storage });

  // Note: Uploads are served directly from Cloudinary

  // Auth Middleware
  const authenticate = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
      console.log("Authentication failed: No token found in cookies");
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      console.error("Authentication failed: Invalid token", err.message);
      res.status(401).json({ error: "Invalid token" });
    }
  };

  app.post("/api/classes/:id/resources", authenticate, upload.single("file"), async (req, res) => {
    try {
      if (req.user.role !== "teacher") return res.status(403).json({ error: "Only teachers can upload resources" });
      
      // Check ownership
      const [ownerRows] = await pool.execute("SELECT 1 FROM classes WHERE id = ? AND teacher_id = ?", [req.params.id, req.user.id]);
      if (ownerRows.length === 0) return res.status(403).json({ error: "You don't own this class" });

      const { title, description } = req.body;
      const file_path = req.file ? req.file.path : null;
      
      if (!file_path) return res.status(400).json({ error: "File is required for resources" });

      const [result] = await pool.execute("INSERT INTO resources (class_id, title, description, file_path) VALUES (?, ?, ?, ?)", [req.params.id, title, description, file_path]);
      res.json({ id: result.insertId, title, description, file_path });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  app.get("/api/classes/:id/resources", authenticate, async (req, res) => {
    try {
      // Check enrollment
      const [memberRows] = await pool.execute("SELECT 1 FROM enrollments WHERE class_id = ? AND user_id = ?", [req.params.id, req.user.id]);
      const [teacherRows] = await pool.execute("SELECT 1 FROM classes WHERE id = ? AND teacher_id = ?", [req.params.id, req.user.id]);
      
      if (memberRows.length === 0 && teacherRows.length === 0) return res.status(403).json({ error: "Not members of this class" });

      const [resources] = await pool.execute("SELECT * FROM resources WHERE class_id = ? ORDER BY created_at DESC", [req.params.id]);
      res.json(resources);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  // Auth Routes
  app.post("/api/auth/register", async (req, res) => {
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

  app.post("/api/auth/login", async (req, res) => {
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

  app.get("/api/auth/me", (req, res) => {
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

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "none",
      secure: process.env.NODE_ENV === "production",
      path: "/"
    }).json({ success: true });
  });

  // Student To-Do List
  app.get("/api/student/assignments", authenticate, async (req, res) => {
    if (req.user.role !== "student") return res.status(403).json({ error: "Only students have a to-do list" });
    try {
      const [assignments] = await pool.execute(`
        SELECT a.*, c.name as class_name 
        FROM assignments a
        JOIN classes c ON a.class_id = c.id
        JOIN enrollments e ON e.class_id = c.id
        WHERE e.user_id = ?
        ORDER BY a.due_date ASC
      `, [req.user.id]);
      res.json(assignments);
    } catch (err) {
      console.error("Fetch to-do error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Class Routes
  app.get("/api/classes", authenticate, async (req, res) => {
    let classes;
    try {
      if (req.user.role === "teacher") {
        [classes] = await pool.execute("SELECT * FROM classes WHERE teacher_id = ?", [req.user.id]);
      } else {
        [classes] = await pool.execute(`
          SELECT c.* FROM classes c 
          JOIN enrollments e ON e.class_id = c.id 
          WHERE e.user_id = ?
        `, [req.user.id]);
      }
      res.json(classes);
    } catch (err) {
       console.error("Fetch classes error:", err);
       res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/classes", authenticate, async (req, res) => {
    if (req.user.role !== "teacher") return res.status(403).json({ error: "Only teachers can create classes" });
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: "Class name is required" });
    
    try {
      const invite_code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const [result] = await pool.execute("INSERT INTO classes (name, description, teacher_id, invite_code) VALUES (?, ?, ?, ?)", [name, description, req.user.id, invite_code]);
      res.json({ id: result.insertId, name, description, invite_code });
    } catch (err) {
      console.error("Create class error:", err);
      res.status(500).json({ error: "Failed to create class" });
    }
  });

  app.post("/api/classes/join", authenticate, async (req, res) => {
    if (req.user.role !== "student") return res.status(403).json({ error: "Only students can join classes" });
    const { invite_code } = req.body;
    
    try {
      const [classRows] = await pool.execute("SELECT id FROM classes WHERE invite_code = ?", [invite_code]);
      const classroom = classRows[0];
      if (!classroom) return res.status(404).json({ error: "Class not found" });

      await pool.execute("INSERT INTO enrollments (user_id, class_id) VALUES (?, ?)", [req.user.id, classroom.id]);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(400).json({ error: "Already enrolled or database error" });
    }
  });

  app.get("/api/classes/:id", authenticate, async (req, res) => {
    try {
      const [classRows] = await pool.execute("SELECT * FROM classes WHERE id = ?", [req.params.id]);
      const classroom = classRows[0];
      if (!classroom) return res.status(404).json({ error: "Class not found" });
      
      const [teacherRows] = await pool.execute("SELECT name FROM users WHERE id = ?", [classroom.teacher_id]);
      const teacher = teacherRows[0];
      classroom.teacher_name = teacher?.name || "Unknown";

      const [announcements] = await pool.execute(`
        SELECT a.*, u.name as author_name 
        FROM announcements a 
        JOIN users u ON a.author_id = u.id 
        WHERE a.class_id = ? 
        ORDER BY created_at DESC
      `, [req.params.id]);
const [assignments] = await pool.execute(
  "SELECT * FROM assignments WHERE class_id = ? ORDER BY id DESC",
  [req.params.id]
);

const safeAssignments = assignments.map(a => ({
  ...a,
  created_at: a.created_at ? new Date(a.created_at) : new Date()
}));
      res.json({ ...classroom, announcements, assignments: safeAssignments });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  // Announcements
  app.post("/api/classes/:id/announcements", authenticate, async (req, res) => {
    try {
      const { content } = req.body;
      const [result] = await pool.execute("INSERT INTO announcements (class_id, author_id, content) VALUES (?, ?, ?)", [req.params.id, req.user.id, content]);
      res.json({ id: result.insertId, content, created_at: new Date().toISOString() });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  // Assignments
  app.post("/api/classes/:id/assignments", authenticate, upload.single("file"), async (req, res) => {
    try {
      if (req.user.role !== "teacher") return res.status(403).json({ error: "Only teachers can create assignments" });
      const { title, description, due_date, points } = req.body;

      // convert safely
      const formattedDueDate = due_date
        ? new Date(due_date)
        : null;
      const file_path = req.file ? req.file.path : null;
      
      const [result] = await pool.execute(
        "INSERT INTO assignments (class_id, title, description, due_date, points, file_path, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())",
        [req.params.id, title, description, formattedDueDate, points || 100, file_path]
);
   res.json({
  id: result.insertId,
  title,
  description,
  due_date: formattedDueDate,
  created_at: new Date(),
  points: points || 100,
  file_path
});
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  app.get("/api/assignments/:id", authenticate, async (req, res) => {
    try {
      const [assignmentRows] = await pool.execute("SELECT * FROM assignments WHERE id = ?", [req.params.id]);
      const assignment = assignmentRows[0];
      if (!assignment) return res.status(404).json({ error: "Assignment not found" });

      let submissions = [];
      let mySubmission = null;

      if (req.user.role === "teacher") {
        [submissions] = await pool.execute(`
          SELECT s.*, u.name as student_name 
          FROM submissions s 
          JOIN users u ON s.student_id = u.id 
          WHERE s.assignment_id = ?
        `, [req.params.id]);
      } else {
        const [subRows] = await pool.execute("SELECT * FROM submissions WHERE assignment_id = ? AND student_id = ?", [req.params.id, req.user.id]);
        mySubmission = subRows[0] || null;
      }

      res.json({ ...assignment, submissions, mySubmission });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  app.post("/api/assignments/:id/submit", authenticate, upload.single("file"), async (req, res) => {
    try {
      if (req.user.role !== "student") return res.status(403).json({ error: "Only students can submit" });
      const { content } = req.body;
      const file_path = req.file ? req.file.path : null;
      
      const [existingRows] = await pool.execute("SELECT id FROM submissions WHERE assignment_id = ? AND student_id = ?", [req.params.id, req.user.id]);
      const existing = existingRows[0];

      if (existing) {
        await pool.execute("UPDATE submissions SET content = ?, file_path = ?, submitted_at = CURRENT_TIMESTAMP, status = 'pending' WHERE id = ?", [content, file_path, existing.id]);
      } else {
        await pool.execute("INSERT INTO submissions (assignment_id, student_id, content, file_path) VALUES (?, ?, ?, ?)", [req.params.id, req.user.id, content, file_path]);
      }
      res.json({ success: true, file_path });
    } catch (err) {
      console.error("Submission error:", err);
      res.status(500).json({ error: "Submission failed" });
    }
  });

  app.post("/api/submissions/:id/grade", authenticate, async (req, res) => {
    try {
      if (req.user.role !== "teacher") return res.status(403).json({ error: "Only teachers can grade" });
      const { grade, feedback } = req.body;
      await pool.execute("UPDATE submissions SET grade = ?, feedback = ?, status = 'graded' WHERE id = ?", [grade, feedback, req.params.id]);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  app.get("/", (req, res) => {
    res.send("Server is running");
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (process.env.NODE_ENV !== "test" && process.env.VERCEL !== "1") {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

  // Global error handler for middleware (like Multer/Cloudinary)
  app.use((err, req, res, next) => {
    console.error("Global Error Handler:", err);
    
    let errorMsg = "An unexpected error occurred";
    if (err.message) errorMsg = err.message;
    else if (typeof err === 'string') errorMsg = err;
    else {
      try { errorMsg = JSON.stringify(err); } catch(e) {}
    }

    res.status(500).json({ error: errorMsg, rawError: err });
  });

  return app;
}

const appPromise = startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
export default appPromise;
