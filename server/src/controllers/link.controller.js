const crypto = require("crypto");
const User = require("../models/User");
const LinkRequest = require("../models/LinkRequest");
const { sha256 } = require("../utils/crypto");
const { HttpError } = require("../utils/http");

const CODE_TTL_MS = 15 * 60 * 1000;
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
const newCode = () => Array.from(crypto.randomBytes(8), (b) => ALPHABET[b % ALPHABET.length]).join("");
const normalize = (c) => String(c).toUpperCase().replace(/[^A-Z0-9]/g, "");

const person = (u) => ({ id: String(u._id), name: u.name, email: u.email, role: u.role });
const reqView = (r) => ({
  id: String(r._id), status: r.status, createdAt: r.createdAt, decidedAt: r.decidedAt,
  guardian: r.guardian?._id ? person(r.guardian) : undefined,
  member: r.member?._id ? person(r.member) : undefined,
});

/* ---------- Member (kid / elderly) ---------- */
async function generateCode(req, res) {
  let code;
  for (let i = 0; i < 5; i++) { code = newCode(); if (!(await User.exists({ linkCodeHash: sha256(code) }))) break; }
  const u = req.user;
  u.linkCodeHash = sha256(code); u.linkCodeExpiresAt = new Date(Date.now() + CODE_TTL_MS); u.linkCodeUsedAt = null;
  await u.save();
  // Plain code is returned exactly once; only the hash is stored.
  res.status(201).json({ code, expiresAt: u.linkCodeExpiresAt });
}
async function codeStatus(req, res) {
  const u = req.user;
  const state = !u.linkCodeHash ? "none" : u.linkCodeUsedAt ? "used" : u.linkCodeExpiresAt < new Date() ? "expired" : "active";
  res.json({ state, expiresAt: u.linkCodeExpiresAt, usedAt: u.linkCodeUsedAt });
}
async function memberOverview(req, res) {
  const [pending, guardians] = await Promise.all([
    LinkRequest.find({ member: req.user._id, status: "pending" }).populate("guardian", "name email role").sort({ createdAt: -1 }),
    User.find({ _id: { $in: req.user.guardians } }).select("name email role"),
  ]);
  res.json({ pending: pending.map(reqView), guardians: guardians.map(person) });
}
async function decide(req, res, status) {
  if (!/^[a-f\d]{24}$/i.test(req.params.id)) throw new HttpError(400, "Invalid request id");
  const r = await LinkRequest.findOne({ _id: req.params.id, member: req.user._id, status: "pending" }).populate("guardian", "name email role");
  if (!r) throw new HttpError(404, "Pending request not found");
  r.status = status; r.decidedAt = new Date();
  await r.save();
  if (status === "approved") await User.updateOne({ _id: req.user._id }, { $addToSet: { guardians: r.guardian._id } });
  res.json(reqView(r));
}
const approve = (req, res) => decide(req, res, "approved");
const reject = (req, res) => decide(req, res, "rejected");
async function removeGuardian(req, res) {
  const r = await User.updateOne({ _id: req.user._id, guardians: req.params.guardianId }, { $pull: { guardians: req.params.guardianId } });
  if (!r.modifiedCount) throw new HttpError(404, "Guardian is not linked to you");
  await LinkRequest.updateMany({ member: req.user._id, guardian: req.params.guardianId, status: "approved" }, { status: "rejected", decidedAt: new Date() });
  res.status(204).end();
}

/* ---------- Guardian ---------- */
async function requestWithCode(req, res) {
  const code = normalize(req.body.code);
  const member = code ? await User.findOne({ linkCodeHash: sha256(code) }) : null;
  if (!member || member.role === "guardian") throw new HttpError(404, "Invalid linking code. Check the code and try again.");
  if (member.linkCodeUsedAt) throw new HttpError(409, "This code has already been used. Ask for a new code.");
  if (!member.linkCodeExpiresAt || member.linkCodeExpiresAt < new Date()) throw new HttpError(410, "This code has expired. Ask for a new code.");
  if (member.guardians.some((g) => String(g) === String(req.user._id))) throw new HttpError(409, `You are already linked to ${member.name}.`);
  // Atomically consume the code so it can never be used twice.
  const consumed = await User.updateOne({ _id: member._id, linkCodeHash: member.linkCodeHash, linkCodeUsedAt: null }, { linkCodeUsedAt: new Date() });
  if (!consumed.modifiedCount) throw new HttpError(409, "This code has already been used. Ask for a new code.");
  const existing = await LinkRequest.findOne({ guardian: req.user._id, member: member._id, status: "pending" });
  const r = existing || (await LinkRequest.create({ guardian: req.user._id, member: member._id }));
  await r.populate("member", "name email role");
  res.status(201).json(reqView(r));
}
async function guardianRequests(req, res) {
  const list = await LinkRequest.find({ guardian: req.user._id, status: { $in: ["pending", "rejected"] } })
    .populate("member", "name email role").sort({ createdAt: -1 }).limit(20);
  res.json(list.map(reqView));
}

module.exports = { generateCode, codeStatus, memberOverview, approve, reject, removeGuardian, requestWithCode, guardianRequests, normalize };
