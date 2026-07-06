const { z } = require("zod");

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

function positiveId(paramName = "id") {
  return (req, _res, next) => {
    const id = Number(req.params[paramName]);
    if (!Number.isInteger(id) || id <= 0)
      return next({ status: 400, message: `Invalid ${paramName}` });
    next();
  };
}

module.exports = { paginationSchema, positiveId };
