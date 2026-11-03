const { ZodError } = require("zod");
const env = require("../config/env");

const notFound = (req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });

// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) return res.status(400).json({ message: "Validation failed", errors: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })) });
  if (err.name === "CastError") return res.status(400).json({ message: "Invalid identifier" });
  if (err.name === "ValidationError" || err.name === "StrictModeError") return res.status(400).json({ message: err.message });
  if (err.code === 11000) return res.status(409).json({ message: `Already exists: ${Object.keys(err.keyValue || {}).join(", ")}` });
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ message: status >= 500 && env.nodeEnv === "production" ? "Internal server error" : err.message });
}
module.exports = { notFound, errorHandler };
