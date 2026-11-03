const IntegrationConfig = require("../models/IntegrationConfig");
const { decrypt } = require("../utils/crypto");

/** Returns { enabled, fields, secrets (decrypted), doc } or null. Server-side use only. */
async function loadDecrypted(ownerId, name) {
  const doc = await IntegrationConfig.findOne({ owner: ownerId, name });
  if (!doc) return null;
  const secrets = {};
  for (const [k, v] of doc.secrets) { try { secrets[k] = decrypt(v); } catch { /* key rotated / corrupt */ } }
  return { enabled: doc.enabled, fields: Object.fromEntries(doc.fields), secrets, doc };
}
module.exports = { loadDecrypted };
