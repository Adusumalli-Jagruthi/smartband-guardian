require("dotenv").config();

const required = ["MONGODB_URI", "JWT_SECRET", "ENCRYPTION_KEY"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  process.exit(1);
}
if (!/^[0-9a-fA-F]{64}$/.test(process.env.ENCRYPTION_KEY)) {
  console.error("ENCRYPTION_KEY must be 64 hex characters (32 bytes).");
  process.exit(1);
}

const num = (k, d) => (process.env[k] ? Number(process.env[k]) : d);

module.exports = {
  port: num("PORT", 5000),
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigins: (process.env.CORS_ORIGIN || "http://localhost:8080").split(",").map((s) => s.trim()).filter(Boolean),
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  encryptionKey: Buffer.from(process.env.ENCRYPTION_KEY, "hex"),
  ai: {
    primary: process.env.AI_PRIMARY || "nvidia_nim",
    nvidia: { key: process.env.NVIDIA_API_KEY, model: process.env.NVIDIA_MODEL || "meta/llama-3.1-70b-instruct", baseUrl: process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1" },
    groq: { key: process.env.GROQ_API_KEY, model: process.env.GROQ_MODEL || "llama-3.1-8b-instant", baseUrl: process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1" },
  },
  hrMin: num("HR_MIN", 40),
  hrMax: num("HR_MAX", 130),
  deviceOfflineSeconds: num("DEVICE_OFFLINE_SECONDS", 120),
  medMissedGraceMinutes: num("MED_MISSED_GRACE_MINUTES", 60),
  timezone: process.env.APP_TIMEZONE || "Asia/Kolkata",
};
