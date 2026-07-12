import React from "react"
import { useState } from "react";
import Modal from "../shared/Modal";
import { confirmBill } from "../../api/vendorBillsApi";

/**
 * BillReviewModal
 * Shows OCR-extracted line items, lets staff:
 *   - Match each line to an existing InventoryItem (or mark as skip)
 *   - Edit quantity / expiry before confirming
 * On confirm → POST to backend which creates StockBatch rows.
 *
 * Props:
 *   bill         — VendorBill object from backend (with lineItems)
 *   inventoryItems — full list of InventoryItems for matching dropdown
 *   onConfirmed() — callback after successful confirm
 *   onClose()
 */
export default function BillReviewModal({
  bill,
  inventoryItems,
  onConfirmed,
  onClose,
}) {
  // Local editable copy of line items
  const [lines, setLines] = useState(
    bill.lineItems.map((li) => ({
      ...li,
      matched_item_id: li.matched_item_id ?? "",
      quantity: li.quantity,
      unit_price: li.unit_price ?? "",
      expiry_date: li.expiry_date ? li.expiry_date.slice(0, 10) : "",
      skip: false,
    })),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (i, field, value) =>
    setLines((ls) =>
      ls.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)),
    );

  const handleConfirm = async () => {
    setError("");
    // Validate: every non-skipped line must have a matched item
    const invalid = lines.filter((l) => !l.skip && !l.matched_item_id);
    if (invalid.length) {
      setError(
        `${invalid.length} line(s) still unmatched. Match them or mark as skip.`,
      );
      return;
    }

    try {
      setLoading(true);

      // 1. Patch bill line items with staff corrections
      await fetch(`/api/vendor-bills/${bill.id}/line-items`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("inv_token")}`,
        },
        body: JSON.stringify(
          lines
            .filter((l) => !l.skip)
            .map((l) => ({
              id: l.id,
              matched_item_id: Number(l.matched_item_id),
              quantity: Number(l.quantity),
              unit_price: l.unit_price ? Number(l.unit_price) : null,
              expiry_date: l.expiry_date
                ? new Date(l.expiry_date).toISOString()
                : null,
            })),
        ),
      });

      // 2. Confirm the bill → backend creates StockBatch + StockMovement
      await confirmBill(bill.id);
      onConfirmed();
    } catch (err) {
      setError(
        err.response?.data?.error || err.message || "Failed to confirm bill",
      );
    } finally {
      setLoading(false);
    }
  };

  const matchedCount = lines.filter((l) => !l.skip && l.matched_item_id).length;
  const totalCount = lines.filter((l) => !l.skip).length;

  return (
    <Modal title="Review Scanned Bill" onClose={onClose}>
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {/* Progress bar */}
        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
          <span>
            Matched {matchedCount} / {totalCount} lines
          </span>
          <span
            className={
              matchedCount === totalCount
                ? "text-green-600 font-medium"
                : "text-amber-600"
            }
          >
            {matchedCount === totalCount
              ? "✅ Ready to confirm"
              : "⚠️ Some unmatched"}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
          <div
            className="bg-indigo-600 h-1.5 rounded-full transition-all"
            style={{
              width: `${totalCount ? (matchedCount / totalCount) * 100 : 0}%`,
            }}
          />
        </div>

        {lines.map((line, i) => (
          <div
            key={line.id}
            className={`border rounded-xl p-4 space-y-3 text-sm ${line.skip ? "opacity-40" : ""}`}
          >
            {/* OCR raw text badge */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-xs text-gray-400 uppercase tracking-wide">
                  OCR read:
                </span>
                <p className="font-mono text-gray-700 text-xs bg-gray-100 px-2 py-1 rounded mt-0.5">
                  {line.raw_text || "(no text)"}
                </p>
              </div>
              <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={line.skip}
                  onChange={(e) => update(i, "skip", e.target.checked)}
                  className="rounded"
                />
                Skip
              </label>
            </div>

            {!line.skip && (
              <div className="grid grid-cols-2 gap-2">
                {/* Match to inventory item */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Match to Inventory Item
                    {!line.matched_item_id && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>
                  <select
                    value={line.matched_item_id}
                    onChange={(e) =>
                      update(i, "matched_item_id", e.target.value)
                    }
                    className={`w-full border rounded-lg px-3 py-1.5 text-sm ${
                      !line.matched_item_id
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                  >
                    <option value="">— Select item —</option>
                    {inventoryItems.map((it) => (
                      <option key={it.id} value={it.id}>
                        {it.name} ({it.unit})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={line.quantity}
                    onChange={(e) => update(i, "quantity", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                  />
                </div>

                {/* Unit price */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Unit Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.unit_price}
                    onChange={(e) => update(i, "unit_price", e.target.value)}
                    placeholder="Optional"
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                  />
                </div>

                {/* Expiry date */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={line.expiry_date}
                    onChange={(e) => update(i, "expiry_date", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

      <div className="flex gap-3 mt-4">
        <button
          onClick={onClose}
          className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "Confirming…" : "Confirm & Update Stock"}
        </button>
      </div>
    </Modal>
  );
}
