const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const inventoryRoutes = require("./routes/inventory.routes");
const vendorBillsRoutes = require("./routes/vendorBills.routes");
const ordersRoutes = require("./routes/orders.routes");
const recipesRoutes = require("./routes/recipes.routes");
const alertsRoutes = require("./routes/alerts.routes");
const expiryRoutes = require("./routes/expiry.routes"); // ← NEW in Phase 3
const errorHandler = require("./middleware/errorHandler.middleware");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/vendor-bills", vendorBillsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/recipes", recipesRoutes);
app.use("/api/alerts", alertsRoutes);
app.use("/api/expiry", expiryRoutes); // ← NEW in Phase 3

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use(errorHandler);

module.exports = app;
