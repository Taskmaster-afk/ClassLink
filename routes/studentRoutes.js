import express from "express";
import { getPool } from "../config/db.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Student To-Do List
router.get("/assignments", authenticate, async (req, res) => {
  const pool = getPool();
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

export default router;
