import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema.js";

const connectionString =
  process.env.DATABASE_URL ||
  `postgres://${process.env.DB_USER || "postgres"}:${
    process.env.DB_PASSWORD || "postgres"
  }@${process.env.DB_HOST || "postgres"}:${process.env.DB_PORT || "5432"}/${
    process.env.DB_NAME || "if04_db"
  }`;

const client = postgres(connectionString);

export const db = drizzle(client, { schema });
