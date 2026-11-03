const { z } = require("zod");
const env = require("../config/env");
const Medicine = require("../models/Medicine");
const { assertAccess } = require("../middleware/auth");
const { HttpError } = require("../utils/http");
const { localNow, toMinutes } = require("../utils/time");

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "time must be HH:mm");
const createSchema = z.object({ name: z.string().trim().min(1).max(100), dosage: z.string().trim().min(1).max(100), time });
const updateSchema = createSchema.partial().extend({ active: z.boolean().optional() });
const confirmSchema = z.object({ status: z.enum(["taken", "missed"]).default("taken") });

/** Today's status: logged value, else "missed" once the grace period has passed, else "pending". */
function withStatus(m) {
  const now = localNow();
  const log = m.history.find((h) => h.date === now.date);
  const status = log?.status ?? (now.minutes > toMinutes(m.time) + env.medMissedGraceMinutes ? "missed" : "pending");
  return { ...m.toJSON(), status, confirmedAt: log?.status === "taken" ? log.at : null };
}
async function findAccessible(user, id) {
  const m = await Medicine.findById(id);
  if (!m) throw new HttpError(404, "Medicine not found");
  await assertAccess(user, m.user);
  return m;
}

async function list(req, res) {
  await assertAccess(req.user, req.params.userId);
  const meds = await Medicine.find({ user: req.params.userId, active: true }).sort({ time: 1 });
  res.json(meds.map(withStatus));
}
async function history(req, res) {
  await assertAccess(req.user, req.params.userId);
  const meds = await Medicine.find({ user: req.params.userId }).lean();
  const rows = meds.flatMap((m) => m.history.map((h) => ({ medicineId: m._id, name: m.name, dosage: m.dosage, time: m.time, ...h })));
  res.json(rows.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 500));
}
async function create(req, res) {
  await assertAccess(req.user, req.params.userId);
  const m = await Medicine.create({ ...req.body, user: req.params.userId });
  res.status(201).json(withStatus(m));
}
async function update(req, res) {
  const m = await findAccessible(req.user, req.params.id);
  Object.assign(m, req.body);
  await m.save();
  res.json(withStatus(m));
}
/** Self-reported by the patient (or their guardian) for today. */
async function confirm(req, res) {
  const m = await findAccessible(req.user, req.params.id);
  const { date } = localNow();
  m.history = m.history.filter((h) => h.date !== date);
  m.history.push({ date, status: req.body.status, at: new Date() });
  await m.save();
  res.json(withStatus(m));
}
async function remove(req, res) {
  const m = await findAccessible(req.user, req.params.id);
  await m.deleteOne();
  res.status(204).end();
}
module.exports = { createSchema, updateSchema, confirmSchema, withStatus, list, history, create, update, confirm, remove };
