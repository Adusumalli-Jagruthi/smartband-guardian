const env = require("../config/env");

const LANGUAGES = {
  "en-IN": "English", "te-IN": "Telugu", "ta-IN": "Tamil", "hi-IN": "Hindi", "ml-IN": "Malayalam",
  "bn-IN": "Bengali", "mr-IN": "Marathi", "gu-IN": "Gujarati", "kn-IN": "Kannada",
};
const resolveLanguage = (code) => {
  if (LANGUAGES[code]) return { code, name: LANGUAGES[code] };
  const found = Object.entries(LANGUAGES).find(([c, n]) => c.startsWith(`${code}-`) || n.toLowerCase() === String(code).toLowerCase());
  return found ? { code: found[0], name: found[1] } : { code: "en-IN", name: "English" };
};

const EMERGENCY = /(chest pain|can'?t breathe|cannot breathe|not breathing|unconscious|heart attack|stroke|severe bleeding|suicid|overdose|fainted|seizure)/i;

const systemPrompt = (lang, role) => `You are SmartBand Buddy, a warm, patient assistant inside a safety wristband app for ${role === "kid" ? "school children" : role === "elderly" ? "elderly people" : "families and guardians"}.
Always reply in ${lang}, using simple, short sentences suitable for voice playback.
Safety rules (never break them):
- You are not a doctor. Never diagnose, never prescribe or change medicine doses, never give emergency medical treatment instructions.
- For any possible emergency, tell the user to press the SOS button on the band or in the app, and to call 112 (India emergency) or a nearby adult/guardian immediately.
- For health questions give general wellbeing tips only and recommend talking to a doctor or guardian.
- You do not know live sensor readings unless they are given to you; never invent heart rate, location or activity values.
- Do not ask for passwords, OTPs or bank details.`;

const PROVIDERS = {
  nvidia_nim: (o) => ({ baseUrl: o.baseUrl || env.ai.nvidia.baseUrl, key: o.key || env.ai.nvidia.key, model: o.model || env.ai.nvidia.model }),
  groq: (o) => ({ baseUrl: o.baseUrl || env.ai.groq.baseUrl, key: o.key || env.ai.groq.key, model: o.model || env.ai.groq.model }),
  other: (o) => ({ baseUrl: o.baseUrl, key: o.key, model: o.model }),
};

async function callProvider({ baseUrl, key, model }, messages) {
  if (!baseUrl || !key || !model) throw new Error("provider not configured");
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, temperature: 0.4, max_tokens: 400 }),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`[${res.status}] ${(await res.text()).slice(0, 300)}`);
  const body = await res.json();
  const text = body.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("empty response");
  return text;
}

/**
 * override: optional { provider, key, model, baseUrl } from a saved AI integration.
 * Tries the chosen/primary provider first, then the other as fallback.
 */
async function chat({ message, language, history = [], role, override }) {
  const lang = resolveLanguage(language);
  const primary = override?.provider || env.ai.primary;
  const order = [primary, ...["nvidia_nim", "groq"].filter((p) => p !== primary)];
  const messages = [
    { role: "system", content: systemPrompt(lang.name, role) },
    ...history.slice(-10).map((h) => ({ role: h.role, content: String(h.content).slice(0, 2000) })),
    { role: "user", content: message },
  ];
  const errors = [];
  for (const p of order) {
    const cfg = PROVIDERS[p]?.(p === primary && override ? override : {});
    if (!cfg) continue;
    try {
      let reply = await callProvider(cfg, messages);
      if (EMERGENCY.test(message)) reply = `⚠️ If this is an emergency, press SOS now and call 112.\n\n${reply}`;
      return { reply, language: lang.code, provider: p };
    } catch (e) { errors.push(`${p}: ${e.message}`); }
  }
  const err = new Error(`AI assistant unavailable. ${errors.join(" | ")}`);
  err.status = 503;
  throw err;
}
module.exports = { chat, callProvider, PROVIDERS, LANGUAGES, resolveLanguage };
