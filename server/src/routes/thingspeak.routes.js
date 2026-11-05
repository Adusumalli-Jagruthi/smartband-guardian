const r = require("express").Router();
const c = require("../controllers/thingspeak.controller");
const { requireAuth } = require("../middleware/auth");
const { asyncHandler: a } = require("../utils/http");
r.use(requireAuth);
r.get("/:userId/feeds", a(c.feeds));
module.exports = r;
