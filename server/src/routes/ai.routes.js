const r = require("express").Router();
const c = require("../controllers/ai.controller");
const validate = require("../middleware/validate");
const { requireAuth } = require("../middleware/auth");
const { aiLimiter } = require("../middleware/rateLimit");
const { asyncHandler: a } = require("../utils/http");
r.post("/chat", requireAuth, aiLimiter, validate(c.chatSchema), a(c.chat));
module.exports = r;
