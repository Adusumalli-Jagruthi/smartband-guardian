const User = require("../models/User");
const { assertAccess } = require("../middleware/auth");
const { loadDecrypted } = require("../services/integrationStore");
const thingspeak = require("../services/thingspeak");

/** Credentials come from the member's own config or a linked guardian's. Keys never leave the server. */
async function feeds(req, res) {
  const userId = req.params.userId;
  await assertAccess(req.user, userId);
  const user = await User.findById(userId).lean();
  let cfg = null;
  for (const ownerId of [userId, ...(user?.guardians || [])]) {
    const c = await loadDecrypted(ownerId, "thingspeak");
    if (c?.enabled && c.fields.channelId) { cfg = c; break; }
  }
  if (!cfg) return res.json({ configured: false, feeds: [], lastEntryAt: null, channelName: null, error: null });
  const results = Number(req.query.results) || 100;
  try {
    const data = await thingspeak.readFeeds({ channelId: cfg.fields.channelId, readApiKey: cfg.secrets.readApiKey }, results);
    Object.assign(cfg.doc, { status: "connected", lastSuccessAt: new Date() });
    cfg.doc.save().catch(() => {});
    res.json({ configured: true, error: null, ...data });
  } catch (e) {
    Object.assign(cfg.doc, { status: "error", lastMessage: e.message });
    cfg.doc.save().catch(() => {});
    res.json({ configured: true, feeds: [], lastEntryAt: null, channelName: null, error: e.message });
  }
}
module.exports = { feeds };
