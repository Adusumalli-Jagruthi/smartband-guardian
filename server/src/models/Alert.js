const mongoose = require("mongoose");
const json = require("./_json");

const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["sos", "fall", "heart_rate", "medicine", "device"], required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    acknowledged: { type: Boolean, default: false },
    acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    location: { lat: Number, lng: Number },
  },
  { toJSON: json(["acknowledgedBy"]) },
);
schema.index({ user: 1, timestamp: -1 });
module.exports = mongoose.model("Alert", schema);
