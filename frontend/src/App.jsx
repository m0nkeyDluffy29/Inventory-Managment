import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Sidebar from "./components/shared/Sidebar";
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
              <div className="app-shell">
                <Sidebar />
                <main
                  className="main-content"
                  style={{ padding: "32px 32px 32px", paddingTop: "32px" }}
                >
                  {/* Mobile top spacing */}
                  <div className="md:hidden" style={{ height: 56 }} />
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/delivery/new" element={<NewDelivery />} />
                    <Route path="/orders/new" element={<NewOrder />} />
                    <Route path="/recipes" element={<Recipes />} />
                    <Route path="/expiry" element={<ExpiryTracker />} />
                    <Route path="/alerts" element={<ReorderAlerts />} />
                    <Route
                      path="*"
                      element={
                        <div className="empty-state" style={{ marginTop: 80 }}>
                          <div className="empty-icon">🔍</div>
                          <h3>Page not found</h3>
                          <p>The page you're looking for doesn't exist.</p>
                          <Link
                            to="/"
                            style={{
                              display: "inline-block",
                              marginTop: 16,
                              color: "#F59E0B",
                              fontSize: 14,
                              fontWeight: 600,
                              textDecoration: "none",
                            }}
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
