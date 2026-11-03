const r = require("express").Router();
const c = require("../controllers/sensor.controller");
const { requireAuth } = require("../middleware/auth");
const { asyncHandler: a } = require("../utils/http");
r.use(requireAuth);
r.get("/:userId/latest", a(c.latest));
r.get("/:userId/history", a(c.history));
module.exports = r;
