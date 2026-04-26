import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

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

export async function initDB() {
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

export function getPool() {
  if (!pool) {
    throw new Error("Database pool has not been initialized. Call initDB() first.");
  }
  return pool;
}
