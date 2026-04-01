import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "node:fs";
import path from "node:path";

import { runMigrations } from "@/lib/db/migrations";
import * as schema from "@/lib/db/schema";

declare global {
  var __gansys_sqlite__: Database.Database | undefined;
}

const databaseDirectory = process.env.RAILWAY_VOLUME_MOUNT_PATH ?? path.join(process.cwd(), "data");
const databasePath = path.join(databaseDirectory, "gansys.sqlite");

function createDatabase() {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const sqlite = new Database(databasePath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  runMigrations(sqlite);
  return sqlite;
}

export const sqlite = globalThis.__gansys_sqlite__ ?? createDatabase();

if (process.env.NODE_ENV !== "production") {
  globalThis.__gansys_sqlite__ = sqlite;
}

export const db = drizzle(sqlite, { schema });
