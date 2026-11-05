const mongoose = require("mongoose");
const json = require("./_json");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["kid", "elderly", "guardian"], required: true },
    phone: { type: String, trim: true, maxlength: 30 },
    language: { type: String, default: "en-IN" },
    /** One-time guardian linking code: only its SHA-256 hash is stored. */
    linkCodeHash: { type: String, index: true, sparse: true },
    linkCodeExpiresAt: { type: Date, default: null },
    linkCodeUsedAt: { type: Date, default: null },
    guardians: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", index: true }],
    preferences: { type: Map, of: Boolean, default: {} },
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: json(["passwordHash", "tokenVersion", "guardians", "linkCodeHash", "linkCodeExpiresAt", "linkCodeUsedAt"]) },
);

module.exports = mongoose.model("User", userSchema);
