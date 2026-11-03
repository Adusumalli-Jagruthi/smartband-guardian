const mongoose = require("mongoose");
const json = require("./_json");

/** Pulse sensor (BPM) + MPU6050 (steps/activity) + battery. No SpO2, no temperature — by design. */
const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    device: { type: mongoose.Schema.Types.ObjectId, ref: "Device" },
    timestamp: { type: Date, default: Date.now },
    heartRate: { type: Number, min: 20, max: 250, default: null },
    steps: { type: Number, min: 0, default: null },
    activity: { type: String, enum: ["resting", "walking", "running", "fall", null], default: null },
    battery: { type: Number, min: 0, max: 100, default: null },
  },
  { strict: "throw", toJSON: json(["user", "device", "id"]) },
);
schema.index({ user: 1, timestamp: -1 });
module.exports = mongoose.model("SensorReading", schema);
