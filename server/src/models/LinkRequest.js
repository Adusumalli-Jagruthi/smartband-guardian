const mongoose = require("mongoose");
const json = require("./_json");

/** A guardian's request to monitor a member. Only "approved" adds the guardian to member.guardians (which grants access). */
const linkRequestSchema = new mongoose.Schema(
  {
    guardian: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    member: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
    decidedAt: { type: Date, default: null },
  },
  { timestamps: true, toJSON: json() },
);
module.exports = mongoose.model("LinkRequest", linkRequestSchema);
