import { useEffect, useState, useCallback } from "react";
import {
  getLowStockItems,
  triggerReorderAlert,
  sendTestEmail,
  updateCautionLevel,
} from "../api/inventoryApi";
import { useAuth } from "../hooks/useAuth";
import Spinner from "../components/shared/Spinner";

// ── Inline caution-level editor ───────────────────────────────────────────

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

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-mono">{item.caution_level}</span>
        <button
          onClick={() => {
            setValue(item.caution_level);
            setEditing(true);
          }}
          className="text-xs text-indigo-600 hover:underline"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        min="0"
        step="0.1"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-20 border rounded px-2 py-0.5 text-sm"
        autoFocus
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 disabled:opacity-50"
      >
        {saving ? "…" : "Save"}
      </button>
      <button
        onClick={() => {
          setEditing(false);
          setErr("");
        }}
        className="text-xs text-gray-500 hover:underline"
      >
        Cancel
      </button>
      {err && <span className="text-xs text-red-600">{err}</span>}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function ReorderAlerts() {
  const { user } = useAuth();
  const isOwner = user?.role === "owner";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("success"); // 'success' | 'error'
  const [lastTriggered, setLastTriggered] = useState(null);

  const showToast = (msg, type = "success") => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(""), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLowStockItems();
      setItems(data);
    } catch (err) {
      showToast("Failed to load low-stock items.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Manual trigger
  const handleTrigger = async () => {
    setTriggering(true);
    try {
      const result = await triggerReorderAlert();
      setLastTriggered(new Date());
      if (result.count === 0) {
        showToast(
          "All items are above caution level — no email sent.",
          "success",
        );
      } else {
        showToast(
          `✅ Reorder alert sent for ${result.count} item(s)!`,
          "success",
        );
      }
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to send alert.", "error");
    } finally {
      setTriggering(false);
    }
  };

  // SMTP test
  const handleTestEmail = async () => {
    setTestingEmail(true);
    try {
      await sendTestEmail();
      showToast("✅ Test email sent — check your inbox.", "success");
    } catch (err) {
      showToast(
        err.response?.data?.error || "SMTP test failed — check .env settings.",
        "error",
      );
    } finally {
      setTestingEmail(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMsg && (
        <div
          className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
            toastType === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reorder Alerts</h1>
          <p className="text-gray-500 text-sm mt-1">
            Items below their caution level. Weekly email fires automatically
            every Sunday at 8 PM.
          </p>
          {lastTriggered && (
            <p className="text-xs text-indigo-600 mt-1">
              Last manually triggered: {lastTriggered.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Owner-only actions */}
        {isOwner && (
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleTestEmail}
              disabled={testingEmail}
              className="text-sm border border-gray-300 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              {testingEmail ? "Sending…" : "📧 Test Email"}
            </button>
            <button
              onClick={handleTrigger}
              disabled={triggering || items.length === 0}
              className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
            >
              {triggering ? "Sending…" : "🚨 Send Alert Now"}
            </button>
          </div>
        )}
      </div>

      {/* Weekly schedule info card */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-start gap-3">
        <span className="text-2xl">🗓</span>
        <div>
          <p className="text-sm font-semibold text-indigo-800">
            Automatic Weekly Email
          </p>
          <p className="text-sm text-indigo-700 mt-0.5">
            Every <strong>Sunday at 8:00 PM</strong>, the system compares
            current stock against each item's caution level and emails the owner
            a formatted reorder list — automatically. Use "Send Alert Now" to
            trigger it immediately at any time.
          </p>
        </div>
      </div>

      {/* Refresh */}
      <div className="flex justify-end">
        <button
          onClick={load}
          disabled={loading}
          className="text-sm text-indigo-600 hover:underline disabled:opacity-40"
        >
          {loading ? "Refreshing…" : "↻ Refresh"}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <p className="text-4xl mb-2">✅</p>
          <p className="font-semibold text-green-700">
            All items are above their caution level!
          </p>
          <p className="text-sm text-green-600 mt-1">
            No reorder email will be sent this week.
          </p>
        </div>
      ) : (
        <>
          {/* Summary strip */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 flex items-center justify-between">
            <p className="text-amber-800 font-semibold">
              ⚠️ {items.length} item{items.length > 1 ? "s" : ""} need
              restocking
            </p>
            <p className="text-amber-700 text-sm">
              Total deficit:{" "}
              {items.reduce((s, i) => s + (i.deficit || 0), 0).toFixed(2)} units
              across all items
            </p>
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Item</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-right">Current Stock</th>
                  <th className="px-4 py-3 text-right">Caution Level</th>
                  <th className="px-4 py-3 text-right">Deficit</th>
                  <th className="px-4 py-3 text-right">Unit</th>
                  {isOwner && (
                    <th className="px-4 py-3 text-left">Edit Caution</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-amber-50">
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      {item.name}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {item.category || "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-red-600 font-bold">
                      {Number(item.current_stock).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-600">
                      {Number(item.caution_level).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-amber-700">
                      -
                      {Number(
                        item.deficit || item.caution_level - item.current_stock,
                      ).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {item.unit}
                    </td>
                    {isOwner && (
                      <td className="px-4 py-3">
                        <CautionEditor item={item} onSaved={load} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!isOwner && (
            <p className="text-xs text-gray-400 text-center">
              Only owners can edit caution levels or trigger email alerts.
            </p>
          )}
        </>
      )}
    </div>
  );
}
