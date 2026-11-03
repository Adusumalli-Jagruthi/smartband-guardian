const SensorReading = require("../models/SensorReading");
const { assertAccess } = require("../middleware/auth");

async function latest(req, res) {
  await assertAccess(req.user, req.params.userId);
  res.json(await SensorReading.findOne({ user: req.params.userId }).sort({ timestamp: -1 }));
}
async function history(req, res) {
  await assertAccess(req.user, req.params.userId);
  const hours = req.query.range === "week" ? 24 * 7 : 24;
  const since = new Date(Date.now() - hours * 3600 * 1000);
  res.json(await SensorReading.find({ user: req.params.userId, timestamp: { $gte: since } }).sort({ timestamp: 1 }).limit(5000));
}
module.exports = { latest, history };
