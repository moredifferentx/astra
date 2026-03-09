import Database from "better-sqlite3"
import { env } from "./env.js"
import fs from "fs"
import path from "path"

console.log("[DB] Initializing database at:", env.DB_PATH)

const dbDir = path.dirname(env.DB_PATH)
if (!fs.existsSync(dbDir)) {
  console.log("[DB] Creating database directory:", dbDir)
  fs.mkdirSync(dbDir, { recursive: true })
}

let db
try {
  db = new Database(env.DB_PATH)
  console.log("[DB] ✓ Database connection successful")
} catch (err) {
  console.error("[DB] ✗ Database connection error:", err)
  process.exit(1)
}

// better-sqlite3 is synchronous and handles busy internally
db.pragma("busy_timeout = 10000")
db.pragma("journal_mode = WAL")
db.pragma("foreign_keys = ON")
db.pragma("secure_delete = ON")

// ── Performance tuning for 100+ concurrent users ─────────────────────────
// Increase page cache to ~64 MB (negative = KB). Default is ~2 MB.
db.pragma("cache_size = -65536")
// Memory-mapped I/O: let the OS cache up to 256 MB of the DB file.
db.pragma("mmap_size = 268435456")
// Keep temporary tables/indexes in memory instead of disk.
db.pragma("temp_store = MEMORY")
// Synchronous NORMAL is safe with WAL mode and ~2x faster than FULL.
db.pragma("synchronous = NORMAL")
// Limit WAL file size to 64 MB before auto-checkpoint.
db.pragma("wal_autocheckpoint = 1000")

console.log("[DB] ✓ WAL mode, foreign keys, secure_delete, performance tuning enabled")

// ── Graceful shutdown ────────────────────────────────────────────────────
// Checkpoint WAL and close the database cleanly on process exit.
function closeDb() {
  try {
    db.pragma("wal_checkpoint(TRUNCATE)")
    db.close()
    console.log("[DB] ✓ Database closed gracefully")
  } catch (e) {
    console.error("[DB] Error closing database:", e.message)
  }
}
process.on("SIGTERM", closeDb)
process.on("SIGINT", closeDb)

// Keep the same async API surface so no other files need changes.
// better-sqlite3 is synchronous under the hood — wrapping in Promise
// keeps all callers using `await` working without modification.

export function query(sql, params = []) {
  try {
    const rows = db.prepare(sql).all(params)
    return Promise.resolve(rows || [])
  } catch (err) {
    return Promise.reject(err)
  }
}

export function getOne(sql, params = []) {
  try {
    const row = db.prepare(sql).get(params)
    return Promise.resolve(row || null)
  } catch (err) {
    return Promise.reject(err)
  }
}

export function runSync(sql, params = []) {
  try {
    const info = db.prepare(sql).run(params)
    return Promise.resolve({ lastID: info.lastInsertRowid, changes: info.changes })
  } catch (err) {
    return Promise.reject(err)
  }
}

/**
 * Run multiple operations atomically inside a SERIALIZABLE transaction.
 * Uses better-sqlite3's synchronous transaction API with BEGIN IMMEDIATE
 * to prevent race conditions (double-spend, coupon over-redemption, etc.).
 *
 * @param {(helpers: { query, getOne, runSync }) => any} fn
 * @returns {Promise<any>} result of fn
 *
 * Usage:
 *   const result = await transaction(({ query, getOne, runSync }) => {
 *     const user = getOne("SELECT coins FROM users WHERE id = ?", [userId])
 *     if (user.coins < price) throw Object.assign(new Error("Insufficient balance"), { statusCode: 400 })
 *     runSync("UPDATE users SET coins = coins - ? WHERE id = ?", [price, userId])
 *     return runSync("INSERT INTO servers (...) VALUES (...)", [...])
 *   })
 */
export function transaction(fn) {
  const txHelpers = {
    query: (sql, params = []) => db.prepare(sql).all(params) || [],
    getOne: (sql, params = []) => db.prepare(sql).get(params) || null,
    runSync: (sql, params = []) => {
      const info = db.prepare(sql).run(params)
      return { lastID: info.lastInsertRowid, changes: info.changes }
    }
  }
  try {
    // BEGIN IMMEDIATE acquires a write lock at the start, serializing
    // concurrent writes and preventing TOCTOU race conditions.
    const txn = db.transaction(() => fn(txHelpers))
    const result = txn.immediate()
    return Promise.resolve(result)
  } catch (err) {
    return Promise.reject(err)
  }
}

export { db }
