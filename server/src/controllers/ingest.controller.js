const { z } = require("zod");
const env = require("../config/env");
const Device = require("../models/Device");
const SensorReading = require("../models/SensorReading");
const GpsPoint = require("../models/GpsPoint");
const User = require("../models/User");
const { raiseAlert } = require("../services/notify");
const { loadDecrypted } = require("../services/integrationStore");
const thingspeak = require("../services/thingspeak");
const { HttpError } = require("../utils/http");
const { sha256, safeEqual } = require("../utils/crypto");

/** Only fields the hardware actually provides. Unknown keys (e.g. spo2, temperature) are rejected. */
const ingestSchema = z.object({
  heartRate: z.number().int().min(20).max(250).nullable().optional(),
  steps: z.number().int().min(0).nullable().optional(),
  activity: z.enum(["resting", "walking", "running", "fall"]).nullable().optional(),
  battery: z.number().min(0).max(100).nullable().optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  accuracy: z.number().min(0).optional(),
  sos: z.boolean().optional(),
  firmware: z.string().max(32).optional(),
}).strict();

async function deviceAuth(req, _res, next) {
  try {
    const id = req.get("x-device-id"), key = req.get("x-device-key");
    if (!id || !key) throw new HttpError(401, "Missing device credentials");
    const device = await Device.findOne({ deviceId: id });
    if (!device || !safeEqual(device.keyHash, sha256(key))) throw new HttpError(401, "Invalid device credentials");
    if (!device.assignedTo) throw new HttpError(409, "Device is not assigned to a user");
    req.device = device;
    next();
  } catch (e) { next(e); }
}

async function ingest(req, res) {
  const d = req.device, b = req.body, userId = d.assignedTo;
  const hasSensor = ["heartRate", "steps", "activity", "battery"].some((k) => b[k] !== undefined);
  const hasGps = b.lat !== undefined && b.lng !== undefined;

  if (hasSensor) await SensorReading.create({ user: userId, device: d._id, heartRate: b.heartRate ?? null, steps: b.steps ?? null, activity: b.activity ?? null, battery: b.battery ?? null });
  if (hasGps) await GpsPoint.create({ user: userId, device: d._id, lat: b.lat, lng: b.lng, accuracy: b.accuracy });

  const location = hasGps ? { lat: b.lat, lng: b.lng } : undefined;
  if (b.sos) await raiseAlert({ userId, type: "sos", message: "SOS button pressed on the band", location });
  if (b.activity === "fall") await raiseAlert({ userId, type: "fall", message: "Possible fall detected by motion sensor", location });
  if (typeof b.heartRate === "number" && (b.heartRate < env.hrMin || b.heartRate > env.hrMax))
    await raiseAlert({ userId, type: "heart_rate", message: `Heart rate ${b.heartRate} BPM is outside the safe range (${env.hrMin}–${env.hrMax})`, location });
  if (typeof b.battery === "number" && b.battery <= 10 && (d.battery === null || d.battery > 10))
    await raiseAlert({ userId, type: "device", message: `Band battery low (${b.battery}%)`, location });

  const buzzer = d.buzzerPending;
  Object.assign(d, { lastSeen: new Date(), buzzerPending: false, ...(b.battery != null ? { battery: b.battery } : {}), ...(b.firmware ? { firmware: b.firmware } : {}) });
  await d.save();

  // Mirror to ThingSpeak for the first linked owner that enabled it (best effort).
  const user = await User.findById(userId).lean();
  for (const ownerId of [userId, ...(user?.guardians || [])]) {
    const cfg = await loadDecrypted(ownerId, "thingspeak");
    if (!cfg?.enabled) continue;
    thingspeak.writeReading(cfg.secrets, b)
      .then(() => Object.assign(cfg.doc, { status: "connected", lastSuccessAt: new Date() }))
      .catch((e) => Object.assign(cfg.doc, { status: "error", lastMessage: e.message }))
      .finally(() => cfg.doc.save().catch(() => {}));
    break;
  }

  res.json({ ok: true, buzzer });
}
module.exports = { ingestSchema, deviceAuth, ingest };
