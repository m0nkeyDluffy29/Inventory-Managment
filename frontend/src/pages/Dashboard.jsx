import { useEffect, useState } from "react";
import {
  getItems,
  getLowStockItems,
  getExpiringSoon,
  getExpiryStats,
} from "../api/inventoryApi"; // ← getExpiringSoon + getExpiryStats added
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
import { format, differenceInDays, isPast, isToday } from "date-fns"; // ← date-fns added
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [expiringSoon, setExpiringSoon] = useState([]); // ← NEW
  const [expiryStats, setExpiryStats] = useState(null); // ← NEW

  useEffect(() => {
    getItems().then(setItems).catch(console.error);
    getOrders().then(setOrders).catch(console.error);
    getLowStockItems().then(setLowStock).catch(console.error);
    getExpiringSoon(3).then(setExpiringSoon).catch(console.error); // ← NEW
    getExpiryStats().then(setExpiryStats).catch(console.error); // ← NEW
  }, []);

  const topItems = [...items]
    .sort((a, b) => b.current_stock - a.current_stock)
    .slice(0, 8);
  const todayOrders = orders.filter(
    (o) => new Date(o.created_at).toDateString() === new Date().toDateString(),
  );
  const urgentExpiry =
    (expiryStats?.alreadyExpired || 0) + (expiryStats?.expiringToday || 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Items", value: items.length },
          {
            label: "Low Stock",
            value: lowStock.length,
            warn: lowStock.length > 0,
          },
          {
            label: "Expiring Soon",
            value: expiryStats?.expiringIn7Days ?? "…",
            warn: urgentExpiry > 0,
          }, // ← NEW
          { label: "Orders Today", value: todayOrders.length },
        ].map((card) => (
          <div
            key={card.label}
            className={`rounded-xl p-4 border ${card.warn ? "bg-amber-50 border-amber-200" : "bg-white border-gray-200"}`}
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

      {/* ── NEW: Expiring Soon panel ───────────────────────────────────── */}
      {expiringSoon.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-amber-800">
              ⏰ Use First — Expiring Within 3 Days
            </h2>
            <Link
              to="/expiry"
              className="text-xs text-amber-700 hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {expiringSoon.slice(0, 5).map((batch) => {
              const daysLeft = differenceInDays(
                new Date(batch.expiry_date),
                new Date(),
              );
              const isExpired =
                isPast(new Date(batch.expiry_date)) &&
                !isToday(new Date(batch.expiry_date));
              return (
                <div
                  key={batch.id}
                  className="flex items-center justify-between text-sm bg-white/70 rounded-lg px-3 py-2"
                >
                  <div>
                    <span className="font-medium text-gray-800">
                      {batch.item?.name}
                    </span>
                    <span className="text-gray-400 ml-2 text-xs">
                      {batch.vendor?.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-gray-700">
                      {batch.quantity_remaining} {batch.item?.unit}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        isExpired
                          ? "bg-red-100 text-red-700"
                          : daysLeft === 0
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {isExpired
                        ? "💀 Expired"
                        : daysLeft === 0
                          ? "🔴 Today"
                          : `🟠 ${daysLeft}d left`}
                    </span>
                  </div>
                </div>
              );
            })}
            {expiringSoon.length > 5 && (
              <Link
                to="/expiry"
                className="block text-center text-xs text-amber-700 hover:underline pt-1"
              >
                +{expiringSoon.length - 5} more — view all
              </Link>
            )}
          </div>
        </div>
      )}
      {/* ── end new panel ─────────────────────────────────────────────── */}

      {/* Low stock alert (unchanged) */}
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

      {/* Stock chart (unchanged) */}
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
