const cron = require("node-cron");
const {
  getExpiringBatches,
  getExpiryStats,
} = require("../services/expiry.service");
const { runReorderAlert } = require("./reorderAlert.job"); // ← Phase 4: import instead of inline

function startJobs() {
  // ── Daily 6 AM — expiry check (unchanged from Phase 3) ───────────────────
  cron.schedule("0 6 * * *", async () => {
    console.log("[ExpiryJob] Running daily expiry check…");
    try {
      const stats = await getExpiryStats();
      console.log("[ExpiryJob] Stats:", stats);

      if (stats.alreadyExpired > 0) {
        console.warn(
          `[ExpiryJob] ⚠️  ${stats.alreadyExpired} batch(es) ALREADY EXPIRED with stock remaining!`,
        );
      }

      const soon = await getExpiringBatches(3);
      if (soon.length) {
        console.log(
          `[ExpiryJob] ${soon.length} batch(es) expiring within 3 days:`,
        );
        soon.forEach((b) => {
          const daysLeft = Math.ceil(
            (new Date(b.expiry_date) - new Date()) / (1000 * 60 * 60 * 24),
          );
          console.log(
            `  - ${b.item.name}: ${b.quantity_remaining} ${b.item.unit}` +
              ` | expires ${new Date(b.expiry_date).toDateString()}` +
              ` (${daysLeft <= 0 ? "TODAY" : `in ${daysLeft}d`})`,
          );
        });
      } else {
        console.log("[ExpiryJob] No batches expiring within 3 days.");
      }
    } catch (err) {
      console.error("[ExpiryJob] Error:", err);
    }
  });

  // ── Weekly Sunday 8 PM — reorder alert (Phase 4: now uses runReorderAlert) ─
  cron.schedule("0 20 * * 0", async () => {
    console.log("[ReorderJob] Running weekly reorder alert…");
    try {
      await runReorderAlert(); // ← single clean call
    } catch (err) {
      console.error("[ReorderJob] Error:", err);
    }
  });

  console.log(
    "✅ Cron jobs registered (expiry: daily 6AM | reorder: Sunday 8PM)",
  );
}

module.exports = { startJobs };
