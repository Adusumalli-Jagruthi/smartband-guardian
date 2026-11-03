const mongoose = require("mongoose");
const json = require("./_json");
const { randomToken } = require("../utils/crypto");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["kid", "elderly", "guardian"], required: true },
    phone: { type: String, trim: true, maxlength: 30 },
    language: { type: String, default: "en-IN" },
    /** Members share this code with a guardian to be linked. */
    linkCode: { type: String, unique: true, sparse: true },
    guardians: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", index: true }],
    preferences: { type: Map, of: Boolean, default: {} },
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: json(["passwordHash", "tokenVersion", "guardians"]) },
);

userSchema.pre("save", function (next) {
  if (this.role !== "guardian" && !this.linkCode) this.linkCode = randomToken(4).toUpperCase();
  next();
});

module.exports = mongoose.model("User", userSchema);
