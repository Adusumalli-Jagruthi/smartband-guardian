const bcrypt = require("bcryptjs");
const { z } = require("zod");
const User = require("../models/User");
const { signToken } = require("../middleware/auth");
const { HttpError } = require("../utils/http");

const role = z.enum(["kid", "elderly", "guardian"]);
const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
  role,
  phone: z.string().trim().max(30).optional(),
  language: z.string().max(10).optional(),
});
const loginSchema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1), role: role.optional() });

async function register(req, res) {
  const { password, ...rest } = req.body;
  if (await User.exists({ email: rest.email })) throw new HttpError(409, "An account with this email already exists");
  const user = await User.create({ ...rest, passwordHash: await bcrypt.hash(password, 12) });
  res.status(201).json({ token: signToken(user), user });
}

async function login(req, res) {
  const user = await User.findOne({ email: req.body.email });
  if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) throw new HttpError(401, "Invalid email or password");
  if (req.body.role && req.body.role !== user.role) throw new HttpError(403, `This account is registered as "${user.role}". Please choose that role.`);
  res.json({ token: signToken(user), user });
}

const me = (req, res) => res.json(req.user);

/** Invalidates every token issued so far for this user. */
async function logout(req, res) {
  req.user.tokenVersion += 1;
  await req.user.save();
  res.status(204).end();
}
module.exports = { registerSchema, loginSchema, register, login, me, logout };
