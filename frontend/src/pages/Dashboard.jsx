import { useEffect, useState } from "react";
import { getItems, getLowStockItems } from "../api/inventoryApi";
import { getOrders } from "../api/ordersApi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import CautionLevelBadge from "../components/inventory/CautionLevelBadge";

export default function Dashboard() {
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [lowStock, setLowStock] = useState([]);

  useEffect(() => {
    getItems().then(setItems).catch(console.error);
    getOrders().then(setOrders).catch(console.error);
    getLowStockItems().then(setLowStock).catch(console.error);
  }, []);

  const topItems = [...items]
    .sort((a, b) => b.current_stock - a.current_stock)
    .slice(0, 8);
  const todayOrders = orders.filter(
    (o) => new Date(o.created_at).toDateString() === new Date().toDateString(),
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Items", value: items.length },
          {
            label: "Low Stock",
            value: lowStock.length,
            warn: lowStock.length > 0,
          },
          { label: "Orders Today", value: todayOrders.length },
          { label: "Total Orders", value: orders.length },
        ].map((card) => (
          <div
            key={card.label}
            className={`rounded-xl p-4 ${card.warn ? "bg-amber-50 border border-amber-200" : "bg-white border border-gray-200"}`}
          >
            <p className="text-sm text-gray-500">{card.label}</p>
            <p
              className={`text-3xl font-bold mt-1 ${card.warn ? "text-amber-600" : "text-indigo-700"}`}
            >
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {lowStock.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h2 className="font-semibold text-amber-800 mb-2">
            ⚠️ Low Stock Items
          </h2>
          <ul className="space-y-1">
            {lowStock.map((item) => (
              <li key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-700">{item.name}</span>
                <CautionLevelBadge
                  stock={item.current_stock}
                  level={item.caution_level}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-semibold text-gray-700 mb-4">
          Stock Levels (Top 8)
        </h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={topItems}
            margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
          >
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="current_stock" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
