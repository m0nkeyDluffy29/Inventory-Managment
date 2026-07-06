import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
