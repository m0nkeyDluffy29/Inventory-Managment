import { useEffect, useState } from "react";
import {
  getDishes,
  createDish,
  getDishRecipe,
  setDishRecipe,
} from "../api/vendorBillsApi";
import { getItems } from "../api/inventoryApi";
import Modal from "../components/shared/Modal";

export default function Recipes() {
  const [dishes, setDishes] = useState([]);
  const [items, setItems] = useState([]);
  const [showDishModal, setShowDishModal] = useState(false);
  const [newDish, setNewDish] = useState({ name: "", price: "", category: "" });
  const [selectedDish, setSelectedDish] = useState(null);
  const [recipe, setRecipe] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const load = () => {
    getDishes().then(setDishes);
    getItems().then(setItems);
  };
  useEffect(() => {
    load();
  }, []);

  const selectDish = async (dish) => {
    setSelectedDish(dish);
    setSaved(false);
    setError("");
    const r = await getDishRecipe(dish.id);
    setRecipe(
      r.map((row) => ({
        item_id: String(row.item_id),
        quantity_required: row.quantity_required,
      })),
    );
  };

  const handleCreateDish = async (e) => {
    e.preventDefault();
    await createDish({ ...newDish, price: Number(newDish.price) });
    setNewDish({ name: "", price: "", category: "" });
    setShowDishModal(false);
    load();
  };

  const saveRecipe = async () => {
    setError("");
    setSaving(true);
    setSaved(false);
    try {
      await setDishRecipe(
        selectedDish.id,
        recipe
          .filter((r) => r.item_id && r.quantity_required)
          .map((r) => ({
            item_id: Number(r.item_id),
            quantity_required: Number(r.quantity_required),
          })),
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save recipe");
    } finally {
      setSaving(false);
    }
  };

  const recipeTotal = recipe.reduce((sum, row) => {
    const item = items.find((i) => i.id === Number(row.item_id));
    return item ? sum + 1 : sum;
  }, 0);

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
          <h1>Dishes & Recipes</h1>
          <p>Map ingredients to dishes — orders deduct stock automatically.</p>
        </div>
        <button onClick={() => setShowDishModal(true)} className="btn-primary">
          + New Dish
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "280px 1fr",
          gap: 20,
          alignItems: "start",
        }}
      >
        {/* Dish list */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div
            style={{ padding: "16px 20px", borderBottom: "1px solid #F5F0E8" }}
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
              {dishes.length} Dish{dishes.length !== 1 ? "es" : ""}
            </div>
          </div>
          {dishes.length === 0 ? (
            <div
              className="empty-state"
              style={{ border: "none", padding: "40px 20px" }}
            >
              <div className="empty-icon" style={{ fontSize: 28 }}>
                🍽
              </div>
              <h3 style={{ fontSize: 14 }}>No dishes yet</h3>
              <p style={{ fontSize: 12 }}>
                Click "+ New Dish" to add your first menu item.
              </p>
            </div>
          ) : (
            <div style={{ padding: "8px 0" }}>
              {dishes.map((d) => (
                <button
                  key={d.id}
                  onClick={() => selectDish(d)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "12px 20px",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "Inter, sans-serif",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background:
                      selectedDish?.id === d.id ? "#FFFBEB" : "transparent",
                    borderLeft:
                      selectedDish?.id === d.id
                        ? "3px solid #F59E0B"
                        : "3px solid transparent",
                    transition: "all 0.15s",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 14,
                        color: "#1C1917",
                      }}
                    >
                      {d.name}
                    </div>
                    {d.category && (
                      <div
                        style={{ fontSize: 11, color: "#A8A29E", marginTop: 2 }}
                      >
                        {d.category}
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontWeight: 700,
                      color: "#F59E0B",
                      fontSize: 14,
                    }}
                  >
                    ₹{d.price}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Recipe editor */}
        <div className="card">
          {!selectedDish ? (
            <div className="empty-state" style={{ border: "none" }}>
              <div className="empty-icon">📋</div>
              <h3>Select a dish</h3>
              <p>Choose a dish from the left to view and edit its recipe.</p>
            </div>
          ) : (
            <>
              {/* Dish info header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 24,
                  paddingBottom: 20,
                  borderBottom: "1px solid #F5F0E8",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#78716C",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Recipe for
                  </div>
                  <div
                    style={{
                      fontFamily: "Playfair Display, serif",
                      fontSize: 22,
                      fontWeight: 700,
                      color: "#1C1917",
                      marginTop: 2,
                    }}
                  >
                    {selectedDish.name}
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                    {selectedDish.category && (
                      <span className="badge badge-blue">
                        {selectedDish.category}
                      </span>
                    )}
                    <span className="badge badge-green">
                      ₹{selectedDish.price}
                    </span>
                    <span className="badge badge-gray">
                      {recipe.filter((r) => r.item_id).length} ingredient
                      {recipe.filter((r) => r.item_id).length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recipe rows */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                {recipe.length === 0 && (
                  <div
                    style={{
                      padding: "20px",
                      textAlign: "center",
                      color: "#A8A29E",
                      fontSize: 13,
                      background: "#FDFAF5",
                      borderRadius: 10,
                      border: "1.5px dashed #E7E0D5",
                    }}
                  >
                    No ingredients yet. Click "Add ingredient" to build this
                    recipe.
                  </div>
                )}
                {recipe.map((row, i) => {
                  const item = items.find(
                    (it) => it.id === Number(row.item_id),
                  );
                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "center",
                        padding: "12px 14px",
                        background: "#FDFAF5",
                        borderRadius: 12,
                        border: "1px solid #F5F0E8",
                      }}
                    >
                      <div
                        style={{
                          flex: 1,
                          fontSize: 13,
                          color: "#78716C",
                          fontWeight: 500,
                          minWidth: 20,
                        }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </div>
                      <select
                        value={row.item_id}
                        onChange={(e) =>
                          setRecipe((r) =>
                            r.map((x, idx) =>
                              idx === i ? { ...x, item_id: e.target.value } : x,
                            ),
                          )
                        }
                        className="input"
                        style={{ flex: 3 }}
                      >
                        <option value="">Select ingredient…</option>
                        {items.map((it) => (
                          <option key={it.id} value={it.id}>
                            {it.name} ({it.unit})
                          </option>
                        ))}
                      </select>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          flex: 1.5,
                        }}
                      >
                        <input
                          type="number"
                          min="0"
                          step="0.001"
                          value={row.quantity_required}
                          onChange={(e) =>
                            setRecipe((r) =>
                              r.map((x, idx) =>
                                idx === i
                                  ? { ...x, quantity_required: e.target.value }
                                  : x,
                              ),
                            )
                          }
                          className="input"
                          style={{ width: 80, textAlign: "right" }}
                          placeholder="Qty"
                        />
                        {item && (
                          <span
                            style={{
                              fontSize: 12,
                              color: "#A8A29E",
                              fontWeight: 500,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.unit}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          setRecipe((r) => r.filter((_, idx) => idx !== i))
                        }
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#A8A29E",
                          fontSize: 18,
                          padding: "0 4px",
                          flexShrink: 0,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() =>
                  setRecipe((r) => [
                    ...r,
                    { item_id: "", quantity_required: "" },
                  ])
                }
                style={{
                  width: "100%",
                  background: "none",
                  border: "1.5px dashed #E7E0D5",
                  borderRadius: 10,
                  padding: "10px",
                  cursor: "pointer",
                  fontSize: 13,
                  color: "#78716C",
                  fontWeight: 600,
                  fontFamily: "Inter, sans-serif",
                  marginBottom: 20,
                }}
              >
                + Add ingredient
              </button>

              {error && (
                <div
                  className="alert-strip alert-red"
                  style={{
                    marginBottom: 12,
                    padding: "10px 14px",
                    fontSize: 13,
                  }}
                >
                  ⚠️ {error}
                </div>
              )}
              {saved && (
                <div
                  className="alert-strip alert-green"
                  style={{
                    marginBottom: 12,
                    padding: "10px 14px",
                    fontSize: 13,
                  }}
                >
                  ✅ Recipe saved successfully!
                </div>
              )}

              <button
                onClick={saveRecipe}
                disabled={saving}
                className="btn-primary"
                style={{
                  width: "100%",
                  padding: 14,
                  fontSize: 15,
                  borderRadius: 12,
                }}
              >
                {saving ? "Saving…" : "💾 Save Recipe"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* New dish modal */}
      {showDishModal && (
        <Modal title="Add New Dish" onClose={() => setShowDishModal(false)}>
          <form
            onSubmit={handleCreateDish}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <div>
              <label className="label">Dish Name</label>
              <input
                value={newDish.name}
                onChange={(e) =>
                  setNewDish((f) => ({ ...f, name: e.target.value }))
                }
                required
                className="input"
                placeholder="e.g. Butter Chicken"
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
                <label className="label">Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newDish.price}
                  onChange={(e) =>
                    setNewDish((f) => ({ ...f, price: e.target.value }))
                  }
                  required
                  className="input"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="label">
                  Category{" "}
                  <span
                    style={{
                      color: "#A8A29E",
                      fontSize: 10,
                      textTransform: "none",
                      letterSpacing: 0,
                    }}
                  >
                    optional
                  </span>
                </label>
                <input
                  value={newDish.category}
                  onChange={(e) =>
                    setNewDish((f) => ({ ...f, category: e.target.value }))
                  }
                  className="input"
                  placeholder="e.g. Main Course"
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button
                type="button"
                onClick={() => setShowDishModal(false)}
                className="btn-ghost"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" style={{ flex: 2 }}>
                Create Dish
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
