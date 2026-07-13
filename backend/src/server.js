require("dotenv").config();
const app = require("./app");
const { startJobs } = require("./jobs/expiryCheck.job");

const fs = require("fs");
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
const PORT = process.env.PORT || 4000;

const REQUIRED_ENV = [
  "DATABASE_URL",
  "JWT_SECRET",
  "SMTP_HOST",
  "SMTP_USER",
  "SMTP_PASS",
  "OWNER_ALERT_EMAIL",
];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(
    "❌ Missing required environment variables:",
    missing.join(", "),
  );
  process.exit(1);
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API running on http://localhost:${PORT}`);
  startJobs();
});
