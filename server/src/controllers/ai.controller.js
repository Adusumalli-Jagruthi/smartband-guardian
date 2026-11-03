const { z } = require("zod");
const ai = require("../services/ai");
const User = require("../models/User");
const { loadDecrypted } = require("../services/integrationStore");

const chatSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  language: z.string().max(20).default("en-IN"),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) })).max(30).default([]),
});

/** Uses the caller's own AI config, else their guardian's, else server env keys. */
async function resolveOverride(user) {
  const owners = [user._id, ...((await User.findById(user._id).select("guardians").lean())?.guardians || [])];
  for (const id of owners) {
    const cfg = await loadDecrypted(id, "ai");
    if (cfg?.enabled && cfg.secrets.apiKey) return { provider: cfg.fields.provider || "nvidia_nim", key: cfg.secrets.apiKey, model: cfg.fields.model, baseUrl: cfg.fields.baseUrl };
  }
  return undefined;
}

async function chat(req, res) {
  const r = await ai.chat({ ...req.body, role: req.user.role, override: await resolveOverride(req.user) });
  res.json({ reply: r.reply, language: r.language });
}
module.exports = { chatSchema, chat };
