import React from "react"
import { useEffect, useState } from "react";
import { getItems, getVendors, addDelivery } from "../api/inventoryApi";
import BarcodeScanner from "../components/scanner/BarcodeScanner";
import BillUploader from "../components/scanner/BillUploader";
import BillReviewModal from "../components/vendors/BillReviewModal";

export default function NewDelivery() {
  const [tab, setTab] = useState("manual");
  const [items, setItems] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState("");
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [pendingBill, setPendingBill] = useState(null);
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

  const handleBarcodeResult = (text) => {
    setScannedBarcode(text);
    setShowScanner(false);
    const match = items.find((i) =>
      i.name.toLowerCase().includes(text.toLowerCase()),
    );
    if (match) setForm((f) => ({ ...f, item_id: String(match.id) }));
  };

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
    <div>
      <div className="page-header">
        <h1>Record New Delivery</h1>
        <p>Log incoming stock from vendors — manually or via bill scan.</p>
      </div>

      {/* Tab switcher */}
      <div
        style={{
          display: "flex",
          background: "#F5F0E8",
          borderRadius: 12,
          padding: 4,
          gap: 4,
          maxWidth: 400,
          marginBottom: 28,
        }}
      >
        {[
          { key: "manual", label: "✏️ Manual Entry" },
          { key: "scan", label: "📷 Scan Bill" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: 9,
              fontSize: 14,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
              transition: "all 0.15s",
              background: tab === t.key ? "#fff" : "transparent",
              color: tab === t.key ? "#1C1917" : "#78716C",
              boxShadow: tab === t.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Manual Entry Tab */}
      {tab === "manual" && (
        <div style={{ maxWidth: 560 }}>
          <div className="card">
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#78716C",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Manual Entry
              </div>
              <div
                style={{
                  fontFamily: "Playfair Display, serif",
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#1C1917",
                  marginTop: 2,
                }}
              >
                Record Delivery Details
              </div>
            </div>

            {success && (
              <div
                className="alert-strip alert-green"
                style={{ marginBottom: 20 }}
              >
                ✅ Delivery recorded! Stock has been updated.
              </div>
            )}

            <form
              onSubmit={handleManualSubmit}
              style={{ display: "flex", flexDirection: "column", gap: 18 }}
            >
              <div>
                <label className="label">Ingredient / Item</label>
                <select
                  value={form.item_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, item_id: e.target.value }))
                  }
                  required
                  className="input"
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
                <label className="label">Vendor / Supplier</label>
                <select
                  value={form.vendor_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, vendor_id: e.target.value }))
                  }
                  required
                  className="input"
                >
                  <option value="">Select vendor…</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 14,
                }}
              >
                <div>
                  <label className="label">Quantity Received</label>
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
                    className="input"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="label">
                    Unit Price (₹){" "}
                    <span
                      style={{
                        color: "#A8A29E",
                        fontSize: 10,
                        textTransform: "none",
                        letterSpacing: 0,
                      }}
                    >
                      optional
                    </span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.unit_price}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, unit_price: e.target.value }))
                    }
                    className="input"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="label">
                  Expiry Date{" "}
                  <span
                    style={{
                      color: "#A8A29E",
                      fontSize: 10,
                      textTransform: "none",
                      letterSpacing: 0,
                    }}
                  >
                    optional but recommended
                  </span>
                </label>
                <input
                  type="date"
                  value={form.expiry_date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, expiry_date: e.target.value }))
                  }
                  className="input"
                />
              </div>

              {error && (
                <div
                  className="alert-strip alert-red"
                  style={{ padding: "10px 14px", fontSize: 13 }}
                >
                  ⚠️ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{
                  padding: "14px",
                  fontSize: 15,
                  borderRadius: 12,
                  marginTop: 4,
                }}
              >
                {loading ? "Saving…" : "+ Record Delivery"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Scan Tab */}
      {tab === "scan" && (
        <div style={{ maxWidth: 560 }}>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#78716C",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Step 1
              </div>
              <div
                style={{
                  fontFamily: "Playfair Display, serif",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#1C1917",
                }}
              >
                Select Vendor First
              </div>
            </div>
            <select
              value={selectedVendorId}
              onChange={(e) => setSelectedVendorId(e.target.value)}
              className="input"
            >
              <option value="">Select vendor…</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <div
            className="card"
            style={{
              marginBottom: 16,
              opacity: !selectedVendorId ? 0.5 : 1,
              pointerEvents: !selectedVendorId ? "none" : "auto",
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#78716C",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Step 2 — Optional
              </div>
              <div
                style={{
                  fontFamily: "Playfair Display, serif",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#1C1917",
                }}
              >
                Scan Barcode
              </div>
            </div>
            {showScanner ? (
              <BarcodeScanner
                onResult={handleBarcodeResult}
                onClose={() => setShowScanner(false)}
              />
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button
                  onClick={() => setShowScanner(true)}
                  className="btn-primary"
                >
                  📷 Open Camera
                </button>
                {scannedBarcode && (
                  <span className="badge badge-green">✅ {scannedBarcode}</span>
                )}
              </div>
            )}
          </div>

          <div
            className="card"
            style={{
              opacity: !selectedVendorId ? 0.5 : 1,
              pointerEvents: !selectedVendorId ? "none" : "auto",
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#78716C",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Step 3
              </div>
              <div
                style={{
                  fontFamily: "Playfair Display, serif",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#1C1917",
                }}
              >
                Upload Bill Image
              </div>
              <div style={{ fontSize: 13, color: "#78716C", marginTop: 4 }}>
                OCR will extract line items automatically
              </div>
            </div>
            <BillUploader
              vendorId={selectedVendorId}
              onExtracted={(lineItems, bill) => setPendingBill(bill)}
              disabled={!selectedVendorId}
            />
          </div>
        </div>
      )}

      {pendingBill && (
        <BillReviewModal
          bill={pendingBill}
          inventoryItems={items}
          onConfirmed={() => {
            setPendingBill(null);
            setScannedBarcode("");
            setSuccess(true);
            setTab("manual");
          }}
          onClose={() => setPendingBill(null)}
        />
      )}
    </div>
  );
}
