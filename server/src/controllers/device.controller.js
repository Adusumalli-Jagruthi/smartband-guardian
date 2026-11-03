const { z } = require("zod");
const Device = require("../models/Device");
const { assertAccess, accessibleUserIds } = require("../middleware/auth");
const { HttpError } = require("../utils/http");
const { sha256, randomToken } = require("../utils/crypto");

const pairSchema = z.object({
  deviceId: z.string().trim().min(3).max(64),
  name: z.string().trim().min(1).max(60),
  assignedTo: z.string().regex(/^[a-f\d]{24}$/i).optional(),
});

async function visibleFilter(user) {
  const ids = await accessibleUserIds(user);
  return { $or: [{ owner: user._id }, { assignedTo: { $in: ids } }] };
}
async function findVisible(user, id) {
  const device = await Device.findOne({ _id: id, ...(await visibleFilter(user)) });
  if (!device) throw new HttpError(404, "Device not found");
  return device;
}

const list = async (req, res) => res.json(await Device.find(await visibleFilter(req.user)).sort({ createdAt: -1 }));
const get = async (req, res) => res.json(await findVisible(req.user, req.params.id));

/** Returns the device ingest key ONCE — flash it into the ESP32 firmware. */
async function pair(req, res) {
  const assignedTo = req.body.assignedTo || req.user._id;
  await assertAccess(req.user, assignedTo);
  const deviceKey = randomToken(24);
  const device = await Device.create({ ...req.body, assignedTo, owner: req.user._id, keyHash: sha256(deviceKey) });
  res.status(201).json({ ...device.toJSON(), deviceKey });
}
async function remove(req, res) {
  const device = await findVisible(req.user, req.params.id);
  if (String(device.owner) !== String(req.user._id) && String(device.assignedTo) !== String(req.user._id)) throw new HttpError(403, "Only the owner can remove this device");
  await device.deleteOne();
  res.status(204).end();
}
/** Queued; delivered to the band in its next ingest response. */
async function testBuzzer(req, res) {
  const device = await findVisible(req.user, req.params.id);
  if (device.status !== "online") throw new HttpError(409, "Device not connected");
  device.buzzerPending = true;
  await device.save();
  res.status(202).json({ queued: true });
}
module.exports = { pairSchema, list, get, pair, remove, testBuzzer };
