const jwt = require("jsonwebtoken");
const env = require("../config/env");
const User = require("../models/User");
const { HttpError, asyncHandler } = require("../utils/http");

const signToken = (user) => jwt.sign({ sub: user.id, role: user.role, v: user.tokenVersion }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

const requireAuth = asyncHandler(async (req, _res, next) => {
  const h = req.headers.authorization || "";
  if (!h.startsWith("Bearer ")) throw new HttpError(401, "Authentication required");
  let payload;
  try { payload = jwt.verify(h.slice(7), env.jwtSecret); } catch { throw new HttpError(401, "Invalid or expired token"); }
  const user = await User.findById(payload.sub);
  if (!user || user.tokenVersion !== payload.v) throw new HttpError(401, "Session expired");
  req.user = user;
  next();
});

const requireRole = (...roles) => (req, _res, next) =>
  roles.includes(req.user.role) ? next() : next(new HttpError(403, "Not allowed for your role"));

/** Self, or a guardian linked to the target user. */
async function canAccessUser(actor, targetId) {
  if (String(actor._id) === String(targetId)) return true;
  if (actor.role !== "guardian") return false;
  return !!(await User.exists({ _id: targetId, guardians: actor._id }));
}
async function assertAccess(actor, targetId) {
  if (!targetId || !/^[a-f\d]{24}$/i.test(String(targetId))) throw new HttpError(400, "Invalid user id");
  if (!(await canAccessUser(actor, targetId))) throw new HttpError(403, "You do not have access to this user");
}
/** IDs the actor may see: self + linked members (guardians). */
async function accessibleUserIds(actor) {
  if (actor.role !== "guardian") return [actor._id];
  const members = await User.find({ guardians: actor._id }).select("_id").lean();
  return [actor._id, ...members.map((m) => m._id)];
}

module.exports = { signToken, requireAuth, requireRole, canAccessUser, assertAccess, accessibleUserIds };
