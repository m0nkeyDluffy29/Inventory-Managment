const cron = require('node-cron');
const { getExpiringBatches, getExpiryStats } = require('../services/expiry.service'); // ← getExpiryStats added

function startJobs() {
  // ── Daily 6 AM — expiry check (CHANGED in Phase 3) ──────────────────────
  cron.schedule('0 6 * * *', async () => {
    console.log('[ExpiryJob] Running daily expiry check…');
    try {
      // Summary stats
      const stats = await getExpiryStats();
      console.log('[ExpiryJob] Stats:', stats);

      if (stats.alreadyExpired > 0) {
        console.warn(`[ExpiryJob] ⚠️  ${stats.alreadyExpired} batch(es) ALREADY EXPIRED with stock remaining!`);
      }

      // Detail — batches expiring within 3 days
      const soon = await getExpiringBatches(3);
      if (soon.length) {
        console.log(`[ExpiryJob] ${soon.length} batch(es) expiring within 3 days:`);
        soon.forEach(b => {
          const daysLeft = Math.ceil(
            (new Date(b.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)
          );
          console.log(
            `  - ${b.item.name}: ${b.quantity_remaining} ${b.item.unit}` +
            ` | expires ${new Date(b.expiry_date).toDateString()}` +
            ` (${daysLeft <= 0 ? 'TODAY' : `in ${daysLeft}d`})`
          );
        });

        // Phase 3: emit to dashboard via SSE or push notification here in future
        // For now the frontend polls GET /api/expiry/soon on load
      } else {
        console.log('[ExpiryJob] No batches expiring within 3 days.');
      }
    } catch (err) {
      console.error('[ExpiryJob] Error:', err);
    }
  });

  // ── Weekly Sunday 8 PM — reorder alert (unchanged from Phase 1) ──────────
  cron.schedule('0 20 * * 0', async () => {
    console.log('[ReorderJob] Checking low-stock items…');
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      const lowStock = await prisma.$queryRaw`
        SELECT * FROM "InventoryItem" WHERE current_stock < caution_level ORDER BY name ASC
      `;
      if (lowStock.length) {
        const { sendReorderAlert } = require('../services/email.service');
        await sendReorderAlert(lowStock);
        console.log(`[ReorderJob] Alert sent for ${lowStock.length} item(s).`);
      } else {
        console.log('[ReorderJob] All items above caution level.');
      }
    } catch (err) {
      console.error('[ReorderJob] Error:', err);
    }
  });

  console.log('✅ Cron jobs registered (expiry: daily 6AM | reorder: Sunday 8PM)');
}

module.exports = { startJobs };