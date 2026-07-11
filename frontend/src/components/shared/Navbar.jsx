import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const navLinks = [
  { to: "/", label: "Dashboard" },
  { to: "/inventory", label: "Inventory" },
  { to: "/delivery/new", label: "New Delivery" },
  { to: "/orders/new", label: "New Order" },
  { to: "/recipes", label: "Recipes" },
  { to: "/expiry", label: "Expiry" },
  { to: "/alerts", label: "Alerts" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Logo */}
        <span className="font-bold text-indigo-700 text-lg">🍽 Inventory</span>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                location.pathname === link.to
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-gray-600 hover:text-indigo-700 hover:bg-gray-100"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop user info */}
        <div className="hidden md:flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {user?.name} ({user?.role})
          </span>
          <button
            onClick={handleLogout}
            className="text-sm text-red-600 hover:underline"
          >
            Logout
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 px-4 py-3 space-y-1 bg-white">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                location.pathname === link.to
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="border-t border-gray-100 pt-2 mt-2 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {user?.name} ({user?.role})
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:underline"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
