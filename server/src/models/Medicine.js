const mongoose = require("mongoose");
const json = require("./_json");

const logSchema = new mongoose.Schema(
  { date: { type: String, required: true }, status: { type: String, enum: ["taken", "missed"], required: true }, at: { type: Date, default: Date.now } },
  { _id: false },
);

const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    dosage: { type: String, required: true, trim: true },
    time: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ }, // HH:mm, APP_TIMEZONE
    active: { type: Boolean, default: true },
    history: [logSchema],
  },
  { timestamps: true, toJSON: json(["history"]) },
);
module.exports = mongoose.model("Medicine", schema);
