const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/vendorBills.controller");
const { authenticate } = require("../middleware/auth.middleware");
const multer = require("multer");

// Store uploads in /uploads with original extension preserved
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, "uploads/"),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

router.use(authenticate);

router.get("/", ctrl.listBills);
router.post("/", ctrl.createBill);
router.get("/:id", ctrl.getBill);
router.put("/:id/confirm", ctrl.confirmBill);
router.put("/:id/line-items", ctrl.updateLineItems); // ← NEW
router.post("/scan", upload.single("image"), ctrl.scanBill); // ← was stub, now real

module.exports = router;
