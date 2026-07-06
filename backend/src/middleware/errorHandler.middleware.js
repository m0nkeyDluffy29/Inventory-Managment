const { ZodError } = require("zod");

function errorHandler(err, _req, res, _next) {
  console.error(err);
  if (err instanceof ZodError)
    return res
      .status(422)
      .json({ error: "Validation error", details: err.errors });
  if (err.code === "P2025")
    return res.status(404).json({ error: "Record not found" });
  if (err.code === "P2002")
    return res.status(409).json({ error: "Duplicate value" });
  res
    .status(err.status || 500)
    .json({ error: err.message || "Internal server error" });
}

module.exports = errorHandler;
