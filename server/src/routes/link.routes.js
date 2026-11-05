const r = require("express").Router();
const c = require("../controllers/link.controller");
const { requireAuth, requireRole } = require("../middleware/auth");
const { asyncHandler: a } = require("../utils/http");
// Member-only: kid/elderly manage their own code, requests and guardians.
r.use(requireAuth, requireRole("kid", "elderly"));
r.get("/code", a(c.codeStatus));
r.post("/code", a(c.generateCode));
r.get("/overview", a(c.memberOverview));
r.post("/requests/:id/approve", a(c.approve));
r.post("/requests/:id/reject", a(c.reject));
r.delete("/guardians/:guardianId", a(c.removeGuardian));
module.exports = r;
