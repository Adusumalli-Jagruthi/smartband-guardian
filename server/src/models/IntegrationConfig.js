const mongoose = require("mongoose");

/** Secrets are stored AES-256-GCM encrypted and never returned in full. */
const schema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, enum: ["thingspeak", "telegram", "ai"], required: true },
    enabled: { type: Boolean, default: false },
    fields: { type: Map, of: String, default: {} },
    secrets: { type: Map, of: String, default: {} }, // encrypted values
    status: { type: String, enum: ["connected", "disconnected", "error", "not_configured"], default: "disconnected" },
    lastSuccessAt: { type: Date, default: null },
    lastMessage: { type: String, default: null },
  },
  { timestamps: true },
);
schema.index({ owner: 1, name: 1 }, { unique: true });
module.exports = mongoose.model("IntegrationConfig", schema);
