const prisma = require("../lib/prisma");

// ── unchanged from Phase 1 ──────────────────────────────────────────────────

/**
 * Returns all stock batches expiring within `daysAhead` days
 * with quantity_remaining > 0, sorted by nearest expiry first.
 */
async function getExpiringBatches(daysAhead = 7) {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + daysAhead);

  return prisma.stockBatch.findMany({
    where: {
      quantity_remaining: { gt: 0 },
      expiry_date: {
        not: null,
        lte: threshold,
      },
    },
    orderBy: { expiry_date: "asc" },
    include: { item: true, vendor: true },
  });
}

// ── NEW in Phase 3 ──────────────────────────────────────────────────────────

/**
 * Returns summary counts:
 *  - alreadyExpired  : batches past expiry date, still have remaining qty
 *  - expiringToday   : expiry_date == today
 *  - expiringIn3Days : expiry_date within next 3 days (excluding today)
 *  - expiringIn7Days : expiry_date within next 7 days
 */
async function getExpiryStats() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const in3Days = new Date(today);
  in3Days.setDate(today.getDate() + 3);
  const in7Days = new Date(today);
  in7Days.setDate(today.getDate() + 7);

  const [alreadyExpired, expiringToday, expiringIn3Days, expiringIn7Days] =
    await Promise.all([
      // Already expired — past today, qty still remaining
      prisma.stockBatch.count({
        where: {
          quantity_remaining: { gt: 0 },
          expiry_date: { lt: today },
        },
      }),
      // Expiring today
      prisma.stockBatch.count({
        where: {
          quantity_remaining: { gt: 0 },
          expiry_date: { gte: today, lt: new Date(today.getTime() + 86400000) },
        },
      }),
      // Expiring within 3 days (not today)
      prisma.stockBatch.count({
        where: {
          quantity_remaining: { gt: 0 },
          expiry_date: {
            gte: new Date(today.getTime() + 86400000),
            lte: in3Days,
          },
        },
      }),
      // Expiring within 7 days
      prisma.stockBatch.count({
        where: {
          quantity_remaining: { gt: 0 },
          expiry_date: { gte: today, lte: in7Days },
        },
      }),
    ]);

  return { alreadyExpired, expiringToday, expiringIn3Days, expiringIn7Days };
}

/**
 * Writes off the remaining quantity of a StockBatch as wastage.
 * Creates a StockMovement (type: wastage) and zeroes out quantity_remaining.
 * Also decrements InventoryItem.current_stock.
 */
async function markBatchWasted(batchId, reason = "expired") {
  const batch = await prisma.stockBatch.findUniqueOrThrow({
    where: { id: batchId },
    include: { item: true },
  });

  if (batch.quantity_remaining <= 0) {
    throw Object.assign(new Error("Batch already empty — nothing to waste."), {
      status: 400,
    });
  }

  const wastedQty = batch.quantity_remaining;

  return prisma.$transaction(async (tx) => {
    // Zero out the batch
    await tx.stockBatch.update({
      where: { id: batchId },
      data: { quantity_remaining: 0 },
    });

    // Decrement cached stock on the item
    await tx.inventoryItem.update({
      where: { id: batch.item_id },
      data: { current_stock: { decrement: wastedQty } },
    });

    // Audit log entry
    const movement = await tx.stockMovement.create({
      data: {
        item_id: batch.item_id,
        batch_id: batchId,
        change_qty: -wastedQty,
        movement_type: "wastage",
        reference_id: reason,
      },
    });

    return {
      batch_id: batchId,
      item_name: batch.item.name,
      wasted_qty: wastedQty,
      unit: batch.item.unit,
      movement,
    };
  });
}

module.exports = { getExpiringBatches, getExpiryStats, markBatchWasted };
