const { PrismaClient } = require("@prisma/client");
const { z } = require("zod");
const { extractLineItemsFromImage } = require("../services/ocr.service"); // ← changed
const { matchOCRLinesToItems } = require("../services/itemMatcher.service"); // ← changed

const prisma = new PrismaClient();

// ── unchanged: listBills, getBill, createBill, confirmBill ──

exports.listBills = async (_req, res, next) => {
  try {
    res.json(
      await prisma.vendorBill.findMany({
        include: { vendor: true, lineItems: true },
        orderBy: { createdAt: "desc" },
      }),
    );
  } catch (err) {
    next(err);
  }
};

const billSchema = z.object({
  vendor_id: z.number().int(),
  bill_number: z.string().optional(),
  bill_date: z.string().datetime().optional(),
  lineItems: z
    .array(
      z.object({
        matched_item_id: z.number().int().optional(),
        raw_text: z.string().optional(),
        quantity: z.number().positive(),
        unit_price: z.number().positive().optional(),
        expiry_date: z.string().datetime().optional(),
      }),
    )
    .optional(),
});

exports.createBill = async (req, res, next) => {
  try {
    const data = billSchema.parse(req.body);
    const bill = await prisma.vendorBill.create({
      data: {
        vendor_id: data.vendor_id,
        bill_number: data.bill_number,
        bill_date: data.bill_date ? new Date(data.bill_date) : null,
        lineItems: data.lineItems
          ? {
              create: data.lineItems.map((li) => ({
                ...li,
                expiry_date: li.expiry_date ? new Date(li.expiry_date) : null,
              })),
            }
          : undefined,
      },
      include: { lineItems: true },
    });
    res.status(201).json(bill);
  } catch (err) {
    next(err);
  }
};

exports.getBill = async (req, res, next) => {
  try {
    res.json(
      await prisma.vendorBill.findUniqueOrThrow({
        where: { id: +req.params.id },
        include: {
          vendor: true,
          lineItems: { include: { matched_item: true } },
        },
      }),
    );
  } catch (err) {
    next(err);
  }
};

exports.confirmBill = async (req, res, next) => {
  try {
    const bill = await prisma.vendorBill.findUniqueOrThrow({
      where: { id: +req.params.id },
      include: { lineItems: true },
    });
    if (bill.status === "confirmed")
      return res.status(400).json({ error: "Bill already confirmed" });

    await prisma.$transaction(async (tx) => {
      for (const line of bill.lineItems) {
        if (!line.matched_item_id) continue;
        const batch = await tx.stockBatch.create({
          data: {
            item_id: line.matched_item_id,
            vendor_id: bill.vendor_id,
            quantity_received: line.quantity,
            quantity_remaining: line.quantity,
            expiry_date: line.expiry_date,
            unit_price: line.unit_price,
          },
        });
        await tx.inventoryItem.update({
          where: { id: line.matched_item_id },
          data: { current_stock: { increment: line.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            item_id: line.matched_item_id,
            batch_id: batch.id,
            change_qty: line.quantity,
            movement_type: "purchase",
            reference_id: `bill-${bill.id}`,
          },
        });
      }
      await tx.vendorBill.update({
        where: { id: bill.id },
        data: { status: "confirmed" },
      });
    });

    res.json({ message: "Bill confirmed and stock updated" });
  } catch (err) {
    next(err);
  }
};

// ── NEW: scanBill — was 501 stub, now real OCR + matching ─────────────────

exports.scanBill = async (req, res, next) => {
  try {
    if (!req.file)
      return res.status(400).json({ error: "No image file uploaded" });
    const vendor_id = Number(req.body.vendor_id);
    if (!vendor_id)
      return res.status(400).json({ error: "vendor_id is required" });

    // 1. Run OCR on uploaded image
    const ocrLines = await extractLineItemsFromImage(req.file.path);

    if (!ocrLines.length) {
      return res
        .status(422)
        .json({ error: "OCR extracted no readable lines from this image" });
    }

    // 2. Fuzzy-match OCR lines to existing InventoryItems
    const inventoryItems = await prisma.inventoryItem.findMany({
      select: { id: true, name: true, unit: true },
    });
    const matchedLines = matchOCRLinesToItems(ocrLines, inventoryItems);

    // 3. Create a VendorBill with status 'pending' + BillLineItem rows
    const bill = await prisma.vendorBill.create({
      data: {
        vendor_id,
        scanned_image_url: req.file.path, // store local path; use cloud URL in production
        status: "pending",
        lineItems: {
          create: matchedLines.map((line) => ({
            raw_text: line.raw_text,
            matched_item_id: line.matched_item_id || null,
            quantity: line.quantity || 0,
            unit_price: line.unit_price || null,
            expiry_date: line.expiry_date ? new Date(line.expiry_date) : null,
          })),
        },
      },
      include: {
        lineItems: { include: { matched_item: true } },
      },
    });

    // 4. Return the bill + match metadata so the frontend can render the review modal
    res.status(201).json({
      bill,
      matchSummary: {
        total: matchedLines.length,
        autoMatched: matchedLines.filter((l) => l.auto_matched).length,
        needsReview: matchedLines.filter((l) => !l.auto_matched).length,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── NEW: updateLineItems — staff corrections from BillReviewModal ─────────

exports.updateLineItems = async (req, res, next) => {
  try {
    const billId = +req.params.id;
    const lines = req.body; // array of { id, matched_item_id, quantity, unit_price, expiry_date }

    if (!Array.isArray(lines))
      return res
        .status(400)
        .json({ error: "Body must be an array of line items" });

    await prisma.$transaction(
      lines.map((line) =>
        prisma.billLineItem.update({
          where: { id: line.id },
          data: {
            matched_item_id: line.matched_item_id,
            quantity: Number(line.quantity),
            unit_price: line.unit_price ? Number(line.unit_price) : null,
            expiry_date: line.expiry_date ? new Date(line.expiry_date) : null,
          },
        }),
      ),
    );

    const updated = await prisma.vendorBill.findUnique({
      where: { id: billId },
      include: { lineItems: { include: { matched_item: true } } },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};
