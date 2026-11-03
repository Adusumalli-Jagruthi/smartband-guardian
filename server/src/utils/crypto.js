const crypto = require("crypto");
const env = require("../config/env");

/** AES-256-GCM. Output: iv.tag.ciphertext (base64). */
function encrypt(plain) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", env.encryptionKey, iv);
  const data = Buffer.concat([c.update(String(plain), "utf8"), c.final()]);
  return [iv, c.getAuthTag(), data].map((b) => b.toString("base64")).join(".");
}
function decrypt(payload) {
  const [iv, tag, data] = payload.split(".").map((s) => Buffer.from(s, "base64"));
  const d = crypto.createDecipheriv("aes-256-gcm", env.encryptionKey, iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(data), d.final()]).toString("utf8");
}
const mask = (plain) => (plain ? `••••${String(plain).slice(-4)}` : "");
const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");
const randomToken = (bytes = 24) => crypto.randomBytes(bytes).toString("hex");
const safeEqual = (a, b) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};
module.exports = { encrypt, decrypt, mask, sha256, randomToken, safeEqual };
