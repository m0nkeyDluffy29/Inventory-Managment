import { useState } from "react";
import { confirmBill } from "../../api/vendorBillsApi";

export default function VendorBillReview({ bill, onConfirmed }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    setError("");
    try {
      setLoading(true);
      await confirmBill(bill.id);
      onConfirmed();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to confirm bill");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">
        <strong>Vendor:</strong> {bill.vendor?.name} &nbsp;|&nbsp;
        <strong>Bill #:</strong> {bill.bill_number || "—"} &nbsp;|&nbsp;
        <strong>Status:</strong>{" "}
        <span
          className={`font-semibold ${bill.status === "confirmed" ? "text-green-600" : "text-amber-600"}`}
        >
          {bill.status}
        </span>
      </div>
      <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
        <thead className="bg-gray-50 text-xs text-gray-600 uppercase">
          <tr>
            <th className="px-3 py-2 text-left">Item</th>
            <th className="px-3 py-2 text-right">Qty</th>
            <th className="px-3 py-2 text-right">Unit Price</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {bill.lineItems?.map((li) => (
            <tr key={li.id}>
              <td className="px-3 py-2">
                {li.matched_item?.name || (
                  <span className="text-red-500">Unmatched</span>
                )}
              </td>
              <td className="px-3 py-2 text-right font-mono">{li.quantity}</td>
              <td className="px-3 py-2 text-right">
                {li.unit_price ? `₹${li.unit_price}` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {bill.status !== "confirmed" && (
        <>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Confirming…" : "Confirm & Update Stock"}
          </button>
        </>
      )}
    </div>
  );
}
