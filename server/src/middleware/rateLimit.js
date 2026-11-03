const rateLimit = require("express-rate-limit");
const mk = (windowMs, limit) => rateLimit({ windowMs, limit, standardHeaders: "draft-7", legacyHeaders: false, message: { message: "Too many requests, please slow down." } });
module.exports = {
  globalLimiter: mk(15 * 60 * 1000, 600),
  authLimiter: mk(15 * 60 * 1000, 20),
  aiLimiter: mk(60 * 1000, 20),
  ingestLimiter: mk(60 * 1000, 240),
};
