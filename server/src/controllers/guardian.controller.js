const { z } = require("zod");
const User = require("../models/User");
const Device = require("../models/Device");
const SensorReading = require("../models/SensorReading");
const GpsPoint = require("../models/GpsPoint");
const Medicine = require("../models/Medicine");
const Alert = require("../models/Alert");
const { withStatus } = require("./medicine.controller");
const { HttpError } = require("../utils/http");

const linkSchema = z.object({ code: z.string().trim().min(4).max(32) });

async function summary(member) {
  const [device, latest, location, meds, openAlerts] = await Promise.all([
    Device.findOne({ assignedTo: member._id }).sort({ lastSeen: -1 }),
    SensorReading.findOne({ user: member._id }).sort({ timestamp: -1 }),
    GpsPoint.findOne({ user: member._id }).sort({ timestamp: -1 }),
    Medicine.find({ user: member._id, active: true }),
    Alert.countDocuments({ user: member._id, acknowledged: false }),
  ]);
  const medStatuses = meds.map(withStatus);
  return {
    id: String(member._id), name: member.name, role: member.role,
    device: device || null, latest: latest || null, location: location || null,
    pendingMedicines: medStatuses.filter((m) => m.status === "pending").length,
    missedMedicines: medStatuses.filter((m) => m.status === "missed").length,
    medicines: medStatuses,
    unacknowledgedAlerts: openAlerts,
  };
}

async function linkedUsers(req, res) {
  const members = await User.find({ guardians: req.user._id }).sort({ name: 1 });
  res.json(await Promise.all(members.map(summary)));
}
async function link(req, res) {
  const member = await User.findOne({ linkCode: req.body.code.toUpperCase() });
  if (!member || member.role === "guardian") throw new HttpError(404, "No kid or elderly account found for this code");
  if (!member.guardians.some((g) => String(g) === String(req.user._id))) {
    member.guardians.push(req.user._id);
    await member.save();
  }
  res.status(201).json(await summary(member));
}
async function unlink(req, res) {
  const r = await User.updateOne({ _id: req.params.userId, guardians: req.user._id }, { $pull: { guardians: req.user._id } });
  if (!r.modifiedCount) throw new HttpError(404, "User is not linked to you");
  res.status(204).end();
}
module.exports = { linkSchema, linkedUsers, link, unlink };
