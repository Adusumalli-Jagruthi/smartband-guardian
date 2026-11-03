const { z } = require("zod");
const User = require("../models/User");
const { assertAccess } = require("../middleware/auth");
const { HttpError } = require("../utils/http");

const updateSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().max(30).optional(),
  language: z.string().max(10).optional(),
}).strip();

async function get(req, res) {
  await assertAccess(req.user, req.params.id);
  res.json(await User.findById(req.params.id));
}
async function update(req, res) {
  if (String(req.user._id) !== req.params.id) throw new HttpError(403, "You can only edit your own profile");
  Object.assign(req.user, req.body);
  await req.user.save();
  res.json(req.user);
}
module.exports = { updateSchema, get, update };
