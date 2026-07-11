import { useEffect, useState } from "react";
import {
  getItems,
  createItem,
  updateItem,
  deleteItem,
} from "../api/inventoryApi";
import { updateCautionLevel } from "../api/inventoryApi";
import InventoryTable from "../components/inventory/InventoryTable";
import Modal from "../components/shared/Modal";
import Spinner from "../components/shared/Spinner"; // ← ADD

const UNITS = ["kg", "L", "pcs", "g", "ml"];
const EMPTY = { name: "", unit: "kg", caution_level: 0, category: "" };

function QuickCautionEdit({ item, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(item.caution_level);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await updateCautionLevel(item.id, Number(val));
      setEditing(false);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className="flex items-center gap-1 justify-end">
        <span className="font-mono">{item.caution_level}</span>
        <button
          onClick={() => {
            setVal(item.caution_level);
            setEditing(true);
          }}
          className="text-indigo-400 hover:text-indigo-600 text-xs ml-1"
        >
          ✎
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 justify-end">
      <input
        type="number"
        min="0"
        step="0.1"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="w-16 border rounded px-1.5 py-0.5 text-xs"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") setEditing(false);
        }}
      />
      <button
        onClick={save}
        disabled={saving}
        className="text-xs text-green-600 hover:underline disabled:opacity-40"
      >
        {saving ? "…" : "✓"}
      </button>
      <button
        onClick={() => setEditing(false)}
        className="text-xs text-gray-400 hover:underline"
      >
        ✕
      </button>
    </div>
  );
}

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true); // ← ADD

  const load = () => {
    setLoading(true); // ← ADD
    getItems()
      .then(setItems)
      .finally(() => setLoading(false)); // ← ADD
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditItem(null);
    setForm(EMPTY);
    setShowModal(true);
  };
  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name,
      unit: item.unit,
      caution_level: item.caution_level,
      category: item.category || "",
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const payload = { ...form, caution_level: Number(form.caution_level) };
      editItem
        ? await updateItem(editItem.id, payload)
        : await createItem(payload);
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this item?")) return;
    await deleteItem(id);
    load();
  };

  const lowCount = items.filter(
    (i) => i.caution_level > 0 && i.current_stock < i.caution_level,
  ).length;

  // ← ADD
  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Inventory Items</h1>
          {lowCount > 0 && (
            <p className="text-sm text-amber-700 mt-0.5">
              ⚠️ {lowCount} item{lowCount > 1 ? "s" : ""} below caution level
            </p>
          )}
        </div>
        <button
          onClick={openCreate}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          + Add Item
        </button>
      </div>

      <InventoryTablePhase4
        items={items}
        onEdit={openEdit}
        onDelete={handleDelete}
        onRefresh={load}
        QuickCautionEdit={QuickCautionEdit}
      />

      {showModal && (
        <Modal
          title={editItem ? "Edit Item" : "New Item"}
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                required
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit
                </label>
                <select
                  value={form.unit}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, unit: e.target.value }))
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Caution Level
                  <span className="text-gray-400 font-normal ml-1 text-xs">
                    (reorder threshold)
                  </span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.caution_level}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, caution_level: e.target.value }))
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <input
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="e.g. Vegetables"
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              Save
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function InventoryTablePhase4({
  items,
  onEdit,
  onDelete,
  onRefresh,
  QuickCautionEdit,
}) {
  if (!items?.length)
    return (
      <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
        <p className="text-4xl mb-2">📦</p>
        <p className="font-medium text-gray-600">No inventory items yet</p>
        <p className="text-sm text-gray-400 mt-1">
          Click "+ Add Item" to add your first ingredient.
        </p>
      </div>
    );

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
          <tr>
            <th className="px-4 py-3 text-left">Name</th>
            <th className="px-4 py-3 text-left">Category</th>
            <th className="px-4 py-3 text-right">Stock</th>
            <th className="px-4 py-3 text-right">Unit</th>
            <th className="px-4 py-3 text-right">Caution Level ✎</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((item) => {
            const isLow =
              item.caution_level > 0 && item.current_stock < item.caution_level;
            const deficit = isLow
              ? (item.caution_level - item.current_stock).toFixed(2)
              : null;
            return (
              <tr
                key={item.id}
                className={
                  isLow ? "bg-amber-50 hover:bg-amber-100" : "hover:bg-gray-50"
                }
              >
                <td className="px-4 py-3 font-medium text-gray-800">
                  {item.name}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {item.category || "—"}
                </td>
                <td
                  className={`px-4 py-3 text-right font-mono ${isLow ? "text-red-600 font-bold" : ""}`}
                >
                  {item.current_stock}
                </td>
                <td className="px-4 py-3 text-right text-gray-500">
                  {item.unit}
                </td>
                <td className="px-4 py-3 text-right">
                  <QuickCautionEdit item={item} onSaved={onRefresh} />
                </td>
                <td className="px-4 py-3">
                  {item.caution_level === 0 ? (
                    <span className="text-gray-400 text-xs">No threshold</span>
                  ) : item.current_stock <= 0 ? (
                    <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">
                      Out of stock
                    </span>
                  ) : isLow ? (
                    <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">
                      Low — need {deficit} more
                    </span>
                  ) : (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                      OK
                    </span>
                  )}
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
