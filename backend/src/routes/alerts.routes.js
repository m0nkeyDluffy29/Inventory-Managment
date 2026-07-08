const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/alerts.controller');
const { authenticate, requireOwner } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/low-stock',         ctrl.getLowStock);
router.post('/trigger',          requireOwner, ctrl.triggerReorderAlert);
router.post('/test-email',       requireOwner, ctrl.sendTestEmail);
router.put('/caution-level/:id', requireOwner, ctrl.updateCautionLevel);

module.exports = router;