import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET not set in environment");
}

export const authenticate = (req, res, next) => {
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
