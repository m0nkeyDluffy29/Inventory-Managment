const Tesseract = require("tesseract.js");
const path = require("path");

/**
 * Extracts structured line items from a vendor bill image using Tesseract.js OCR.
 *
 * Returns an array of raw parsed lines:
 * [{ raw_text, quantity, unit_price, expiry_date }]
 *
 * Production upgrade path (Phase 2+):
 *   Replace the Tesseract block with a Google Cloud Vision or AWS Textract call
 *   for significantly better accuracy on messy/real-world printed bills.
 */
async function extractLineItemsFromImage(imagePath) {
  // Run Tesseract OCR
  const {
    data: { text },
  } = await Tesseract.recognize(path.resolve(imagePath), "eng", {
    // Uncomment for verbose OCR debug logging:
    // logger: m => console.log(m),
  });

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 2); // drop empty / noise lines

  return lines.map((line) => parseOCRLine(line));
}

/**
 * Attempts to parse a single OCR text line into structured fields.
 *
 * Heuristic patterns (covers most printed Indian vendor bills):
 *   "Tomatoes  10 kg  ₹40"
 *   "Onions 5.5 40.00 15/08/2025"
 *   "Rice 25kg 850"
 *
 * Fields that can't be parsed are returned as null — the staff
 * corrects them in the BillReviewModal.
 */
function parseOCRLine(line) {
  // Quantity: first standalone number (with optional decimal)
  const qtyMatch = line.match(
    /\b(\d+(?:\.\d+)?)\s*(?:kg|g|L|ml|pcs|nos|pc)?\b/i,
  );
  const quantity = qtyMatch ? parseFloat(qtyMatch[1]) : null;

  // Unit price: number preceded by ₹ / Rs / INR, or second standalone number
  const priceMatch =
    line.match(/(?:₹|Rs\.?|INR)\s*(\d+(?:\.\d+)?)/i) ||
    line.match(/(\d+(?:\.\d+)?)\s*(?:\/|\bper\b)/i);
  const unit_price = priceMatch ? parseFloat(priceMatch[1]) : null;

  // Expiry date: dd/mm/yyyy or dd-mm-yyyy or yyyy-mm-dd
  const dateMatch = line.match(
    /\b(\d{2})[\/\-](\d{2})[\/\-](\d{4})\b|\b(\d{4})[\/\-](\d{2})[\/\-](\d{2})\b/,
  );
  let expiry_date = null;
  if (dateMatch) {
    try {
      if (dateMatch[3]) {
        // dd/mm/yyyy
        expiry_date = new Date(
          `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`,
        ).toISOString();
      } else {
        // yyyy-mm-dd
        expiry_date = new Date(
          `${dateMatch[4]}-${dateMatch[5]}-${dateMatch[6]}`,
        ).toISOString();
      }
    } catch (_) {
      expiry_date = null;
    }
  }

  return {
    raw_text: line,
    quantity,
    unit_price,
    expiry_date,
  };
}

module.exports = { extractLineItemsFromImage };
