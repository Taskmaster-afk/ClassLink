import express from "express";
import { getPool } from "../config/db.js";
import { authenticate } from "../middleware/auth.js";
import { upload } from "../config/cloudinary.js";

const router = express.Router();

// Create Assignment
router.post("/classes/:id/assignments", authenticate, upload.single("file"), async (req, res) => {
  const pool = getPool();
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

// Get Assignment Details
router.get("/assignments/:id", authenticate, async (req, res) => {
  const pool = getPool();
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

// Submit Assignment
router.post("/assignments/:id/submit", authenticate, upload.single("file"), async (req, res) => {
  const pool = getPool();
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

// Grade Submission
router.post("/submissions/:id/grade", authenticate, async (req, res) => {
  const pool = getPool();
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

export default router;
