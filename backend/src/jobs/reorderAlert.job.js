const { sendReorderAlert } = require("../services/email.service");

const prisma = require("../lib/prisma");

/**
 * Fetch all InventoryItems where current_stock < caution_level,
 * send the reorder alert email, and return a result summary.
 *
 * Called by:
 *  - expiryCheck.job.js → startJobs() (weekly cron, every Sunday 8 PM)
 *  - alerts.controller.js → POST /api/alerts/trigger  (manual trigger from UI)
 */
async function runReorderAlert() {
  const lowStock = await prisma.$queryRaw`
    SELECT
      id, name, category, unit,
      current_stock::float  AS current_stock,
      caution_level::float  AS caution_level
    FROM "InventoryItem"
    WHERE current_stock < caution_level
    ORDER BY (caution_level - current_stock) DESC, name ASC
  `;

  if (!lowStock.length) {
    console.log("[ReorderJob] All items above caution level — no email sent.");
    return { sent: false, count: 0, items: [] };
  }

  console.log(
    `[ReorderJob] ${lowStock.length} item(s) below caution level — sending alert…`,
  );
  const result = await sendReorderAlert(lowStock);
  console.log("[ReorderJob] Email sent:", result.messageId);

  return { sent: true, count: lowStock.length, items: lowStock, email: result };
}

module.exports = { runReorderAlert };
