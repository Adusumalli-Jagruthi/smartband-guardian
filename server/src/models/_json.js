/** Shared toJSON: expose `id`, hide `_id`/`__v`. */
module.exports = (hide = []) => ({
  virtuals: true,
  versionKey: false,
  transform(_doc, ret) { delete ret._id; for (const k of hide) delete ret[k]; return ret; },
});
