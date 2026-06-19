import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

const client = connectionString
  ? postgres(connectionString, { prepare: false })
  : null;

const _db = client ? drizzle(client, { schema }) : null;

const _neonSql = connectionString ? neon(connectionString) : null;

export function hasDb(): boolean {
  return _db !== null;
}

export function getDb() {
  if (!_db) throw new Error("DATABASE_URL is not set");
  return _db;
}

export function getNeonSql() {
  if (!_neonSql) throw new Error("DATABASE_URL is not set");
  return _neonSql;
}

export const db = _db as NonNullable<typeof _db>;

export type Database = NonNullable<typeof _db>;
