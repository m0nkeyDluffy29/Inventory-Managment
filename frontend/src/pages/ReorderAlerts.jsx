import { useEffect, useState } from "react";
import { getLowStockItems } from "../api/inventoryApi";

export default function ReorderAlerts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLowStockItems()
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Reorder Alerts</h1>
      <p className="text-gray-500 text-sm">
        Items currently below caution level. Weekly email alerts activate in
        Phase 4.
      </p>
      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : items.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-green-700">
          ✅ All items are above caution level.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Item</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3 text-right">Caution</th>
                <th className="px-4 py-3 text-right">Unit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="bg-amber-50">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {item.name}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {item.category || "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-red-600">
                    {item.current_stock}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {item.caution_level}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {item.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
