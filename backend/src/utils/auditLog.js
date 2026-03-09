import { runSync } from "../config/db.js"

/**
 * Record an admin action in the audit_log table.
 *
 * @param {Object} opts
 * @param {number} opts.adminId      – ID of the admin performing the action
 * @param {string} opts.action       – Short verb: "delete_user", "approve_utr", etc.
 * @param {string} [opts.targetType] – Entity type: "user", "server", "plan", "coupon"
 * @param {number} [opts.targetId]   – ID of the affected entity
 * @param {string} [opts.details]    – Free-form JSON or text with extra context
 * @param {string} [opts.ip]         – Request IP address
 */
export async function auditLog({ adminId, action, targetType = null, targetId = null, details = null, ip = null }) {
  try {
    await runSync(
      `INSERT INTO audit_log (admin_id, action, target_type, target_id, details, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [adminId, action, targetType, targetId, typeof details === "object" ? JSON.stringify(details) : details, ip]
    )
  } catch (err) {
    // Audit logging should never crash the request — log and continue
    console.error("[AUDIT] Failed to write audit log:", err.message)
  }
}
