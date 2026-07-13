const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit"); // ← ADD this import

const authRoutes = require("./routes/auth.routes");
const inventoryRoutes = require("./routes/inventory.routes");
const vendorBillsRoutes = require("./routes/vendorBills.routes");
const ordersRoutes = require("./routes/orders.routes");
const recipesRoutes = require("./routes/recipes.routes");
const alertsRoutes = require("./routes/alerts.routes");
const expiryRoutes = require("./routes/expiry.routes");
const errorHandler = require("./middleware/errorHandler.middleware");

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        (origin && origin.endsWith(".vercel.app")) ||
        origin === process.env.FRONTEND_URL
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);
app.options("/(.*)", (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin);
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  res.sendStatus(200);
});
app.use(express.json());

// ── Rate Limiting ─────────────────────────────────────────────────────────
app.use(
  "/api/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: { error: "Too many login attempts. Try again in 15 minutes." },
  }),
);

app.use(
  "/api",
  rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 200,
  }),
);

// ── Routes ────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/vendor-bills", vendorBillsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/recipes", recipesRoutes);
app.use("/api/alerts", alertsRoutes);
app.use("/api/expiry", expiryRoutes);

// ── Health check ──────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// ── Global error handler (must be last) ───────────────────────────────────
app.use(errorHandler);

module.exports = app;
