const cron = require("node-cron");
const { getExpiringBatches } = require("../services/expiry.service");

function startJobs() {
  // Daily 6AM — expiry check
  cron.schedule("0 6 * * *", async () => {
    console.log("[ExpiryJob] Checking expiring batches...");
    const batches = await getExpiringBatches(3);
    batches.forEach((b) =>
      console.log(
        `  - ${b.item.name}: ${b.quantity_remaining} ${b.item.unit} expires ${b.expiry_date?.toDateString()}`,
      ),
    );
  });

  // Weekly Sunday 8PM — reorder alert
  cron.schedule("0 20 * * 0", async () => {
    console.log("[ReorderJob] Checking low-stock items...");
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();
    const lowStock = await prisma.$queryRaw`
      SELECT * FROM "InventoryItem" WHERE current_stock < caution_level ORDER BY name ASC
    `;
    if (lowStock.length) {
      const { sendReorderAlert } = require("../services/email.service");
      await sendReorderAlert(lowStock);
    }
  });

  console.log("✅ Cron jobs registered");
}

module.exports = { startJobs };
