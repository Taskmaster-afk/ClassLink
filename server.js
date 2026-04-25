import express from "express";
import cors from "cors";

import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "default_secret_dev";
const db = new Database("classlink.db");

// Initialize Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('teacher', 'student')) NOT NULL
  );

  CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    teacher_id INTEGER NOT NULL,
    invite_code TEXT UNIQUE NOT NULL,
    FOREIGN KEY (teacher_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS enrollments (
    user_id INTEGER NOT NULL,
    class_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, class_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (class_id) REFERENCES classes(id)
  );

  CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date TEXT,
    points INTEGER DEFAULT 100,
    FOREIGN KEY (class_id) REFERENCES classes(id)
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    content TEXT,
    grade REAL,
    feedback TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'graded')),
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assignment_id) REFERENCES assignments(id),
    FOREIGN KEY (student_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER NOT NULL,
    author_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (author_id) REFERENCES users(id)
  );
`);

// Migration for file_path columns
try {
  db.exec("ALTER TABLE assignments ADD COLUMN file_path TEXT;");
} catch (e) {
  // Column already exists
}
try {
  db.exec("ALTER TABLE submissions ADD COLUMN file_path TEXT;");
} catch (e) {
  // Column already exists
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors({
  origin: "https://class-link-7ck5.vercel.app", // your frontend URL
  credentials: true
}));
  app.use(express.json());
  app.use(cookieParser());
  app.set("trust proxy", 1);

  // Configure Multer
  const uploadDir = path.join(__dirname, "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + "-" + file.originalname);
    }
  });
  const upload = multer({ storage: storage });

  // Serve uploads statically
  app.use("/uploads", express.static(uploadDir));

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

  // Resources
  db.exec(`
    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_id INTEGER,
      title TEXT,
      description TEXT,
      file_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (class_id) REFERENCES classes (id)
    );
  `);

  app.post("/api/classes/:id/resources", authenticate, upload.single("file"), (req, res) => {
    if (req.user.role !== "teacher") return res.status(403).json({ error: "Only teachers can upload resources" });
    
    // Check ownership
    const isTeacher = db.prepare("SELECT 1 FROM classes WHERE id = ? AND teacher_id = ?").get(req.params.id, req.user.id);
    if (!isTeacher) return res.status(403).json({ error: "You don't own this class" });

    const { title, description } = req.body;
    const file_path = req.file ? `/uploads/${req.file.filename}` : null;
    
    if (!file_path) return res.status(400).json({ error: "File is required for resources" });

    const info = db.prepare("INSERT INTO resources (class_id, title, description, file_path) VALUES (?, ?, ?, ?)").run(req.params.id, title, description, file_path);
    res.json({ id: info.lastInsertRowid, title, description, file_path });
  });

  app.get("/api/classes/:id/resources", authenticate, (req, res) => {
    // Check enrollment
    const membership = db.prepare("SELECT 1 FROM enrollments WHERE class_id = ? AND user_id = ?").get(req.params.id, req.user.id);
    const isTeacher = db.prepare("SELECT 1 FROM classes WHERE id = ? AND teacher_id = ?").get(req.params.id, req.user.id);
    
    if (!membership && !isTeacher) return res.status(403).json({ error: "Not members of this class" });

    const resources = db.prepare("SELECT * FROM resources WHERE class_id = ? ORDER BY created_at DESC").all(req.params.id);
    res.json(resources);
  });

  // Auth Routes
  app.post("/api/auth/register", async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
      if (!name || !email || !password || !role) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const info = db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run(name, email, hashedPassword, role);
      const user = db.prepare("SELECT id, name, email, role FROM users WHERE id = ?").get(info.lastInsertRowid);
      const token = jwt.sign(user, JWT_SECRET);
      res.cookie("token", token, { 
        httpOnly: true, 
        sameSite: 'none',
        secure: true,
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
      const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
      if (user && await bcrypt.compare(password, user.password)) {
        const { password: _, ...userSafe } = user;
        const token = jwt.sign(userSafe, JWT_SECRET);
        res.cookie("token", token, { 
          httpOnly: true, 
          sameSite: 'none',
          secure: true,
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
  secure: true,
  path: "/"
}).json({ success: true });
  });

  // Student To-Do List
  app.get("/api/student/assignments", authenticate, (req, res) => {
    if (req.user.role !== "student") return res.status(403).json({ error: "Only students have a to-do list" });
    try {
      const assignments = db.prepare(`
        SELECT a.*, c.name as class_name 
        FROM assignments a
        JOIN classes c ON a.class_id = c.id
        JOIN enrollments e ON e.class_id = c.id
        WHERE e.user_id = ?
        ORDER BY a.due_date ASC
      `).all(req.user.id);
      res.json(assignments);
    } catch (err) {
      console.error("Fetch to-do error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Class Routes
  app.get("/api/classes", authenticate, (req, res) => {
    let classes;
    try {
      if (req.user.role === "teacher") {
        classes = db.prepare("SELECT * FROM classes WHERE teacher_id = ?").all(req.user.id);
      } else {
        classes = db.prepare(`
          SELECT c.* FROM classes c 
          JOIN enrollments e ON e.class_id = c.id 
          WHERE e.user_id = ?
        `).all(req.user.id);
      }
      res.json(classes);
    } catch (err) {
       console.error("Fetch classes error:", err);
       res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/classes", authenticate, (req, res) => {
    if (req.user.role !== "teacher") return res.status(403).json({ error: "Only teachers can create classes" });
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: "Class name is required" });
    
    try {
      const invite_code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const info = db.prepare("INSERT INTO classes (name, description, teacher_id, invite_code) VALUES (?, ?, ?, ?)").run(name, description, req.user.id, invite_code);
      res.json({ id: info.lastInsertRowid, name, description, invite_code });
    } catch (err) {
      console.error("Create class error:", err);
      res.status(500).json({ error: "Failed to create class" });
    }
  });

  app.post("/api/classes/join", authenticate, (req, res) => {
    if (req.user.role !== "student") return res.status(403).json({ error: "Only students can join classes" });
    const { invite_code } = req.body;
    const classroom = db.prepare("SELECT id FROM classes WHERE invite_code = ?").get(invite_code);
    if (!classroom) return res.status(404).json({ error: "Class not found" });
    try {
      db.prepare("INSERT INTO enrollments (user_id, class_id) VALUES (?, ?)").run(req.user.id, classroom.id);
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ error: "Already enrolled" });
    }
  });

  app.get("/api/classes/:id", authenticate, (req, res) => {
    const classroom = db.prepare("SELECT * FROM classes WHERE id = ?").get(req.params.id);
    if (!classroom) return res.status(404).json({ error: "Class not found" });
    
    const teacher = db.prepare("SELECT name FROM users WHERE id = ?").get(classroom.teacher_id);
    classroom.teacher_name = teacher?.name;

    const announcements = db.prepare(`
      SELECT a.*, u.name as author_name 
      FROM announcements a 
      JOIN users u ON a.author_id = u.id 
      WHERE a.class_id = ? 
      ORDER BY created_at DESC
    `).all(req.params.id);

    const assignments = db.prepare("SELECT * FROM assignments WHERE class_id = ?").all(req.params.id);

    res.json({ ...classroom, announcements, assignments });
  });

  // Announcements
  app.post("/api/classes/:id/announcements", authenticate, (req, res) => {
    const { content } = req.body;
    const info = db.prepare("INSERT INTO announcements (class_id, author_id, content) VALUES (?, ?, ?)").run(req.params.id, req.user.id, content);
    res.json({ id: info.lastInsertRowid, content, created_at: new Date().toISOString() });
  });

  // Assignments
  app.post("/api/classes/:id/assignments", authenticate, upload.single("file"), (req, res) => {
    if (req.user.role !== "teacher") return res.status(403).json({ error: "Only teachers can create assignments" });
    const { title, description, due_date, points } = req.body;
    const file_path = req.file ? `/uploads/${req.file.filename}` : null;
    
    const info = db.prepare("INSERT INTO assignments (class_id, title, description, due_date, points, file_path) VALUES (?, ?, ?, ?, ?, ?)").run(req.params.id, title, description, due_date, points, file_path);
    res.json({ id: info.lastInsertRowid, title, description, due_date, points, file_path });
  });

  app.get("/api/assignments/:id", authenticate, (req, res) => {
    const assignment = db.prepare("SELECT * FROM assignments WHERE id = ?").get(req.params.id);
    if (!assignment) return res.status(404).json({ error: "Assignment not found" });

    let submissions = [];
    let mySubmission = null;

    if (req.user.role === "teacher") {
      submissions = db.prepare(`
        SELECT s.*, u.name as student_name 
        FROM submissions s 
        JOIN users u ON s.student_id = u.id 
        WHERE s.assignment_id = ?
      `).all(req.params.id);
    } else {
      mySubmission = db.prepare("SELECT * FROM submissions WHERE assignment_id = ? AND student_id = ?").get(req.params.id, req.user.id);
    }

    res.json({ ...assignment, submissions, mySubmission });
  });

  app.post("/api/assignments/:id/submit", authenticate, upload.single("file"), (req, res) => {
    if (req.user.role !== "student") return res.status(403).json({ error: "Only students can submit" });
    const { content } = req.body;
    const file_path = req.file ? `/uploads/${req.file.filename}` : null;
    
    try {
      const existing = db.prepare("SELECT id FROM submissions WHERE assignment_id = ? AND student_id = ?").get(req.params.id, req.user.id);
      if (existing) {
        db.prepare("UPDATE submissions SET content = ?, file_path = ?, submitted_at = CURRENT_TIMESTAMP, status = 'pending' WHERE id = ?").run(content, file_path, existing.id);
      } else {
        db.prepare("INSERT INTO submissions (assignment_id, student_id, content, file_path) VALUES (?, ?, ?, ?)").run(req.params.id, req.user.id, content, file_path);
      }
      res.json({ success: true, file_path });
    } catch (err) {
      console.error("Submission error:", err);
      res.status(500).json({ error: "Submission failed" });
    }
  });

  app.post("/api/submissions/:id/grade", authenticate, (req, res) => {
    if (req.user.role !== "teacher") return res.status(403).json({ error: "Only teachers can grade" });
    const { grade, feedback } = req.body;
    db.prepare("UPDATE submissions SET grade = ?, feedback = ?, status = 'graded' WHERE id = ?").run(grade, feedback, req.params.id);
    res.json({ success: true });
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

  return app;
}

const appPromise = startServer();
export default appPromise;
