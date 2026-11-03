const { z } = require("zod");
const IntegrationConfig = require("../models/IntegrationConfig");
const { loadDecrypted } = require("../services/integrationStore");
const telegram = require("../services/telegram");
const thingspeak = require("../services/thingspeak");
const ai = require("../services/ai");
const { encrypt, decrypt, mask } = require("../utils/crypto");
const { HttpError } = require("../utils/http");

const SPEC = {
  thingspeak: { fields: ["channelId"], secrets: ["readApiKey", "writeApiKey"] },
  telegram: { fields: ["chatId"], secrets: ["botToken"] },
  ai: { fields: ["provider", "model", "baseUrl"], secrets: ["apiKey"] },
};
const PREF_KEYS = ["pushNotifications", "emailAlerts", "fallDetection", "heartRateAlerts"];

const saveSchema = z.object({
  enabled: z.boolean(),
  fields: z.record(z.string().max(300)).default({}),
  secrets: z.record(z.string().max(500)).default({}),
});
const prefsSchema = z.record(z.boolean());

function spec(name) {
  const s = SPEC[name];
  if (!s) throw new HttpError(404, "Unknown integration");
  return s;
}
function present(doc) {
  if (!doc) return { configured: false, enabled: false, status: "not_configured", fields: {}, maskedSecrets: {}, lastSuccessAt: null, lastMessage: null };
  const maskedSecrets = {};
  for (const [k, v] of doc.secrets) { try { maskedSecrets[k] = mask(decrypt(v)); } catch { maskedSecrets[k] = "••••"; } }
  return { configured: true, enabled: doc.enabled, status: doc.status, fields: Object.fromEntries(doc.fields), maskedSecrets, lastSuccessAt: doc.lastSuccessAt, lastMessage: doc.lastMessage };
}

async function getConfig(req, res) {
  spec(req.params.name);
  res.json(present(await IntegrationConfig.findOne({ owner: req.user._id, name: req.params.name })));
}
/** Omitted secrets keep their stored value; empty strings are ignored. */
async function saveConfig(req, res) {
  const s = spec(req.params.name);
  const doc = (await IntegrationConfig.findOne({ owner: req.user._id, name: req.params.name })) || new IntegrationConfig({ owner: req.user._id, name: req.params.name });
  for (const k of s.fields) if (req.body.fields[k] !== undefined) doc.fields.set(k, req.body.fields[k].trim());
  for (const k of s.secrets) if (req.body.secrets[k]?.trim()) doc.secrets.set(k, encrypt(req.body.secrets[k].trim()));
  if (req.params.name === "ai" && doc.fields.get("provider") && !["nvidia_nim", "groq", "other"].includes(doc.fields.get("provider"))) throw new HttpError(400, "Unknown AI provider");
  doc.enabled = req.body.enabled;
  if (doc.isModified("fields") || doc.isModified("secrets")) doc.status = "disconnected"; // must re-test
  await doc.save();
  res.json(present(doc));
}
async function removeConfig(req, res) {
  spec(req.params.name);
  await IntegrationConfig.deleteOne({ owner: req.user._id, name: req.params.name });
  res.status(204).end();
}
/** Real calls to the provider — results are never simulated. */
async function testConfig(req, res) {
  spec(req.params.name);
  const cfg = await loadDecrypted(req.user._id, req.params.name);
  if (!cfg) throw new HttpError(404, "Save the configuration before testing");
  let ok = true, message;
  try {
    if (req.params.name === "thingspeak") {
      const r = await thingspeak.verifyChannel({ channelId: cfg.fields.channelId, readApiKey: cfg.secrets.readApiKey });
      message = `Connected to channel "${r.name}"${r.lastEntryAt ? `, last entry ${r.lastEntryAt}` : ", no entries yet"}`;
    } else if (req.params.name === "telegram") {
      await telegram.sendMessage({ botToken: cfg.secrets.botToken, chatId: cfg.fields.chatId, text: "✅ SmartBand test notification — alerts will arrive in this chat." });
      message = "Test message delivered to Telegram";
    } else {
      const provider = cfg.fields.provider || "nvidia_nim";
      const base = ai.PROVIDERS[provider]({ key: cfg.secrets.apiKey, model: cfg.fields.model, baseUrl: cfg.fields.baseUrl });
      if (!cfg.secrets.apiKey) throw new Error("API key is not set");
      await ai.callProvider(base, [{ role: "user", content: "Reply with the single word: OK" }]);
      message = `${provider} responded using model ${base.model}`;
    }
  } catch (e) { ok = false; message = e.message; }
  Object.assign(cfg.doc, { status: ok ? "connected" : "error", lastMessage: message, ...(ok ? { lastSuccessAt: new Date() } : {}) });
  await cfg.doc.save();
  res.json({ ok, message, testedAt: new Date().toISOString() });
}

/** Simple alert preference toggles (Settings page). */
const getPrefs = (req, res) => res.json(Object.fromEntries(PREF_KEYS.map((k) => [k, !!req.user.preferences.get(k)])));
async function updatePrefs(req, res) {
  for (const k of PREF_KEYS) if (typeof req.body[k] === "boolean") req.user.preferences.set(k, req.body[k]);
  await req.user.save();
  getPrefs(req, res);
}
module.exports = { saveSchema, prefsSchema, getConfig, saveConfig, removeConfig, testConfig, getPrefs, updatePrefs };
