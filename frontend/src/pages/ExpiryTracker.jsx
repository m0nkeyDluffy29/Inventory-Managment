import { useEffect, useState, useCallback } from "react";
import { format, differenceInDays, isPast, isToday } from "date-fns";
import {
  getExpiringSoon,
  getExpiryStats,
  markBatchWasted,
} from "../api/inventoryApi";

// ── Urgency helpers ────────────────────────────────────────────────────────

function urgencyLevel(expiryDate) {
  if (!expiryDate) return "none";
  const date = new Date(expiryDate);
  if (isPast(date) && !isToday(date)) return "expired";
  if (isToday(date)) return "today";
  const days = differenceInDays(date, new Date());
  if (days <= 3) return "critical";
  return "soon";
}

const URGENCY_STYLES = {
  expired: {
    row: "bg-red-50",
    badge: "bg-red-100 text-red-700",
    label: "💀 Expired",
  },
  today: {
    row: "bg-red-50",
    badge: "bg-red-100 text-red-700",
    label: "🔴 Today",
  },
  critical: {
    row: "bg-amber-50",
    badge: "bg-amber-100 text-amber-700",
    label: "🟠 ≤ 3 days",
  },
  soon: {
    row: "bg-yellow-50",
    badge: "bg-yellow-100 text-yellow-700",
    label: "🟡 This week",
  },
  none: { row: "", badge: "bg-gray-100 text-gray-500", label: "No expiry" },
};

// ── Stat card ──────────────────────────────────────────────────────────────

function StatCard({ label, value, colour }) {
  return (
    <div className={`rounded-xl p-4 border ${colour}`}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {label}
      </p>
      <p className="text-3xl font-bold mt-1">{value ?? "—"}</p>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function ExpiryTracker() {
  const [batches, setBatches] = useState([]);
  const [stats, setStats] = useState(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [wasting, setWasting] = useState(null); // batchId currently being wasted
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
    } catch (err) {
      setError("Failed to load expiry data.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const handleMarkWasted = async (batch) => {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          📦 Use First — Expiry Tracker
        </h1>
        <button
          onClick={load}
          disabled={loading}
          className="text-sm text-indigo-600 hover:underline disabled:opacity-40"
        >
          {loading ? "Refreshing…" : "↻ Refresh"}
        </button>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Already Expired"
            value={stats.alreadyExpired}
            colour={
              stats.alreadyExpired > 0
                ? "bg-red-50 border-red-200"
                : "bg-white border-gray-200"
            }
          />
          <StatCard
            label="Expiring Today"
            value={stats.expiringToday}
            colour={
              stats.expiringToday > 0
                ? "bg-red-50 border-red-200"
                : "bg-white border-gray-200"
            }
          />
          <StatCard
            label="Within 3 Days"
            value={stats.expiringIn3Days}
            colour={
              stats.expiringIn3Days > 0
                ? "bg-amber-50 border-amber-200"
                : "bg-white border-gray-200"
            }
          />
          <StatCard
            label="Within 7 Days"
            value={stats.expiringIn7Days}
            colour={
              stats.expiringIn7Days > 0
                ? "bg-yellow-50 border-yellow-200"
                : "bg-white border-gray-200"
            }
          />
        </div>
      )}

      {/* Day filter */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">
          Show batches expiring within:
        </span>
        {[3, 7, 14, 30].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              days === d
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {d} days
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Batch table */}
      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : batches.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center text-green-700">
          <p className="text-2xl mb-1">✅</p>
          <p className="font-medium">No batches expiring within {days} days.</p>
          <p className="text-sm mt-1">
            FIFO deduction is already pulling oldest stock first.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Item</th>
                <th className="px-4 py-3 text-left">Vendor</th>
                <th className="px-4 py-3 text-right">Remaining</th>
                <th className="px-4 py-3 text-right">Unit</th>
                <th className="px-4 py-3 text-left">Expiry Date</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {batches.map((batch) => {
                const urgency = urgencyLevel(batch.expiry_date);
                const style = URGENCY_STYLES[urgency];
                const daysLeft = batch.expiry_date
                  ? differenceInDays(new Date(batch.expiry_date), new Date())
                  : null;

                return (
                  <tr key={batch.id} className={style.row}>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {batch.item?.name}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {batch.vendor?.name || "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">
                      {batch.quantity_remaining}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {batch.item?.unit}
                    </td>
                    <td className="px-4 py-3">
                      {batch.expiry_date
                        ? format(new Date(batch.expiry_date), "dd MMM yyyy")
                        : "—"}
                      {daysLeft !== null && (
                        <span className="ml-2 text-xs text-gray-400">
                          {daysLeft < 0
                            ? `(${Math.abs(daysLeft)}d ago)`
                            : daysLeft === 0
                              ? "(today)"
                              : `(in ${daysLeft}d)`}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.badge}`}
                      >
                        {style.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleMarkWasted(batch)}
                        disabled={wasting === batch.id}
                        className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-lg hover:bg-red-200 disabled:opacity-40 transition-colors"
                      >
                        {wasting === batch.id ? "Writing off…" : "Mark Wasted"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-400">
        💡 FIFO deduction is always active — orders automatically pull from the
        oldest (nearest-expiry) batch first.
      </p>
    </div>
  );
}
