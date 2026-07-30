import "dotenv/config";
import express from "express";

import { pool } from "./config/database.js";

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

app.get("/health", async (request, response) => {
  try {
    const result = await pool.query(
      "SELECT NOW() AS database_time"
    );

    response.status(200).json({
      status: "ok",
      message: "Authentication API is running",
      database: "connected",
      databaseTime: result.rows[0].database_time
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    response.status(500).json({
      status: "error",
      message: "API is running, but the database connection failed"
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});