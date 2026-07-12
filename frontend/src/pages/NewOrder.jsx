import React from "react"
import { useState, useEffect } from "react";
import { getDishes } from "../api/vendorBillsApi";
import { createOrder } from "../api/ordersApi";
import { format } from "date-fns";

function ReceiptPreview({ order }) {
  if (!order) return null;
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #E7E0D5",
        borderRadius: 16,
        overflow: "hidden",
        marginTop: 24,
      }}
    >
      {/* Receipt header */}
      <div
        style={{
          background: "#1C1917",
          padding: "20px 24px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 28, marginBottom: 4 }}>🧾</div>
        <div
          style={{
            fontFamily: "Playfair Display, serif",
            color: "#fff",
            fontSize: 20,
            fontWeight: 700,
          }}
        >
          Order Receipt
        </div>
        <div style={{ color: "#A8A29E", fontSize: 12, marginTop: 4 }}>
          #{order.id} ·{" "}
          {format(new Date(order.created_at), "dd MMM yyyy, HH:mm")}
        </div>
      </div>

      {/* Table / customer */}
      {order.table_or_customer_ref && (
        <div
          style={{
            padding: "12px 24px",
            borderBottom: "1px solid #F5F0E8",
            background: "#FDFAF5",
          }}
        >
          <span
            style={{
              fontSize: 12,
              color: "#78716C",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Table / Customer
          </span>
          <span
            style={{
              marginLeft: 12,
              fontSize: 14,
              fontWeight: 600,
              color: "#1C1917",
            }}
          >
            {order.table_or_customer_ref}
          </span>
        </div>
      )}

      {/* Line items */}
      <div style={{ padding: "8px 0" }}>
        {order.lineItems?.map((li) => (
          <div
            key={li.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 24px",
              borderBottom: "1px solid #F5F0E8",
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: "#1C1917" }}>
                {li.dish?.name}
              </div>
              <div style={{ fontSize: 12, color: "#A8A29E", marginTop: 2 }}>
                × {li.quantity} @ ₹{li.dish?.price}
              </div>
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontWeight: 700,
                fontSize: 16,
                color: "#1C1917",
              }}
            >
              ₹{(li.dish?.price * li.quantity).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "18px 24px",
          background: "#FDFAF5",
          borderTop: "2px solid #E7E0D5",
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 700, color: "#1C1917" }}>
          Total
        </span>
        <span
          style={{
            fontFamily: "Playfair Display, serif",
            fontSize: 24,
            fontWeight: 700,
            color: "#F59E0B",
          }}
        >
          ₹{order.total_amount?.toFixed(2)}
        </span>
      </div>

      <div style={{ padding: "12px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 11, color: "#A8A29E", margin: 0 }}>
          ✅ Stock deducted from inventory using FIFO
        </p>
      </div>
    </div>
  );
}

export default function NewOrder() {
  const [dishes, setDishes] = useState([]);
  const [lines, setLines] = useState([{ dish_id: "", quantity: 1 }]);
  const [tableRef, setTableRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [completedOrder, setCompletedOrder] = useState(null);

  useEffect(() => {
    getDishes().then(setDishes);
  }, []);

  const addLine = () => setLines((l) => [...l, { dish_id: "", quantity: 1 }]);
  const removeLine = (i) => setLines((l) => l.filter((_, idx) => idx !== i));
  const updateLine = (i, field, val) =>
    setLines((l) =>
      l.map((row, idx) => (idx === i ? { ...row, [field]: val } : row)),
    );

  const orderTotal = lines.reduce((sum, line) => {
    const dish = dishes.find((d) => d.id === Number(line.dish_id));
    return sum + (dish ? dish.price * Number(line.quantity || 0) : 0);
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setCompletedOrder(null);
    try {
      setLoading(true);
      const order = await createOrder({
        table_or_customer_ref: tableRef,
        lineItems: lines.map((l) => ({
          dish_id: Number(l.dish_id),
          quantity: Number(l.quantity),
        })),
      });
      setCompletedOrder(order);
      setLines([{ dish_id: "", quantity: 1 }]);
      setTableRef("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>New Order</h1>
        <p>
          Create an order — ingredients are deducted automatically from
          inventory.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
          alignItems: "start",
        }}
      >
        {/* Order form */}
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
              Order Details
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
              Build Your Order
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 20 }}
          >
            <div>
              <label className="label">
                Table / Customer{" "}
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
                value={tableRef}
                onChange={(e) => setTableRef(e.target.value)}
                className="input"
                placeholder="e.g. Table 4 or Walk-in"
              />
            </div>

            {/* Dish lines */}
            <div>
              <label className="label">Dishes</label>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {lines.map((line, i) => {
                  const dish = dishes.find(
                    (d) => d.id === Number(line.dish_id),
                  );
                  return (
                    <div
                      key={i}
                      style={{ display: "flex", gap: 8, alignItems: "center" }}
                    >
                      <select
                        value={line.dish_id}
                        onChange={(e) =>
                          updateLine(i, "dish_id", e.target.value)
                        }
                        required
                        className="input"
                        style={{ flex: 2 }}
                      >
                        <option value="">Select dish…</option>
                        {dishes.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} — ₹{d.price}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={line.quantity}
                        onChange={(e) =>
                          updateLine(i, "quantity", e.target.value)
                        }
                        className="input"
                        style={{ width: 64, textAlign: "center" }}
                      />
                      {dish && (
                        <span
                          style={{
                            fontSize: 13,
                            color: "#78716C",
                            fontFamily: "monospace",
                            whiteSpace: "nowrap",
                            minWidth: 60,
                          }}
                        >
                          ₹{(dish.price * Number(line.quantity)).toFixed(0)}
                        </span>
                      )}
                      {lines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLine(i)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#A8A29E",
                            fontSize: 18,
                            padding: "0 4px",
                            flexShrink: 0,
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={addLine}
                style={{
                  marginTop: 10,
                  background: "none",
                  border: "1.5px dashed #E7E0D5",
                  borderRadius: 10,
                  padding: "8px 16px",
                  cursor: "pointer",
                  fontSize: 13,
                  color: "#78716C",
                  fontWeight: 600,
                  width: "100%",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                + Add dish
              </button>
            </div>

            {/* Running total */}
            {orderTotal > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "14px 18px",
                  background: "#FDFAF5",
                  borderRadius: 12,
                  border: "1px solid #E7E0D5",
                }}
              >
                <span
                  style={{ fontSize: 14, fontWeight: 600, color: "#78716C" }}
                >
                  Estimated Total
                </span>
                <span
                  style={{
                    fontFamily: "Playfair Display, serif",
                    fontSize: 22,
                    fontWeight: 700,
                    color: "#F59E0B",
                  }}
                >
                  ₹{orderTotal.toFixed(2)}
                </span>
              </div>
            )}

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
              style={{ padding: "14px", fontSize: 15, borderRadius: 12 }}
            >
              {loading ? "Processing…" : "🧾 Place Order & Deduct Stock"}
            </button>
          </form>
        </div>

        {/* Right panel */}
        <div>
          {completedOrder ? (
            <ReceiptPreview order={completedOrder} />
          ) : (
            <div
              style={{
                background: "#fff",
                border: "1px solid #E7E0D5",
                borderRadius: 16,
                padding: 32,
                textAlign: "center",
                color: "#A8A29E",
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>🧾</div>
              <div
                style={{
                  fontFamily: "Playfair Display, serif",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#1C1917",
                  marginBottom: 8,
                }}
              >
                Receipt appears here
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                After placing an order, the receipt will show here and stock
                will be automatically deducted from inventory using FIFO.
              </div>

              {/* Available dishes preview */}
              {dishes.length > 0 && (
                <div style={{ marginTop: 28, textAlign: "left" }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#78716C",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: 12,
                    }}
                  >
                    Available Dishes
                  </div>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    {dishes.map((d) => (
                      <div
                        key={d.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "10px 14px",
                          background: "#FDFAF5",
                          borderRadius: 10,
                          border: "1px solid #F5F0E8",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: 13,
                              color: "#1C1917",
                            }}
                          >
                            {d.name}
                          </div>
                          {d.category && (
                            <div style={{ fontSize: 11, color: "#A8A29E" }}>
                              {d.category}
                            </div>
                          )}
                        </div>
                        <div
                          style={{
                            fontFamily: "monospace",
                            fontWeight: 700,
                            color: "#F59E0B",
                            fontSize: 15,
                          }}
                        >
                          ₹{d.price}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {dishes.length === 0 && (
                <div style={{ marginTop: 20, fontSize: 13, color: "#C2410C" }}>
                  ⚠️ No dishes found. Add dishes in the Recipes section first.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
