import React from "react"
import { format, differenceInDays, isPast, isToday } from "date-fns";
import { useState } from "react";
import { markBatchWastedFromInventory } from "../../api/inventoryApi";

function expiryColour(expiryDate) {
  if (!expiryDate) return "";
  const date = new Date(expiryDate);
  if (isPast(date) && !isToday(date)) return "text-red-600 font-bold";
  if (isToday(date)) return "text-red-600 font-semibold";
  const days = differenceInDays(date, new Date());
  if (days <= 3) return "text-amber-600 font-semibold";
  return "text-gray-700";
}

export default function StockBatchList({ batches, onRefresh }) {
  const [wasting, setWasting] = useState(null);
  const [error, setError] = useState("");

  if (!batches?.length)
    return <p className="text-gray-500 text-sm">No batches for this item.</p>;

  const handleWaste = async (batch) => {
    if (
      !confirm(
        `Write off ${batch.quantity_remaining} ${batch.item?.unit ?? ""} as wastage?`,
      )
    )
      return;
    setError("");
    setWasting(batch.id);
    try {
      await markBatchWastedFromInventory(batch.id, "manual_write_off");
      onRefresh?.();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to mark as wasted");
    } finally {
      setWasting(null);
    }
  };

  return (
    <div className="space-y-2">
      {error && <p className="text-red-600 text-xs">{error}</p>}
      <div className="overflow-x-auto rounded-lg border border-gray-200 mt-2">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-3 py-2 text-left">Vendor</th>
              <th className="px-3 py-2 text-left">Received</th>
              <th className="px-3 py-2 text-right">Qty In</th>
              <th className="px-3 py-2 text-right">Remaining</th>
              <th className="px-3 py-2 text-left">Expiry</th>
              <th className="px-3 py-2 text-right">Unit Price</th>
              <th className="px-3 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {batches.map((b) => {
              const expired =
                b.expiry_date &&
                isPast(new Date(b.expiry_date)) &&
                !isToday(new Date(b.expiry_date));
              const daysLeft = b.expiry_date
                ? differenceInDays(new Date(b.expiry_date), new Date())
                : null;

              return (
                <tr
                  key={b.id}
                  className={expired ? "bg-red-50" : "hover:bg-gray-50"}
                >
                  <td className="px-3 py-2">{b.vendor?.name || "—"}</td>
                  <td className="px-3 py-2 text-gray-500 text-xs">
                    {b.received_date
                      ? format(new Date(b.received_date), "dd MMM yy")
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    {b.quantity_received}
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-semibold">
                    {b.quantity_remaining}
                  </td>
                  <td className="px-3 py-2">
                    {b.expiry_date ? (
                      <span className={expiryColour(b.expiry_date)}>
                        {format(new Date(b.expiry_date), "dd MMM yyyy")}
                        {daysLeft !== null && (
                          <span className="ml-1 text-xs font-normal text-gray-400">
                            {daysLeft < 0
                              ? `(${Math.abs(daysLeft)}d ago)`
                              : daysLeft === 0
                                ? "(today)"
                                : `(${daysLeft}d)`}
                          </span>
                        )}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {b.unit_price ? `₹${b.unit_price}` : "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {b.quantity_remaining > 0 && (
                      <button
                        onClick={() => handleWaste(b)}
                        disabled={wasting === b.id}
                        className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 disabled:opacity-40"
                      >
                        {wasting === b.id ? "…" : "Waste"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
