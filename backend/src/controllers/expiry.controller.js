const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const {
  getExpiringBatches,
  getExpiryStats,
  markBatchWasted,
} = require('../services/expiry.service');

const prisma = new PrismaClient();

// GET /api/expiry/soon?days=7
exports.getExpiringSoon = async (req, res, next) => {
  try {
    const days = Math.max(1, Math.min(90, Number(req.query.days) || 7));
    const batches = await getExpiringBatches(days);
    res.json(batches);
  } catch (err) { next(err); }
};

// GET /api/expiry/stats
exports.getExpiryStats = async (req, res, next) => {
  try {
    const stats = await getExpiryStats();
    res.json(stats);
  } catch (err) { next(err); }
};

// POST /api/expiry/:batchId/waste
// Body: { reason?: string }   — optional note for the audit log
exports.markBatchWasted = async (req, res, next) => {
  try {
    const batchId = +req.params.batchId;
    const reason  = req.body?.reason || 'expired';

    const result = await markBatchWasted(batchId, reason);
    res.json(result);
  } catch (err) { next(err); }
};