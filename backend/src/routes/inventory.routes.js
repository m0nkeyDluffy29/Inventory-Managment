const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/inventory.controller");
const { authenticate } = require("../middleware/auth.middleware");

router.use(authenticate);

// Inventory Items
router.get("/", ctrl.listItems);
router.post("/", ctrl.createItem);
router.get("/:id", ctrl.getItem);
router.put("/:id", ctrl.updateItem);
router.delete("/:id", ctrl.deleteItem);

// Stock Batches for an item
router.get("/:id/batches", ctrl.listBatches);

// Manual delivery (no OCR)
router.post("/deliveries", ctrl.addDelivery);

// Mark a specific batch as wasted  ← NEW in Phase 3
// (delegates to expiry.service → keeps logic in one place)
router.post("/batches/:batchId/waste", ctrl.markWasted);

// Vendors
router.get("/vendors", ctrl.listVendors);
router.post("/vendors", ctrl.createVendor);
router.put("/vendors/:id", ctrl.updateVendor);
router.delete("/vendors/:id", ctrl.deleteVendor);

module.exports = router;
