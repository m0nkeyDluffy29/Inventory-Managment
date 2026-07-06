const { PrismaClient } = require("@prisma/client");
const { sendReorderAlert } = require("../services/email.service");
const prisma = new PrismaClient();

async function runReorderAlert() {
  const lowStock = await prisma.$queryRaw`
    SELECT * FROM "InventoryItem" WHERE current_stock < caution_level ORDER BY name ASC
  `;
  await sendReorderAlert(lowStock);
  return lowStock;
}

module.exports = { runReorderAlert };
