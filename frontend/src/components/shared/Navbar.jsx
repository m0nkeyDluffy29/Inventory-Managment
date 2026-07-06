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

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-1">
          <span className="font-bold text-indigo-700 mr-4 text-lg">
            🍽 Inventory
          </span>
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
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {user?.name} ({user?.role})
          </span>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="text-sm text-red-600 hover:underline"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
