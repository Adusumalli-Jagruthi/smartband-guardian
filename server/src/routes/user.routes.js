const r = require("express").Router();
const c = require("../controllers/user.controller");
const validate = require("../middleware/validate");
const { requireAuth } = require("../middleware/auth");
const { asyncHandler: a } = require("../utils/http");
r.use(requireAuth);
r.get("/:id", a(c.get));
r.put("/:id", validate(c.updateSchema), a(c.update));
module.exports = r;
