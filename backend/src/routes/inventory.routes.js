const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/inventory.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/',             ctrl.listItems);
router.post('/',            ctrl.createItem);
router.get('/:id',          ctrl.getItem);
router.put('/:id',          ctrl.updateItem);
router.delete('/:id',       ctrl.deleteItem);
router.get('/:id/batches',  ctrl.listBatches);
router.post('/deliveries',  ctrl.addDelivery);

router.get('/vendors',        ctrl.listVendors);
router.post('/vendors',       ctrl.createVendor);
router.put('/vendors/:id',    ctrl.updateVendor);
router.delete('/vendors/:id', ctrl.deleteVendor);

module.exports = router;