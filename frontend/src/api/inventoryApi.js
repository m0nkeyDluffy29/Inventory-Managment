import axios from "axios";

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "") + "/api",
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("inv_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Phase 1 — unchanged ───────────────────────────────────────────────────
export const getItems = () => api.get("/inventory").then((r) => r.data);
export const createItem = (data) =>
  api.post("/inventory", data).then((r) => r.data);
export const updateItem = (id, data) =>
  api.put(`/inventory/${id}`, data).then((r) => r.data);
export const deleteItem = (id) => api.delete(`/inventory/${id}`);
export const getItemBatches = (id) =>
  api.get(`/inventory/${id}/batches`).then((r) => r.data);
export const addDelivery = (data) =>
  api.post("/inventory/deliveries", data).then((r) => r.data);
export const getVendors = () =>
  api.get("/inventory/vendors").then((r) => r.data);
export const createVendor = (data) =>
  api.post("/inventory/vendors", data).then((r) => r.data);
export const updateVendor = (id, data) =>
  api.put(`/inventory/vendors/${id}`, data).then((r) => r.data);
export const deleteVendor = (id) => api.delete(`/inventory/vendors/${id}`);
export const getLowStockItems = () =>
  api.get("/alerts/low-stock").then((r) => r.data);

// ── Phase 3 — unchanged ───────────────────────────────────────────────────
export const getExpiringSoon = (days = 7) =>
  api.get(`/expiry/soon?days=${days}`).then((r) => r.data);
export const getExpiryStats = () =>
  api.get("/expiry/stats").then((r) => r.data);
export const markBatchWasted = (batchId, reason = "expired") =>
  api.post(`/expiry/${batchId}/waste`, { reason }).then((r) => r.data);
export const markBatchWastedFromInventory = (
  batchId,
  reason = "manual_write_off",
) =>
  api
    .post(`/inventory/batches/${batchId}/waste`, { reason })
    .then((r) => r.data);

// ── Phase 4 — NEW ─────────────────────────────────────────────────────────

/** Manually fire the reorder alert email right now (owner only) */
export const triggerReorderAlert = () =>
  api.post("/alerts/trigger").then((r) => r.data);

/** Send a test email to verify SMTP config (owner only) */
export const sendTestEmail = (to) =>
  api.post("/alerts/test-email", { to }).then((r) => r.data);

/** Update the caution_level for a single item (owner only) */
export const updateCautionLevel = (id, caution_level) =>
  api.put(`/alerts/caution-level/${id}`, { caution_level }).then((r) => r.data);
