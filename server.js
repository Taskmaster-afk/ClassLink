import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import { initDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import classRoutes from "./routes/classRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  await initDB();

  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (origin.includes("vercel.app") || origin.includes("localhost")) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  }));
  app.use(express.json());
  app.use(cookieParser());
  app.set("trust proxy", 1);

  // Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/classes", classRoutes);
  app.use("/api", assignmentRoutes);
  app.use("/api/student", studentRoutes);

  app.get("/api", (req, res) => {
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

  // Global error handler
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
