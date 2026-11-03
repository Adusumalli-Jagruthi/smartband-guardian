const mongoose = require("mongoose");
const json = require("./_json");

const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    device: { type: mongoose.Schema.Types.ObjectId, ref: "Device" },
    lat: { type: Number, required: true, min: -90, max: 90 },
    lng: { type: Number, required: true, min: -180, max: 180 },
    accuracy: Number,
    timestamp: { type: Date, default: Date.now },
  },
  { toJSON: json(["user", "device", "id"]) },
);
schema.index({ user: 1, timestamp: -1 });
module.exports = mongoose.model("GpsPoint", schema);
