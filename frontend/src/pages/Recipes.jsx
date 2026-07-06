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
  const [error, setError] = useState("");

  const load = () => {
    getDishes().then(setDishes);
    getItems().then(setItems);
  };
  useEffect(() => {
    load();
  }, []);

  const handleCreateDish = async (e) => {
    e.preventDefault();
    await createDish({ ...newDish, price: Number(newDish.price) });
    setShowDishModal(false);
    load();
  };

  const selectDish = async (dish) => {
    setSelectedDish(dish);
    const r = await getDishRecipe(dish.id);
    setRecipe(
      r.map((row) => ({
        item_id: row.item_id,
        quantity_required: row.quantity_required,
      })),
    );
  };

  const saveRecipe = async () => {
    setError("");
    try {
      await setDishRecipe(
        selectedDish.id,
        recipe.map((r) => ({
          item_id: Number(r.item_id),
          quantity_required: Number(r.quantity_required),
        })),
      );
      alert("Recipe saved!");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save recipe");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Dishes & Recipes</h1>
        <button
          onClick={() => setShowDishModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          + New Dish
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
          <h2 className="font-semibold text-gray-700">Dishes</h2>
          {dishes.map((d) => (
            <button
              key={d.id}
              onClick={() => selectDish(d)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedDish?.id === d.id ? "bg-indigo-100 text-indigo-700" : "hover:bg-gray-100"}`}
            >
              <span className="font-medium">{d.name}</span>
              <span className="text-gray-400 ml-2">₹{d.price}</span>
            </button>
          ))}
          {!dishes.length && (
            <p className="text-gray-400 text-sm">No dishes yet.</p>
          )}
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          {selectedDish ? (
            <>
              <h2 className="font-semibold text-gray-700">
                Recipe for: {selectedDish.name}
              </h2>
              {recipe.map((row, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select
                    value={row.item_id}
                    onChange={(e) =>
                      setRecipe((r) =>
                        r.map((x, idx) =>
                          idx === i ? { ...x, item_id: e.target.value } : x,
                        ),
                      )
                    }
                    className="flex-1 border rounded-lg px-2 py-1.5 text-sm"
                  >
                    <option value="">Select ingredient…</option>
                    {items.map((it) => (
                      <option key={it.id} value={it.id}>
                        {it.name} ({it.unit})
                      </option>
                    ))}
                  </select>
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
                    placeholder="Qty"
                    className="w-20 border rounded-lg px-2 py-1.5 text-sm"
                  />
                  <button
                    onClick={() =>
                      setRecipe((r) => r.filter((_, idx) => idx !== i))
                    }
                    className="text-red-500 text-sm"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={() =>
                  setRecipe((r) => [
                    ...r,
                    { item_id: "", quantity_required: "" },
                  ])
                }
                className="text-indigo-600 text-sm hover:underline"
              >
                + Add ingredient
              </button>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <button
                onClick={saveRecipe}
                className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700"
              >
                Save Recipe
              </button>
            </>
          ) : (
            <p className="text-gray-400 text-sm">
              Select a dish to edit its recipe.
            </p>
          )}
        </div>
      </div>
      {showDishModal && (
        <Modal title="New Dish" onClose={() => setShowDishModal(false)}>
          <form onSubmit={handleCreateDish} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                value={newDish.name}
                onChange={(e) =>
                  setNewDish((f) => ({ ...f, name: e.target.value }))
                }
                required
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newDish.price}
                  onChange={(e) =>
                    setNewDish((f) => ({ ...f, price: e.target.value }))
                  }
                  required
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  value={newDish.category}
                  onChange={(e) =>
                    setNewDish((f) => ({ ...f, category: e.target.value }))
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              Create Dish
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
