import React from "react"
import { useEffect, useState } from "react";
import {
  getItems,
  createItem,
  updateItem,
  deleteItem,
  updateCautionLevel,
} from "../api/inventoryApi";
import Modal from "../components/shared/Modal";

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

  if (!editing)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          justifyContent: "flex-end",
        }}
      >
        <span style={{ fontFamily: "monospace", fontSize: 13 }}>
          {item.caution_level}
        </span>
        <button
          onClick={() => {
            setVal(item.caution_level);
            setEditing(true);
          }}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#A8A29E",
            fontSize: 13,
            padding: "2px 4px",
          }}
          title="Edit caution level"
        >
          ✎
        </button>
      </div>
    );

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        justifyContent: "flex-end",
      }}
    >
      <input
        type="number"
        min="0"
        step="0.1"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        style={{
          width: 60,
          padding: "4px 6px",
          border: "1.5px solid #F59E0B",
          borderRadius: 6,
          fontSize: 12,
          fontFamily: "monospace",
        }}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") setEditing(false);
        }}
      />
      <button
        onClick={save}
        disabled={saving}
        style={{
          background: "#F59E0B",
          border: "none",
          borderRadius: 6,
          padding: "4px 8px",
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        {saving ? "…" : "✓"}
      </button>
      <button
        onClick={() => setEditing(false)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#A8A29E",
          fontSize: 13,
        }}
      >
        ✕
      </button>
    </div>
  );
}

function StatusBadge({ item }) {
  if (item.caution_level === 0)
    return <span className="badge badge-gray">No threshold</span>;
  if (item.current_stock <= 0)
    return <span className="badge badge-red">🔴 Out of stock</span>;
  if (item.current_stock < item.caution_level) {
    const deficit = (item.caution_level - item.current_stock).toFixed(1);
    return (
      <span className="badge badge-amber">⚠️ Low — need {deficit} more</span>
    );
  }
  return <span className="badge badge-green">✓ OK</span>;
}

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    getItems()
      .then(setItems)
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditItem(null);
    setForm(EMPTY);
    setError("");
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
    setError("");
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
    if (!confirm("Delete this item? This cannot be undone.")) return;
    await deleteItem(id);
    load();
  };

  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      (i.category || "").toLowerCase().includes(search.toLowerCase()),
  );

  const lowCount = items.filter(
    (i) => i.caution_level > 0 && i.current_stock < i.caution_level,
  ).length;

  return (
    <div>
      <div className="page-header">
        <h1>Inventory Items</h1>
        <p>Track and manage all your ingredients and supplies.</p>
      </div>

      {/* Summary strip */}
      {lowCount > 0 && (
        <div className="alert-strip alert-amber" style={{ marginBottom: 20 }}>
          ⚠️{" "}
          <strong>
            {lowCount} item{lowCount > 1 ? "s" : ""}
          </strong>{" "}
          are below their caution level and need reordering.
        </div>
      )}

      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 20,
          alignItems: "center",
        }}
      >
        <input
          type="text"
          placeholder="Search items or category…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input"
          style={{ maxWidth: 320 }}
        />
        <div style={{ flex: 1 }} />
        <button onClick={openCreate} className="btn-primary">
          + Add Item
        </button>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div className="spinner-wrap">
            <div className="spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="empty-state"
            style={{ border: "none", borderRadius: 16 }}
          >
            <div className="empty-icon">📦</div>
            <h3>
              {search ? "No items match your search" : "No inventory items yet"}
            </h3>
            <p>
              {search
                ? "Try a different search term."
                : 'Click "+ Add Item" to add your first ingredient.'}
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th style={{ textAlign: "right" }}>Stock</th>
                <th style={{ textAlign: "right" }}>Unit</th>
                <th style={{ textAlign: "right" }}>Caution Level ✎</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const isLow =
                  item.caution_level > 0 &&
                  item.current_stock < item.caution_level;
                return (
                  <tr
                    key={item.id}
                    style={{ background: isLow ? "#FFFBEB" : undefined }}
                  >
                    <td style={{ fontWeight: 600, color: "#1C1917" }}>
                      {item.name}
                    </td>
                    <td style={{ color: "#78716C" }}>
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
                        color: isLow ? "#C2410C" : "#1C1917",
                        fontSize: 15,
                      }}
                    >
                      {item.current_stock}
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
                    <td style={{ textAlign: "right" }}>
                      <QuickCautionEdit item={item} onSaved={load} />
                    </td>
                    <td>
                      <StatusBadge item={item} />
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          justifyContent: "flex-end",
                        }}
                      >
                        <button
                          onClick={() => openEdit(item)}
                          style={{
                            background: "#EDE9E3",
                            border: "none",
                            borderRadius: 7,
                            padding: "5px 12px",
                            cursor: "pointer",
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#1C1917",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="btn-danger"
                          style={{ padding: "5px 10px" }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Item count */}
      {!loading && filtered.length > 0 && (
        <p
          style={{
            fontSize: 12,
            color: "#A8A29E",
            marginTop: 10,
            textAlign: "right",
          }}
        >
          Showing {filtered.length} of {items.length} items
        </p>
      )}

      {/* Modal */}
      {showModal && (
        <Modal
          title={editItem ? `Edit — ${editItem.name}` : "New Inventory Item"}
          onClose={() => setShowModal(false)}
        >
          <form
            onSubmit={handleSave}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <div>
              <label className="label">Item Name</label>
              <input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                required
                className="input"
                placeholder="e.g. Tomatoes"
              />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <div>
                <label className="label">Unit</label>
                <select
                  value={form.unit}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, unit: e.target.value }))
                  }
                  className="input"
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">
                  Caution Level{" "}
                  <span
                    style={{
                      color: "#A8A29E",
                      fontSize: 10,
                      fontWeight: 400,
                      textTransform: "none",
                      letterSpacing: 0,
                    }}
                  >
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
                  className="input"
                />
              </div>
            </div>
            <div>
              <label className="label">Category</label>
              <input
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
                className="input"
                placeholder="e.g. Vegetables, Dairy, Grains"
              />
            </div>
            {error && (
              <div
                className="alert-strip alert-red"
                style={{ padding: "10px 14px", fontSize: 13 }}
              >
                ⚠️ {error}
              </div>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn-ghost"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" style={{ flex: 2 }}>
                {editItem ? "Save Changes" : "Add Item"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
