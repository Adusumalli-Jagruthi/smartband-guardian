const mongoose = require("mongoose");
const json = require("./_json");
const env = require("../config/env");

const deviceSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true, unique: true, trim: true }, // ESP32 hardware ID / MAC
    name: { type: String, required: true, trim: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    keyHash: { type: String, required: true }, // sha256 of the device ingest key
    battery: { type: Number, min: 0, max: 100, default: null },
    lastSeen: { type: Date, default: null },
    firmware: String,
    buzzerPending: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: json(["keyHash", "buzzerPending", "owner"]) },
);

deviceSchema.virtual("status").get(function () {
  return this.lastSeen && Date.now() - this.lastSeen.getTime() < env.deviceOfflineSeconds * 1000 ? "online" : "offline";
});

module.exports = mongoose.model("Device", deviceSchema);
