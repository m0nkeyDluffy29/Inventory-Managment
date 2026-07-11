const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/vendorBills.controller");
const { authenticate } = require("../middleware/auth.middleware");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// ── Configure Cloudinary ──────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Replace diskStorage with CloudinaryStorage ────────────────────────────
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:           'vendor-bills',
    allowed_formats:  ['jpg', 'jpeg', 'png', 'pdf'],
    resource_type:    'auto',
  },
});

const upload = multer({ storage });

// ── Routes ────────────────────────────────────────────────────────────────
router.use(authenticate);

router.get("/",                ctrl.listBills);
router.post("/",               ctrl.createBill);
router.get("/:id",             ctrl.getBill);
router.put("/:id/confirm",     ctrl.confirmBill);
router.put("/:id/line-items",  ctrl.updateLineItems);
router.post("/scan", upload.single("image"), ctrl.scanBill);

module.exports = router;