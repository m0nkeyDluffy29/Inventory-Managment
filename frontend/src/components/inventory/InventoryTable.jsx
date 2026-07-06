import CautionLevelBadge from "./CautionLevelBadge";

export default function InventoryTable({ items, onEdit, onDelete }) {
  if (!items?.length)
    return <p className="text-gray-500 text-sm">No inventory items found.</p>;
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
          <tr>
            <th className="px-4 py-3 text-left">Name</th>
            <th className="px-4 py-3 text-left">Category</th>
            <th className="px-4 py-3 text-right">Stock</th>
            <th className="px-4 py-3 text-right">Unit</th>
            <th className="px-4 py-3 text-right">Caution</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-800">
                {item.name}
              </td>
              <td className="px-4 py-3 text-gray-500">
                {item.category || "—"}
              </td>
              <td className="px-4 py-3 text-right font-mono">
                {item.current_stock}
              </td>
              <td className="px-4 py-3 text-right text-gray-500">
                {item.unit}
              </td>
              <td className="px-4 py-3 text-right font-mono">
                {item.caution_level}
              </td>
              <td className="px-4 py-3">
                <CautionLevelBadge
                  stock={item.current_stock}
                  level={item.caution_level}
                />
              </td>
              <td className="px-4 py-3 text-right space-x-2">
                <button
                  onClick={() => onEdit(item)}
                  className="text-indigo-600 hover:underline text-xs"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  className="text-red-500 hover:underline text-xs"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
