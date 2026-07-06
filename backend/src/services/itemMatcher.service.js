const Fuse = require("fuse.js");

/**
 * Fuzzy-matches OCR-extracted line text against existing InventoryItem names.
 *
 * Uses fuse.js with a threshold of 0.4 (0 = exact, 1 = match anything).
 * A score < 0.3 is considered a high-confidence auto-match.
 * A score between 0.3–0.4 is shown to staff for confirmation.
 * No match (score > 0.4 or null) requires manual selection.
 *
 * @param {Array<{ raw_text, quantity, unit_price, expiry_date }>} ocrLines
 * @param {Array<{ id, name, unit }>} inventoryItems
 * @returns Array of line items with best match attached
 */
function matchOCRLinesToItems(ocrLines, inventoryItems) {
  const fuse = new Fuse(inventoryItems, {
    keys: ["name"],
    threshold: 0.4,
    includeScore: true,
    ignoreLocation: true,
    minMatchCharLength: 2,
  });

  return ocrLines.map((line) => {
    // Strip numbers, currency symbols, dates from raw_text before matching
    // so we match on the item name portion only
    const textForMatching = line.raw_text
      .replace(/[\d₹\/\-\.]+/g, " ")
      .replace(/\b(kg|g|L|ml|pcs|nos|pc|rs|inr)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();

    const results = fuse.search(textForMatching);
    const best = results[0] ?? null;

    return {
      ...line,
      matched_item_id: best ? best.item.id : null,
      matched_item_name: best ? best.item.name : null,
      match_score: best ? best.score : null, // lower = more confident
      auto_matched: best ? best.score < 0.3 : false, // flag for UI
    };
  });
}

module.exports = { matchOCRLinesToItems };
