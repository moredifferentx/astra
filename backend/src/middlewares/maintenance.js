import { getOne } from "../config/db.js"
import { verifyToken } from "../utils/jwt.js"

/**
 * Maintenance mode middleware.
 * When maintenance_mode is enabled in site_settings:
 *   - Admin users can access everything normally
 *   - Public settings/site endpoint is always allowed (so frontend can detect maintenance)
 *   - Auth endpoints (login/register) are always allowed (so admins can log in)
 *   - All other requests get a 503 response
 */
export async function maintenanceGuard(req, res, next) {
  try {
    // Always allow health check
    if (req.path === "/health") return next()

    // Always allow the site settings endpoint (so frontend knows about maintenance mode)
    if (req.path === "/api/settings/site" || req.path === "/api/settings/payment") return next()

    // Always allow auth endpoints (login, register, OAuth callback, me)
    if (req.path.startsWith("/api/auth")) return next()

    // Always allow serving uploaded static assets (favicon, logo, background)
    if (req.path.startsWith("/uploads")) return next()

    // Check maintenance mode from DB
    const settings = await getOne("SELECT maintenance_mode FROM site_settings ORDER BY id ASC LIMIT 1")
    const isMaintenanceOn = settings && Number(settings.maintenance_mode) === 1

    if (!isMaintenanceOn) return next()

    // Maintenance is ON — check if the user is an admin
    const header = req.headers.authorization
    if (header && header.startsWith("Bearer ")) {
      try {
        const token = header.slice(7)
        const payload = verifyToken(token)
        const user = await getOne("SELECT id, role FROM users WHERE id = ?", [payload.sub])
        if (user && user.role === "admin") {
          // Admin user — let them through
          req._maintenanceBypass = true
          return next()
        }
      } catch {
        // Invalid token — fall through to maintenance response
      }
    }

    // Non-admin or unauthenticated — block with 503
    return res.status(503).json({
      success: false,
      error: "maintenance",
      message: "Site is currently under maintenance. Please check back later."
    })
  } catch (error) {
    // If DB is not ready yet, let requests through
    console.warn("[Maintenance] Error checking maintenance mode:", error.message)
    return next()
  }
}
