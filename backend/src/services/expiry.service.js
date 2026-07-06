const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getExpiringBatches(daysAhead = 7) {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + daysAhead);
  return prisma.stockBatch.findMany({
    where: { quantity_remaining: { gt: 0 }, expiry_date: { lte: threshold } },
    orderBy: { expiry_date: 'asc' },
    include: { item: true, vendor: true },
  });
}

module.exports = { getExpiringBatches };