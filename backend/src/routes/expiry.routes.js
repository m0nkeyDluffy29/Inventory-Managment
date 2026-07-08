const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/expiry.controller");
const { authenticate } = require("../middleware/auth.middleware");

router.use(authenticate);

// GET /api/expiry/soon?days=7   — batches expiring within N days
router.get("/soon", ctrl.getExpiringSoon);

// GET /api/expiry/stats         — summary counts (expired, expiring today, this week)
router.get("/stats", ctrl.getExpiryStats);

// POST /api/expiry/:batchId/waste  — write off remaining qty as wastage
router.post("/:batchId/waste", ctrl.markBatchWasted);

module.exports = router;
