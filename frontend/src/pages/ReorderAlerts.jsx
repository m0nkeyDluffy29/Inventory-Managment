import React from "react"
import { useEffect, useState, useCallback } from "react";
import {
  getLowStockItems,
  triggerReorderAlert,
  sendTestEmail,
  updateCautionLevel,
} from "../api/inventoryApi";
import { useAuth } from "../hooks/useAuth";

function Toast({ msg, type }) {
  return msg ? (
    <div
      className={`toast ${type === "success" ? "toast-success" : "toast-error"}`}
    >
      {msg}
    </div>
  ) : null;
}

function CautionEditor({ item, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(item.caution_level);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleSave = async () => {
    if (Number(value) < 0) return;
    setSaving(true);
    setErr("");
    try {
      await updateCautionLevel(item.id, Number(value));
      setEditing(false);
      onSaved();
    } catch (e) {
      setErr(e.response?.data?.error || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (!editing)
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 600 }}
        >
          {Number(item.caution_level).toFixed(1)}
        </span>
        <button
          onClick={() => {
            setValue(item.caution_level);
            setEditing(true);
          }}
          style={{
            background: "#EDE9E3",
            border: "none",
            borderRadius: 6,
            padding: "3px 10px",
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 600,
            color: "#1C1917",
          }}
        >
          Edit
        </button>
      </div>
    );

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        flexWrap: "wrap",
      }}
    >
      <input
        type="number"
        min="0"
        step="0.1"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus
        style={{
          width: 70,
          padding: "5px 8px",
          border: "1.5px solid #F59E0B",
          borderRadius: 8,
          fontSize: 13,
          fontFamily: "monospace",
        }}
      />
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          background: "#F59E0B",
          border: "none",
          borderRadius: 8,
          padding: "5px 12px",
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        {saving ? "…" : "Save"}
      </button>
      <button
        onClick={() => {
          setEditing(false);
          setErr("");
        }}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#A8A29E",
          fontSize: 13,
        }}
      >
        Cancel
      </button>
      {err && <span style={{ fontSize: 11, color: "#C2410C" }}>{err}</span>}
    </div>
  );
}

export default function ReorderAlerts() {
  const { user } = useAuth();
  const isOwner = user?.role === "owner";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "success" });
  const [lastTriggered, setLastTriggered] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLowStockItems();
      setItems(data);
    } catch {
      showToast("Failed to load low-stock items.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleTrigger = async () => {
    setTriggering(true);
    try {
      const result = await triggerReorderAlert();
      setLastTriggered(new Date());
      showToast(
        result.count === 0
          ? "All items above caution level — no email sent."
          : `✅ Reorder alert sent for ${result.count} item(s)!`,
      );
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to send alert.", "error");
    } finally {
      setTriggering(false);
    }
  };

  const handleTestEmail = async () => {
    setTestingEmail(true);
    try {
      await sendTestEmail();
      showToast("✅ Test email sent — check your inbox.");
    } catch (err) {
      showToast(err.response?.data?.error || "SMTP test failed.", "error");
    } finally {
      setTestingEmail(false);
    }
  };

  const totalDeficit = items.reduce(
    (s, i) => s + Math.max(0, (i.caution_level || 0) - (i.current_stock || 0)),
    0,
  );

  return (
    <div>
      <Toast msg={toast.msg} type={toast.type} />

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
        }}
      >
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Reorder Alerts</h1>
          <p>
            Items below their caution level.
            {lastTriggered && (
              <span style={{ color: "#F59E0B", marginLeft: 6 }}>
                Last sent: {lastTriggered.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        {isOwner && (
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleTestEmail}
              disabled={testingEmail}
              className="btn-ghost"
            >
              {testingEmail ? "Sending…" : "📧 Test Email"}
            </button>
            <button
              onClick={handleTrigger}
              disabled={triggering || items.length === 0}
              className="btn-primary"
              style={{ opacity: items.length === 0 ? 0.4 : 1 }}
            >
              {triggering ? "Sending…" : "🚨 Send Alert Now"}
            </button>
          </div>
        )}
      </div>

      {/* Info card */}
      <div
        className="card"
        style={{
          display: "flex",
          gap: 16,
          alignItems: "flex-start",
          marginBottom: 24,
          borderLeft: "4px solid #1C1917",
        }}
      >
        <div style={{ fontSize: 28, flexShrink: 0 }}>🗓</div>
        <div>
          <div
            style={{
              fontFamily: "Playfair Display, serif",
              fontSize: 17,
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            Automatic Weekly Email
          </div>
          <div style={{ fontSize: 14, color: "#78716C", lineHeight: 1.6 }}>
            Every <strong>Sunday at 8:00 PM</strong>, the system emails the
            owner a formatted reorder list for all items below caution level.
            {isOwner && ' Use "Send Alert Now" to trigger it immediately.'}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 16,
        }}
      >
        <button onClick={load} disabled={loading} className="btn-ghost">
          {loading ? "Refreshing…" : "↻ Refresh"}
        </button>
      </div>

      {loading ? (
        <div className="spinner-wrap">
          <div className="spinner" />
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <h3>All items are above their caution level</h3>
          <p>
            No reorder email will be sent this week. Great job keeping stock
            levels up!
          </p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
              marginBottom: 20,
            }}
          >
            <div
              className="card"
              style={{ borderTop: "3px solid #C2410C", padding: "16px 20px" }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#78716C",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Items to Reorder
              </div>
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 700,
                  fontFamily: "Playfair Display, serif",
                  color: "#C2410C",
                  marginTop: 4,
                }}
              >
                {items.length}
              </div>
            </div>
            <div
              className="card"
              style={{ borderTop: "3px solid #D97706", padding: "16px 20px" }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#78716C",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Total Units Deficit
              </div>
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 700,
                  fontFamily: "Playfair Display, serif",
                  color: "#D97706",
                  marginTop: 4,
                }}
              >
                {totalDeficit.toFixed(1)}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th style={{ textAlign: "right" }}>Current Stock</th>
                  <th style={{ textAlign: "right" }}>Caution Level</th>
                  <th style={{ textAlign: "right" }}>Deficit</th>
                  <th style={{ textAlign: "right" }}>Unit</th>
                  {isOwner && <th>Edit Threshold</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const deficit = Math.max(
                    0,
                    (item.caution_level || 0) - (item.current_stock || 0),
                  );
                  return (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 700, color: "#1C1917" }}>
                        {item.name}
                      </td>
                      <td>
                        {item.category ? (
                          <span className="badge badge-blue">
                            {item.category}
                          </span>
                        ) : (
                          <span style={{ color: "#A8A29E" }}>—</span>
                        )}
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          fontFamily: "monospace",
                          fontWeight: 700,
                          color: "#C2410C",
                          fontSize: 15,
                        }}
                      >
                        {Number(item.current_stock).toFixed(2)}
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          fontFamily: "monospace",
                          color: "#78716C",
                        }}
                      >
                        {Number(item.caution_level).toFixed(2)}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span className="badge badge-red">
                          -{deficit.toFixed(2)}
                        </span>
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          color: "#78716C",
                          fontSize: 13,
                        }}
                      >
                        {item.unit}
                      </td>
                      {isOwner && (
                        <td>
                          <CautionEditor item={item} onSaved={load} />
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!isOwner && (
            <p
              style={{
                fontSize: 12,
                color: "#A8A29E",
                textAlign: "center",
                marginTop: 12,
              }}
            >
              Contact the owner to edit caution levels or trigger email alerts.
            </p>
          )}
        </>
      )}
    </div>
  );
}
