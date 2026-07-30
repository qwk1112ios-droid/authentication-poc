import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

console.log(

  "Database host configured:",

  Boolean(process.env.DATABASE_URL)

);

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing from the environment");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});