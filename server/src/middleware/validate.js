/** Validates req.body against a zod schema and replaces it with the parsed value. */
module.exports = (schema) => (req, _res, next) => {
  const r = schema.safeParse(req.body ?? {});
  if (!r.success) return next(r.error);
  req.body = r.data;
  next();
};
