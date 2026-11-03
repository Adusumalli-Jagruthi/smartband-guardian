const r = require("express").Router();
const c = require("../controllers/ingest.controller");
const validate = require("../middleware/validate");
const { ingestLimiter } = require("../middleware/rateLimit");
const { asyncHandler: a } = require("../utils/http");
// ESP32 → POST /api/ingest with headers X-Device-Id and X-Device-Key
r.post("/", ingestLimiter, c.deviceAuth, validate(c.ingestSchema), a(c.ingest));
module.exports = r;
