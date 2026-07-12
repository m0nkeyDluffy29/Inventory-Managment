import React from "react"
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const NAV = [
  { to: "/", icon: "▦", label: "Dashboard" },
  { to: "/inventory", icon: "📦", label: "Inventory" },
  { to: "/delivery/new", icon: "🚚", label: "New Delivery" },
  { to: "/orders/new", icon: "🧾", label: "New Order" },
  { to: "/recipes", icon: "📋", label: "Recipes" },
  { to: "/expiry", icon: "⏰", label: "Expiry Tracker" },
  { to: "/alerts", icon: "🔔", label: "Reorder Alerts" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const NavContent = () => (
    <div
      style={{
        width: 240,
        background: "#1C1917",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
      }}
    >
      {/* Logo */}
      <div style={{ padding: "28px 20px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              background: "#F59E0B",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              flexShrink: 0,
            }}
          >
            🍽
          </div>
          <div>
            <div
              style={{
                fontFamily: "Playfair Display, serif",
                color: "#fff",
                fontSize: 16,
                fontWeight: 700,
                lineHeight: 1.2,
              }}
            >
              Inventory
            </div>
            <div style={{ color: "#78716C", fontSize: 11 }}>
              Restaurant System
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          height: 1,
          background: "rgba(255,255,255,0.07)",
          margin: "0 16px 8px",
        }}
      />

      {/* Nav links */}
      <nav style={{ flex: 1, padding: "4px 0" }}>
        {NAV.map((link) => {
          const active = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 16px",
                margin: "2px 10px",
                borderRadius: 10,
                color: active ? "#1C1917" : "#A8A29E",
                background: active ? "#F59E0B" : "transparent",
                fontWeight: active ? 700 : 500,
                fontSize: 14,
                textDecoration: "none",
                transition: "background 0.15s, color 0.15s",
                fontFamily: "Inter, sans-serif",
              }}
              onMouseOver={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                  e.currentTarget.style.color = "#fff";
                }
              }}
              onMouseOut={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#A8A29E";
                }
              }}
            >
              <span
                style={{
                  fontSize: 16,
                  width: 22,
                  textAlign: "center",
                  flexShrink: 0,
                }}
              >
                {link.icon}
              </span>
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div
        style={{
          height: 1,
          background: "rgba(255,255,255,0.07)",
          margin: "8px 16px",
        }}
      />

      {/* User section */}
      <div style={{ padding: "12px 16px 20px" }}>
        <div
          style={{
            background: "rgba(255,255,255,0.06)",
            borderRadius: 12,
            padding: "12px 14px",
            marginBottom: 10,
          }}
        >
          <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>
            {user?.name}
          </div>
          <div style={{ color: "#78716C", fontSize: 11, marginTop: 2 }}>
            {user?.email}
          </div>
          <div
            style={{
              display: "inline-block",
              marginTop: 6,
              background:
                user?.role === "owner" ? "#F59E0B" : "rgba(255,255,255,0.1)",
              color: user?.role === "owner" ? "#1C1917" : "#A8A29E",
              fontSize: 10,
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 999,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {user?.role}
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.06)",
            border: "none",
            color: "#A8A29E",
            padding: "10px",
            borderRadius: 10,
            cursor: "pointer",
            fontSize: 13,
            fontFamily: "Inter, sans-serif",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.12)")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.06)")
          }
        >
          ↩ Sign out
        </button>
      </div>
    </div>
  );

  // ── DESKTOP — fixed left sidebar ─────────────────────────────────────────
  if (!isMobile) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: 240,
          zIndex: 40,
        }}
      >
        <NavContent />
      </div>
    );
  }

  // ── MOBILE — top bar + drawer ─────────────────────────────────────────────
  return (
    <>
      {/* Top bar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 56,
          background: "#1C1917",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          zIndex: 50,
          boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              background: "#F59E0B",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}
          >
            🍽
          </div>
          <span
            style={{
              fontFamily: "Playfair Display, serif",
              color: "#fff",
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            Inventory
          </span>
        </div>
        <button
          onClick={() => setMobileOpen((o) => !o)}
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "none",
            color: "#fff",
            width: 40,
            height: 40,
            borderRadius: 10,
            cursor: "pointer",
            fontSize: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 48,
          }}
        />
      )}

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: 260,
          zIndex: 49,
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s ease",
        }}
      >
        <NavContent />
      </div>
    </>
  );
}
