import express from "express";
import { getPool } from "../config/db.js";
import { authenticate } from "../middleware/auth.js";
import { upload } from "../config/cloudinary.js";

const router = express.Router();

router.get("/", authenticate, async (req, res) => {
  const pool = getPool();
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

router.post("/", authenticate, async (req, res) => {
  const pool = getPool();
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

router.post("/join", authenticate, async (req, res) => {
  const pool = getPool();
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

router.get("/:id", authenticate, async (req, res) => {
  const pool = getPool();
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
router.post("/:id/announcements", authenticate, async (req, res) => {
  const pool = getPool();
  try {
    const { content } = req.body;
    const [result] = await pool.execute("INSERT INTO announcements (class_id, author_id, content) VALUES (?, ?, ?)", [req.params.id, req.user.id, content]);
    res.json({ id: result.insertId, content, created_at: new Date().toISOString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Resources
router.post("/:id/resources", authenticate, upload.single("file"), async (req, res) => {
  const pool = getPool();
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

router.get("/:id/resources", authenticate, async (req, res) => {
  const pool = getPool();
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

export default router;
