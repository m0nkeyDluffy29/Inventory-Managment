import { useEffect, useState } from "react";
import {
  getItems,
  getLowStockItems,
  getExpiringSoon,
  getExpiryStats,
} from "../api/inventoryApi";
import { getOrders } from "../api/ordersApi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { differenceInDays, isPast, isToday, format } from "date-fns";
import { Link } from "react-router-dom";

function StatCard({ icon, label, value, sub, variant = "default", to }) {
  const colours = {
    default: { border: "#E7E0D5", top: "#F59E0B", val: "#1C1917" },
    warn: { border: "#FECACA", top: "#C2410C", val: "#C2410C" },
    good: { border: "#BBF7D0", top: "#65A30D", val: "#166534" },
    amber: { border: "#FDE68A", top: "#D97706", val: "#92400E" },
  };
  const c = colours[variant];

  const inner = (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${c.border}`,
        borderRadius: 16,
        padding: "20px 24px",
        position: "relative",
        overflow: "hidden",
        cursor: to ? "pointer" : "default",
        transition: "box-shadow 0.15s",
        textDecoration: "none",
        display: "block",
      }}
      onMouseOver={(e) =>
        to && (e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)")
      }
      onMouseOut={(e) => to && (e.currentTarget.style.boxShadow = "none")}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: c.top,
          borderRadius: "16px 16px 0 0",
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#78716C",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 8,
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: c.val,
              lineHeight: 1,
              fontFamily: "Playfair Display, serif",
            }}
          >
            {value}
          </div>
          {sub && (
            <div style={{ fontSize: 12, color: "#A8A29E", marginTop: 6 }}>
              {sub}
            </div>
          )}
        </div>
        <div style={{ fontSize: 28, opacity: 0.7 }}>{icon}</div>
      </div>
    </div>
  );

  return to ? (
    <Link to={to} style={{ textDecoration: "none" }}>
      {inner}
    </Link>
  ) : (
    inner
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#1C1917",
        color: "#fff",
        padding: "10px 14px",
        borderRadius: 10,
        fontSize: 13,
      }}
    >
      <div style={{ fontWeight: 600 }}>{label}</div>
      <div style={{ color: "#F59E0B", marginTop: 4 }}>
        {payload[0].value} units
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [expiringSoon, setExpiringSoon] = useState([]);
  const [expiryStats, setExpiryStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getItems().then(setItems),
      getOrders().then(setOrders),
      getLowStockItems().then(setLowStock),
      getExpiringSoon(3).then(setExpiringSoon),
      getExpiryStats().then(setExpiryStats),
    ])
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="spinner-wrap">
        <div className="spinner" />
      </div>
    );

  const topItems = [...items]
    .sort((a, b) => b.current_stock - a.current_stock)
    .slice(0, 8);
  const todayOrders = orders.filter(
    (o) => new Date(o.created_at).toDateString() === new Date().toDateString(),
  );
  const urgentExpiry =
    (expiryStats?.alreadyExpired || 0) + (expiryStats?.expiringToday || 0);

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>
          Good{" "}
          {new Date().getHours() < 12
            ? "morning"
            : new Date().getHours() < 17
              ? "afternoon"
              : "evening"}{" "}
          — here's your kitchen at a glance.
        </p>
      </div>

      {/* KPI grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <StatCard
          icon="📦"
          label="Total Items"
          value={items.length}
          sub="ingredients tracked"
        />
        <StatCard
          icon="🧾"
          label="Orders Today"
          value={todayOrders.length}
          sub={`₹${todayOrders.reduce((s, o) => s + o.total_amount, 0).toFixed(0)} revenue`}
        />
        <StatCard
          icon="⚠️"
          label="Low Stock"
          value={lowStock.length}
          variant={lowStock.length > 0 ? "warn" : "good"}
          sub="need reordering"
          to="/alerts"
        />
        <StatCard
          icon="⏰"
          label="Expiring Soon"
          value={expiryStats?.expiringIn7Days ?? "…"}
          variant={urgentExpiry > 0 ? "amber" : "good"}
          sub="within 7 days"
          to="/expiry"
        />
      </div>

      {/* Alerts row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            expiringSoon.length > 0 && lowStock.length > 0 ? "1fr 1fr" : "1fr",
          gap: 16,
          marginBottom: 28,
        }}
      >
        {/* Expiry panel */}
        {expiringSoon.length > 0 && (
          <div className="card" style={{ borderLeft: "4px solid #D97706" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#D97706",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Use First
                </div>
                <div
                  style={{
                    fontFamily: "Playfair Display, serif",
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#1C1917",
                  }}
                >
                  Expiring Within 3 Days
                </div>
              </div>
              <Link
                to="/expiry"
                style={{
                  fontSize: 12,
                  color: "#D97706",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                View all →
              </Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {expiringSoon.slice(0, 4).map((batch) => {
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
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 14px",
                      background: "#FDFAF5",
                      borderRadius: 10,
                      border: "1px solid #F5F0E8",
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
                        {batch.item?.name}
                      </div>
                      <div
                        style={{ fontSize: 12, color: "#78716C", marginTop: 2 }}
                      >
                        {batch.quantity_remaining} {batch.item?.unit} remaining
                      </div>
                    </div>
                    <span
                      className={`badge ${isExpired ? "badge-red" : daysLeft === 0 ? "badge-red" : "badge-amber"}`}
                    >
                      {isExpired
                        ? "💀 Expired"
                        : daysLeft === 0
                          ? "🔴 Today"
                          : `🟠 ${daysLeft}d`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Low stock panel */}
        {lowStock.length > 0 && (
          <div className="card" style={{ borderLeft: "4px solid #C2410C" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#C2410C",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Reorder Needed
                </div>
                <div
                  style={{
                    fontFamily: "Playfair Display, serif",
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#1C1917",
                  }}
                >
                  {lowStock.length} Items Below Threshold
                </div>
              </div>
              <Link
                to="/alerts"
                style={{
                  fontSize: 12,
                  color: "#C2410C",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Manage →
              </Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {lowStock.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    background: "#FDFAF5",
                    borderRadius: 10,
                    border: "1px solid #F5F0E8",
                  }}
                >
                  <div
                    style={{ fontWeight: 600, fontSize: 14, color: "#1C1917" }}
                  >
                    {item.name}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontFamily: "monospace",
                        fontSize: 13,
                        color: "#C2410C",
                        fontWeight: 700,
                      }}
                    >
                      {Number(item.current_stock).toFixed(1)} {item.unit}
                    </div>
                    <div style={{ fontSize: 11, color: "#A8A29E" }}>
                      min: {Number(item.caution_level).toFixed(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stock chart */}
      <div className="card">
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#78716C",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Inventory Overview
          </div>
          <div
            style={{
              fontFamily: "Playfair Display, serif",
              fontSize: 20,
              fontWeight: 700,
              color: "#1C1917",
            }}
          >
            Stock Levels — Top 8 Items
          </div>
        </div>
        {topItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3>No data yet</h3>
            <p>Add inventory items to see the chart.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={topItems}
              margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
            >
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "#78716C" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#78716C" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(245,158,11,0.06)" }}
              />
              <Bar dataKey="current_stock" radius={[6, 6, 0, 0]}>
                {topItems.map((item, i) => (
                  <Cell
                    key={i}
                    fill={
                      item.caution_level > 0 &&
                      item.current_stock < item.caution_level
                        ? "#FCA5A5"
                        : "#F59E0B"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
        <div style={{ display: "flex", gap: 20, marginTop: 12 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: "#78716C",
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                background: "#F59E0B",
                borderRadius: 3,
              }}
            />{" "}
            Normal stock
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: "#78716C",
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                background: "#FCA5A5",
                borderRadius: 3,
              }}
            />{" "}
            Below caution level
          </div>
        </div>
      </div>
    </div>
  );
}
