const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/orders.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/',    ctrl.listOrders);
router.post('/',   ctrl.createOrder);
router.get('/:id', ctrl.getOrder);

module.exports = router;