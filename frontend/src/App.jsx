import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom"; // ← add Link here
import { useAuth } from "./hooks/useAuth";
import Navbar from "./components/shared/Navbar";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import NewDelivery from "./pages/NewDelivery";
import NewOrder from "./pages/NewOrder";
import Recipes from "./pages/Recipes";
import ExpiryTracker from "./pages/ExpiryTracker";
import ReorderAlerts from "./pages/ReorderAlerts";
import Login from "./pages/Login";

function PrivateRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <div className="min-h-screen bg-gray-50">
                <Navbar />
                <main className="max-w-7xl mx-auto px-4 py-6">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/delivery/new" element={<NewDelivery />} />
                    <Route path="/orders/new" element={<NewOrder />} />
                    <Route path="/recipes" element={<Recipes />} />
                    <Route path="/expiry" element={<ExpiryTracker />} />
                    <Route path="/alerts" element={<ReorderAlerts />} />

                    {/* ← ADD this as the last route */}
                    <Route
                      path="*"
                      element={
                        <div className="text-center py-20">
                          <p className="text-4xl mb-3">🔍</p>
                          <h2 className="text-xl font-bold text-gray-700">
                            Page not found
                          </h2>
                          <Link
                            to="/"
                            className="text-indigo-600 hover:underline text-sm mt-2 block"
                          >
                            ← Back to Dashboard
                          </Link>
                        </div>
                      }
                    />
                  </Routes>
                </main>
              </div>
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
