import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../hooks/useAuth";
import api from "../api/inventoryApi";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      setLoading(true);
      const { data } = await axios.post(
        "https://inventory-managment-production-8d06.up.railway.app/api/auth/login",
        { email, password },
      );
      login(data.token, data.user);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "#1C1917",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Left panel — branding */}
      <div
        style={{
          flex: 1,
          display: "none",
          flexDirection: "column",
          justifyContent: "center",
          padding: "64px",
          background: "linear-gradient(135deg, #1C1917 0%, #292524 100%)",
          position: "relative",
          overflow: "hidden",
        }}
        className="login-left"
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 400,
            height: 400,
            background: "rgba(245,158,11,0.06)",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -60,
            left: -60,
            width: 300,
            height: 300,
            background: "rgba(245,158,11,0.04)",
            borderRadius: "50%",
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 60,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                background: "#F59E0B",
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
              }}
            >
              🍽
            </div>
            <span
              style={{
                fontFamily: "Playfair Display, serif",
                color: "#fff",
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              Inventory
            </span>
          </div>

          <h1
            style={{
              fontFamily: "Playfair Display, serif",
              color: "#fff",
              fontSize: 48,
              fontWeight: 700,
              lineHeight: 1.15,
              margin: "0 0 20px",
            }}
          >
            Smart Kitchen,
            <br />
            <span style={{ color: "#F59E0B" }}>Zero Waste.</span>
          </h1>
          <p
            style={{
              color: "#A8A29E",
              fontSize: 16,
              lineHeight: 1.7,
              margin: 0,
              maxWidth: 380,
            }}
          >
            Automate vendor deliveries, track expiry dates, and get weekly
            reorder alerts — all in one place.
          </p>

          <div
            style={{
              marginTop: 56,
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            {[
              {
                icon: "📦",
                text: "Scan vendor bills — stock updates automatically",
              },
              {
                icon: "🧾",
                text: "Orders deduct the right ingredients, instantly",
              },
              { icon: "⏰", text: "FIFO expiry tracking stops food waste" },
            ].map((item) => (
              <div
                key={item.text}
                style={{ display: "flex", alignItems: "center", gap: 14 }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    background: "rgba(245,158,11,0.12)",
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </div>
                <span style={{ color: "#D6D3D1", fontSize: 14 }}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "48px 40px",
          background: "#FDFAF5",
          margin: "0 auto",
        }}
      >
        {/* Mobile logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              background: "#F59E0B",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
            }}
          >
            🍽
          </div>
          <span
            style={{
              fontFamily: "Playfair Display, serif",
              fontSize: 20,
              fontWeight: 700,
              color: "#1C1917",
            }}
          >
            Inventory
          </span>
        </div>

        <h2
          style={{
            fontFamily: "Playfair Display, serif",
            fontSize: 28,
            fontWeight: 700,
            color: "#1C1917",
            margin: "0 0 6px",
          }}
        >
          Welcome back
        </h2>
        <p style={{ color: "#78716C", fontSize: 14, margin: "0 0 36px" }}>
          Sign in to manage your restaurant inventory
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 20 }}
        >
          <div>
            <label className="label">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="input"
              placeholder="owner@restaurant.com"
            />
          </div>

          <div>
            <label className="label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div
              className="alert-strip alert-red"
              style={{ fontSize: 13, padding: "10px 14px" }}
            >
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              width: "100%",
              padding: "14px",
              fontSize: 15,
              borderRadius: 12,
              marginTop: 4,
            }}
          >
            {loading ? "Signing in…" : "Sign in →"}
          </button>
        </form>

        <p
          style={{
            color: "#A8A29E",
            fontSize: 12,
            textAlign: "center",
            marginTop: 32,
          }}
        >
          Restaurant Inventory Management System
        </p>
      </div>
    </div>
  );
}
