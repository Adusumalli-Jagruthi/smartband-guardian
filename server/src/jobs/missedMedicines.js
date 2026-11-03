const env = require("../config/env");
const Medicine = require("../models/Medicine");
const { raiseAlert } = require("../services/notify");
const { localNow, toMinutes } = require("../utils/time");

/** Every 5 minutes: mark doses past their grace period as missed and alert guardians once per day. */
async function run() {
  const now = localNow();
  const meds = await Medicine.find({ active: true, "history.date": { $ne: now.date } });
  for (const m of meds) {
    if (now.minutes <= toMinutes(m.time) + env.medMissedGraceMinutes) continue;
    m.history.push({ date: now.date, status: "missed", at: new Date() });
    await m.save();
    await raiseAlert({ userId: m.user, type: "medicine", message: `Missed ${m.name} (${m.dosage}) scheduled at ${m.time}` });
  }
}
function start() {
  const tick = () => run().catch((e) => console.error("missed-medicine job:", e.message));
  tick();
  return setInterval(tick, 5 * 60 * 1000);
}
module.exports = { start, run };
