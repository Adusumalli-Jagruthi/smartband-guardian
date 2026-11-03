const GpsPoint = require("../models/GpsPoint");
const { assertAccess } = require("../middleware/auth");
const { HttpError } = require("../utils/http");

async function latest(req, res) {
  await assertAccess(req.user, req.params.userId);
  res.json(await GpsPoint.findOne({ user: req.params.userId }).sort({ timestamp: -1 }));
}
/** ?date=YYYY-MM-DD (UTC day) — defaults to the last 24 hours. */
async function history(req, res) {
  await assertAccess(req.user, req.params.userId);
  let from = new Date(Date.now() - 24 * 3600 * 1000), to = new Date();
  if (req.query.date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(req.query.date)) throw new HttpError(400, "date must be YYYY-MM-DD");
    from = new Date(`${req.query.date}T00:00:00Z`);
    to = new Date(from.getTime() + 24 * 3600 * 1000);
  }
  res.json(await GpsPoint.find({ user: req.params.userId, timestamp: { $gte: from, $lt: to } }).sort({ timestamp: 1 }).limit(5000));
}
module.exports = { latest, history };
