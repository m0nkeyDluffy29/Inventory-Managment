import { useEffect, useState } from "react";
import { getItems, getVendors, addDelivery } from "../api/inventoryApi";
import BarcodeScanner from "../components/scanner/BarcodeScanner";
import BillUploader from "../components/scanner/BillUploader";
import BillReviewModal from "../components/vendors/BillReviewModal"; // ← NEW

export default function NewDelivery() {
  const [tab, setTab] = useState("scan"); // 'scan' | 'manual'
  const [items, setItems] = useState([]);
  const [vendors, setVendors] = useState([]);

  // Scan flow state
  const [showScanner, setShowScanner] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState("");
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [pendingBill, setPendingBill] = useState(null); // bill returned by scanBill API

  // Manual entry state (unchanged from Phase 1)
  const [form, setForm] = useState({
    item_id: "",
    vendor_id: "",
    quantity_received: "",
    expiry_date: "",
    unit_price: "",
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getItems().then(setItems);
    getVendors().then(setVendors);
  }, []);

  // ── Barcode handler ─────────────────────────────────────────
  const handleBarcodeResult = (text) => {
    setScannedBarcode(text);
    setShowScanner(false);
    // Auto-match scanned barcode text to item name (best-effort)
    const match = items.find((i) =>
      i.name.toLowerCase().includes(text.toLowerCase()),
    );
    if (match) setForm((f) => ({ ...f, item_id: String(match.id) }));
  };

  // ── OCR handler ─────────────────────────────────────────────
  const handleOCRExtracted = (lineItems, bill) => {
    // lineItems returned from backend already matched; open review modal
    setPendingBill(bill);
  };

  // ── Manual submit (Phase 1 logic, unchanged) ─────────────────
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    try {
      setLoading(true);
      await addDelivery({
        item_id: Number(form.item_id),
        vendor_id: Number(form.vendor_id),
        quantity_received: Number(form.quantity_received),
        expiry_date: form.expiry_date
          ? new Date(form.expiry_date).toISOString()
          : undefined,
        unit_price: form.unit_price ? Number(form.unit_price) : undefined,
      });
      setSuccess(true);
      setForm({
        item_id: "",
        vendor_id: "",
        quantity_received: "",
        expiry_date: "",
        unit_price: "",
      });
    } catch (err) {
      setError(err.response?.data?.error || "Failed to record delivery");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Record New Delivery</h1>

      {/* Tab switcher */}
      <div className="flex bg-gray-100 rounded-xl p-1">
        {["scan", "manual"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t
                ? "bg-white shadow text-indigo-700"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "scan" ? "📷 Scan Bill" : "✏️ Manual Entry"}
          </button>
        ))}
      </div>

      {/* ── SCAN TAB ── */}
      {tab === "scan" && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          {/* Vendor selector (required before scanning) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vendor <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedVendorId}
              onChange={(e) => setSelectedVendorId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Select vendor first…</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Barcode scanner section */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              1. Scan barcode (optional)
            </p>
            {showScanner ? (
              <BarcodeScanner
                onResult={handleBarcodeResult}
                onClose={() => setShowScanner(false)}
              />
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowScanner(true)}
                  disabled={!selectedVendorId}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-40"
                >
                  Open Camera
                </button>
                {scannedBarcode && (
                  <span className="text-sm text-green-700 bg-green-50 px-3 py-1 rounded-full">
                    ✅ {scannedBarcode}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Bill image upload / OCR */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              2. Upload bill image for OCR
            </p>
            <BillUploader
              vendorId={selectedVendorId}
              onExtracted={(lineItems, bill) =>
                handleOCRExtracted(lineItems, bill)
              }
              disabled={!selectedVendorId}
            />
            {!selectedVendorId && (
              <p className="text-xs text-amber-600 mt-1">
                Select a vendor above to enable scanning.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── MANUAL TAB ── */}
      {tab === "manual" && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ingredient
              </label>
              <select
                value={form.item_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, item_id: e.target.value }))
                }
                required
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Select item…</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.unit})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor
              </label>
              <select
                value={form.vendor_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, vendor_id: e.target.value }))
                }
                required
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Select vendor…</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.quantity_received}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      quantity_received: e.target.value,
                    }))
                  }
                  required
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Price (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.unit_price}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, unit_price: e.target.value }))
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Optional"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Date
              </label>
              <input
                type="date"
                value={form.expiry_date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, expiry_date: e.target.value }))
                }
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            {success && (
              <p className="text-green-600 text-sm">✅ Delivery recorded!</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Saving…" : "Record Delivery"}
            </button>
          </form>
        </div>
      )}

      {/* ── Review & Confirm Modal (opens after OCR scan) ── */}
      {pendingBill && (
        <BillReviewModal
          bill={pendingBill}
          inventoryItems={items}
          onConfirmed={() => {
            setPendingBill(null);
            setScannedBarcode("");
            setSuccess(true);
          }}
          onClose={() => setPendingBill(null)}
        />
      )}

      {success && tab === "scan" && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 text-sm">
          ✅ Delivery confirmed and stock updated successfully!
        </div>
      )}
    </div>
  );
}
