import "dotenv/config";
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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

app.post("/auth/register", async (request, response) => {

  try {

    const { email, password } = request.body;

    if (!email || !password) {

      return response.status(400).json({

        error: "Email and password are required"

      });

    }

    if (password.length < 8) {

      return response.status(400).json({

        error: "Password must be at least 8 characters"

      });

    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await pool.query(

      "SELECT id FROM users WHERE email = $1",

      [normalizedEmail]

    );

    if (existingUser.rows.length > 0) {

      return response.status(409).json({

        error: "An account with this email already exists"

      });

    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(

      `

      INSERT INTO users (email, password_hash)

      VALUES ($1, $2)

      RETURNING id, email, created_at

      `,

      [normalizedEmail, passwordHash]

    );

    return response.status(201).json({

      user: result.rows[0]

    });

  } catch (error) {

  console.error("Registration failed");

  console.error("Message:", error.message);

  console.error("Code:", error.code);

  console.error("Detail:", error.detail);

  console.error("Stack:", error.stack);

    return response.status(500).json({

      error: error.message

    });

  }

});
app.post("/auth/login", async (request, response) => {
  try {
    const { email, password } = request.body;
   if (!email || !password) {
      return response.status(400).json({
        error: "Email and password are required"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const result = await pool.query(
      `
      SELECT id, email, password_hash
      FROM users
      WHERE email = $1
      `,
      [normalizedEmail]
    );

    const user = result.rows[0];

    if (!user) {
      return response.status(401).json({
        error: "Invalid email or password"
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      return response.status(401).json({
        error: "Invalid email or password"
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing");
    }

    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "15m",
        issuer: "authentication-poc",
        audience: "authentication-poc-api"
      }
    );

    return response.status(200).json({
      user: {
        id: user.id,
        email: user.email
      },
      accessToken
    });
  } catch (error) {
    console.error("Login failed:", error);

    return response.status(500).json({
      error: error.message
    });
  }
});
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});