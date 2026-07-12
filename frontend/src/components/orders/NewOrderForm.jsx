import React from "react"
import { useState, useEffect } from "react";
import { getDishes } from "../../api/vendorBillsApi";
import { createOrder } from "../../api/ordersApi";

export default function NewOrderForm({ onSuccess }) {
  const [dishes, setDishes] = useState([]);
  const [lines, setLines] = useState([{ dish_id: "", quantity: 1 }]);
  const [tableRef, setTableRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getDishes().then(setDishes);
  }, []);

  const addLine = () => setLines((l) => [...l, { dish_id: "", quantity: 1 }]);
  const removeLine = (i) => setLines((l) => l.filter((_, idx) => idx !== i));
  const updateLine = (i, field, val) =>
    setLines((l) =>
      l.map((row, idx) => (idx === i ? { ...row, [field]: val } : row)),
    );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      setLoading(true);
      const order = await createOrder({
        table_or_customer_ref: tableRef,
        lineItems: lines.map((l) => ({
          dish_id: Number(l.dish_id),
          quantity: Number(l.quantity),
        })),
      });
      onSuccess(order);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Table / Customer
        </label>
        <input
          value={tableRef}
          onChange={(e) => setTableRef(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="e.g. Table 4"
        />
      </div>
      <div className="space-y-2">
        {lines.map((line, i) => (
          <div key={i} className="flex gap-2 items-center">
            <select
              value={line.dish_id}
              onChange={(e) => updateLine(i, "dish_id", e.target.value)}
              required
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Select dish…</option>
              {dishes.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} (₹{d.price})
                </option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              value={line.quantity}
              onChange={(e) => updateLine(i, "quantity", e.target.value)}
              className="w-20 border rounded-lg px-3 py-2 text-sm"
            />
            {lines.length > 1 && (
              <button
                type="button"
                onClick={() => removeLine(i)}
                className="text-red-500 text-sm"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addLine}
          className="text-indigo-600 text-sm hover:underline"
        >
          + Add dish
        </button>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? "Creating…" : "Create Order & Deduct Stock"}
      </button>
    </form>
  );
}
