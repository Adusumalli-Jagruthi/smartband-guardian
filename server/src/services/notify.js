const Alert = require("../models/Alert");
const User = require("../models/User");
const GpsPoint = require("../models/GpsPoint");
const { loadDecrypted } = require("./integrationStore");
const telegram = require("./telegram");

const LABEL = { sos: "🆘 SOS", fall: "⚠️ Fall detected", heart_rate: "❤️ Abnormal heart rate", medicine: "💊 Missed medicine", device: "📟 Device" };

/** Creates an alert and forwards it to each linked guardian's Telegram (if enabled). Never throws on delivery failure. */
async function raiseAlert({ userId, type, message, location }) {
  if (location === undefined) {
    const last = await GpsPoint.findOne({ user: userId }).sort({ timestamp: -1 }).lean();
    location = last ? { lat: last.lat, lng: last.lng } : null;
  }
  const alert = await Alert.create({ user: userId, type, message, ...(location ? { location } : {}) });
  const user = await User.findById(userId).lean();
  const recipients = [...(user?.guardians || []), userId];
  await Promise.allSettled(recipients.map(async (ownerId) => {
    const cfg = await loadDecrypted(ownerId, "telegram");
    if (!cfg?.enabled) return;
    const loc = location ? `\n📍 https://maps.google.com/?q=${location.lat},${location.lng}` : "\n📍 Location unavailable";
    const text = `<b>${LABEL[type] || type}</b> — ${telegram.escape(user?.name || "SmartBand user")}\n${telegram.escape(message)}${loc}\n🕒 ${new Date().toLocaleString("en-IN")}`;
    try {
      await telegram.sendMessage({ botToken: cfg.secrets.botToken, chatId: cfg.fields.chatId, text });
      Object.assign(cfg.doc, { status: "connected", lastSuccessAt: new Date(), lastMessage: `Sent ${type} alert` });
    } catch (e) {
      Object.assign(cfg.doc, { status: "error", lastMessage: e.message });
    }
    await cfg.doc.save();
  }));
  return alert;
}
module.exports = { raiseAlert };
