const { z } = require('zod');
const { runReorderAlert }                  = require('../jobs/reorderAlert.job');
const { sendTestEmail: sendTestEmailSvc }  = require('../services/email.service');

const prisma = require('../lib/prisma') 

// GET /api/alerts/low-stock
// Returns items where current_stock < caution_level, sorted by deficit descending
exports.getLowStock = async (_req, res, next) => {
  try {
    const items = await prisma.$queryRaw`
      SELECT
        id, name, category, unit,
        current_stock::float  AS current_stock,
        caution_level::float  AS caution_level,
        (caution_level - current_stock)::float AS deficit
      FROM "InventoryItem"
      WHERE current_stock < caution_level
      ORDER BY deficit DESC, name ASC
    `;
    res.json(items);
  } catch (err) { next(err); }
};

// POST /api/alerts/trigger  (owner only)
// Manually runs the reorder alert job and sends the email immediately
exports.triggerReorderAlert = async (_req, res, next) => {
  try {
    const result = await runReorderAlert();
    if (!result.sent) {
      return res.json({
        message: 'All items are above their caution level — no email sent.',
        count: 0,
      });
    }
    res.json({
      message: `Reorder alert sent for ${result.count} item(s).`,
      count:   result.count,
      items:   result.items,
      email:   result.email,
    });
  } catch (err) { next(err); }
};

// POST /api/alerts/test-email  (owner only)
// Sends a test email to verify SMTP settings are correct
exports.sendTestEmail = async (req, res, next) => {
  try {
    const to = req.body?.to || process.env.OWNER_ALERT_EMAIL;
    const result = await sendTestEmailSvc(to);
    res.json({ message: 'Test email sent.', messageId: result.messageId });
  } catch (err) { next(err); }
};

// PUT /api/alerts/caution-level/:id  (owner only)
// Updates the caution_level for a single InventoryItem
const cautionSchema = z.object({
  caution_level: z.number().min(0),
});

exports.updateCautionLevel = async (req, res, next) => {
  try {
    const { caution_level } = cautionSchema.parse(req.body);
    const item = await prisma.inventoryItem.update({
      where: { id: +req.params.id },
      data:  { caution_level },
      select: { id: true, name: true, unit: true, current_stock: true, caution_level: true },
    });
    res.json(item);
  } catch (err) { next(err); }
};