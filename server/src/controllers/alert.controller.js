const { z } = require("zod");
const Alert = require("../models/Alert");
const User = require("../models/User");
const { assertAccess, accessibleUserIds } = require("../middleware/auth");
const { raiseAlert } = require("../services/notify");
const { HttpError } = require("../utils/http");

const sosSchema = z.object({ userId: z.string().regex(/^[a-f\d]{24}$/i).optional(), lat: z.number().min(-90).max(90).optional(), lng: z.number().min(-180).max(180).optional() });

const shape = (a, names) => ({ ...a.toJSON(), userId: String(a.user), userName: names.get(String(a.user)), location: a.location?.lat != null ? a.location : null });

async function list(req, res) {
  let ids;
  if (req.query.userId) { await assertAccess(req.user, req.query.userId); ids = [req.query.userId]; }
  else ids = await accessibleUserIds(req.user);
  const alerts = await Alert.find({ user: { $in: ids } }).sort({ timestamp: -1 }).limit(200);
  const users = await User.find({ _id: { $in: ids } }).select("name").lean();
  const names = new Map(users.map((u) => [String(u._id), u.name]));
  res.json(alerts.map((a) => shape(a, names)));
}
async function acknowledge(req, res) {
  const a = await Alert.findById(req.params.id);
  if (!a) throw new HttpError(404, "Alert not found");
  await assertAccess(req.user, a.user);
  Object.assign(a, { acknowledged: true, acknowledgedBy: req.user._id });
  await a.save();
  res.json(shape(a, new Map()));
}
/** App SOS button. Uses phone coordinates if sent, else the band's last GPS fix. */
async function triggerSos(req, res) {
  const userId = req.body.userId || String(req.user._id);
  await assertAccess(req.user, userId);
  const location = req.body.lat != null && req.body.lng != null ? { lat: req.body.lat, lng: req.body.lng } : undefined;
  const a = await raiseAlert({ userId, type: "sos", message: `SOS triggered from the app by ${req.user.name}`, location });
  res.status(201).json(shape(a, new Map([[userId, req.user.name]])));
}
module.exports = { sosSchema, list, acknowledge, triggerSos };
