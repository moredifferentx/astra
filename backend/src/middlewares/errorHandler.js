import crypto from "crypto"

export function errorHandler(err, req, res, next) {
  const requestId = crypto.randomUUID().slice(0, 8)

  if (err.name === "ZodError") {
    return res.status(400).json({ success: false, error: "Validation failed", message: "Validation failed", requestId, data: { details: err.errors } })
  }

  if (err.statusCode) {
    return res.status(err.statusCode).json({ success: false, error: err.message, message: err.message, requestId, data: {} })
  }

  // Log full error server-side with request ID for correlation
  console.error(`[ERROR] [${requestId}] ${req.method} ${req.path}:`, err.message)
  if (err.stack) console.error(`[ERROR] [${requestId}] Stack:`, err.stack)
  res.status(500).json({ success: false, error: "Internal server error", message: "Internal server error", requestId, data: {} })
}
