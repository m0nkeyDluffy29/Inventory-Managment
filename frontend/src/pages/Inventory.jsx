import { useEffect, useState } from "react";
import {
  getItems,
  createItem,
  updateItem,
  deleteItem,
} from "../api/inventoryApi";
import InventoryTable from "../components/inventory/InventoryTable";
import Modal from "../components/shared/Modal";

const UNITS = ["kg", "L", "pcs", "g", "ml"];
const EMPTY = { name: "", unit: "kg", caution_level: 0, category: "" };

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");

  const load = () => getItems().then(setItems);
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Inventory Items</h1>
        <button
          onClick={openCreate}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          + Add Item
        </button>
      </div>

      <InventoryTable items={items} onEdit={openEdit} onDelete={handleDelete} />

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
                </label>
                <input
                  type="number"
                  min="0"
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
