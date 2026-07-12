import React from "react"
import { useEffect, useState, useCallback } from "react";
import { format, differenceInDays, isPast, isToday } from "date-fns";
import {
  getExpiringSoon,
  getExpiryStats,
  markBatchWasted,
} from "../api/inventoryApi";

function urgencyLevel(expiryDate) {
  if (!expiryDate) return "none";
  const date = new Date(expiryDate);
  if (isPast(date) && !isToday(date)) return "expired";
  if (isToday(date)) return "today";
  const days = differenceInDays(date, new Date());
  if (days <= 3) return "critical";
  return "soon";
}

const URGENCY = {
  expired: {
    bg: "#FEF2F2",
    badge: "badge-red",
    label: "💀 Expired",
    row: "#FEF2F2",
  },
  today: {
    bg: "#FEF2F2",
    badge: "badge-red",
    label: "🔴 Today",
    row: "#FEF2F2",
  },
  critical: {
    bg: "#FFFBEB",
    badge: "badge-amber",
    label: "🟠 ≤ 3 days",
    row: "#FFFBEB",
  },
  soon: {
    bg: "#FEFCE8",
    badge: "badge-amber",
    label: "🟡 This week",
    row: "#FEFCE8",
  },
  none: { bg: "#fff", badge: "badge-gray", label: "No expiry", row: "#fff" },
};

function StatCard({ label, value, colour, icon }) {
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${colour.border}`,
        borderRadius: 14,
        padding: "18px 20px",
        borderTop: `3px solid ${colour.top}`,
      }}
    >
      <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
      <div
        style={{
          fontSize: 30,
          fontWeight: 700,
          fontFamily: "Playfair Display, serif",
          color: colour.val,
        }}
      >
        {value ?? "—"}
      </div>
      <div
        style={{
          fontSize: 12,
          color: "#78716C",
          marginTop: 4,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </div>
    </div>
  );
}

export default function ExpiryTracker() {
  const [batches, setBatches] = useState([]);
  const [stats, setStats] = useState(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [wasting, setWasting] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [b, s] = await Promise.all([
        getExpiringSoon(days),
        getExpiryStats(),
      ]);
      setBatches(b);
      setStats(s);
    } catch {
      setError("Failed to load expiry data.");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const handleWaste = async (batch) => {
    if (
      !confirm(
        `Write off ${batch.quantity_remaining} ${batch.item.unit} of "${batch.item.name}" as wastage?`,
      )
    )
      return;
    setWasting(batch.id);
    setError("");
    try {
      await markBatchWasted(batch.id, "expired");
      await load();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to mark as wasted");
    } finally {
      setWasting(null);
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 28,
        }}
      >
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Expiry Tracker</h1>
          <p>
            Use oldest stock first — FIFO deduction is always active on orders.
          </p>
        </div>
        <button onClick={load} disabled={loading} className="btn-ghost">
          {loading ? "Refreshing…" : "↻ Refresh"}
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 14,
            marginBottom: 24,
          }}
        >
          <StatCard
            label="Already Expired"
            value={stats.alreadyExpired}
            icon="💀"
            colour={
              stats.alreadyExpired > 0
                ? { border: "#FECACA", top: "#C2410C", val: "#C2410C" }
                : { border: "#E7E0D5", top: "#A8A29E", val: "#1C1917" }
            }
          />
          <StatCard
            label="Expiring Today"
            value={stats.expiringToday}
            icon="🔴"
            colour={
              stats.expiringToday > 0
                ? { border: "#FECACA", top: "#C2410C", val: "#C2410C" }
                : { border: "#E7E0D5", top: "#A8A29E", val: "#1C1917" }
            }
          />
          <StatCard
            label="Within 3 Days"
            value={stats.expiringIn3Days}
            icon="🟠"
            colour={
              stats.expiringIn3Days > 0
                ? { border: "#FDE68A", top: "#D97706", val: "#92400E" }
                : { border: "#E7E0D5", top: "#A8A29E", val: "#1C1917" }
            }
          />
          <StatCard
            label="Within 7 Days"
            value={stats.expiringIn7Days}
            icon="🟡"
            colour={
              stats.expiringIn7Days > 0
                ? { border: "#FDE68A", top: "#D97706", val: "#92400E" }
                : { border: "#E7E0D5", top: "#A8A29E", val: "#1C1917" }
            }
          />
        </div>
      )}

      {/* Filter */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 20,
        }}
      >
        <span style={{ fontSize: 13, color: "#78716C", fontWeight: 500 }}>
          Show batches expiring within:
        </span>
        {[3, 7, 14, 30].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            style={{
              padding: "6px 16px",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s",
              background: days === d ? "#1C1917" : "#F5F0E8",
              color: days === d ? "#F59E0B" : "#78716C",
            }}
          >
            {d}d
          </button>
        ))}
      </div>

      {error && (
        <div className="alert-strip alert-red" style={{ marginBottom: 16 }}>
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="spinner-wrap">
          <div className="spinner" />
        </div>
      ) : batches.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <h3>No batches expiring within {days} days</h3>
          <p>
            Your stock is fresh. FIFO is pulling from the oldest batches
            automatically.
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Vendor</th>
                <th style={{ textAlign: "right" }}>Remaining</th>
                <th style={{ textAlign: "right" }}>Unit</th>
                <th>Expiry Date</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((batch) => {
                const urgency = urgencyLevel(batch.expiry_date);
                const style = URGENCY[urgency];
                const daysLeft = batch.expiry_date
                  ? differenceInDays(new Date(batch.expiry_date), new Date())
                  : null;
                return (
                  <tr key={batch.id} style={{ background: style.row }}>
                    <td style={{ fontWeight: 600, color: "#1C1917" }}>
                      {batch.item?.name}
                    </td>
                    <td style={{ color: "#78716C" }}>
                      {batch.vendor?.name || "—"}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        fontFamily: "monospace",
                        fontWeight: 700,
                        fontSize: 15,
                      }}
                    >
                      {batch.quantity_remaining}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        color: "#78716C",
                        fontSize: 13,
                      }}
                    >
                      {batch.item?.unit}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>
                        {batch.expiry_date
                          ? format(new Date(batch.expiry_date), "dd MMM yyyy")
                          : "—"}
                      </div>
                      {daysLeft !== null && (
                        <div
                          style={{
                            fontSize: 11,
                            color: "#A8A29E",
                            marginTop: 2,
                          }}
                        >
                          {daysLeft < 0
                            ? `${Math.abs(daysLeft)}d ago`
                            : daysLeft === 0
                              ? "today"
                              : `in ${daysLeft}d`}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${style.badge}`}>
                        {style.label}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {batch.quantity_remaining > 0 && (
                        <button
                          onClick={() => handleWaste(batch)}
                          disabled={wasting === batch.id}
                          className="btn-danger"
                        >
                          {wasting === batch.id
                            ? "Writing off…"
                            : "Mark Wasted"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ fontSize: 12, color: "#A8A29E", marginTop: 16 }}>
        💡 Orders automatically deduct from the nearest-expiry batch first
        (FIFO). Use "Mark Wasted" only for stock that cannot be used.
      </p>
    </div>
  );
}
