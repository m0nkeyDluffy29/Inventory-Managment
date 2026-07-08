import axios from 'axios';

const api = axios.create({ baseURL: '/api' });
api.interceptors.request.use(config => {
  const token = localStorage.getItem('inv_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── unchanged from Phase 1 ────────────────────────────────────────────────
export const getItems        = ()           => api.get('/inventory').then(r => r.data);
export const createItem      = (data)       => api.post('/inventory', data).then(r => r.data);
export const updateItem      = (id, data)   => api.put(`/inventory/${id}`, data).then(r => r.data);
export const deleteItem      = (id)         => api.delete(`/inventory/${id}`);
export const getItemBatches  = (id)         => api.get(`/inventory/${id}/batches`).then(r => r.data);
export const addDelivery     = (data)       => api.post('/inventory/deliveries', data).then(r => r.data);
export const getVendors      = ()           => api.get('/inventory/vendors').then(r => r.data);
export const createVendor    = (data)       => api.post('/inventory/vendors', data).then(r => r.data);
export const updateVendor    = (id, data)   => api.put(`/inventory/vendors/${id}`, data).then(r => r.data);
export const deleteVendor    = (id)         => api.delete(`/inventory/vendors/${id}`);
export const getLowStockItems= ()           => api.get('/alerts/low-stock').then(r => r.data);

// ── NEW in Phase 3 ────────────────────────────────────────────────────────

/** Batches expiring within `days` days (default 7), qty_remaining > 0, sorted ASC */
export const getExpiringSoon   = (days = 7) =>
  api.get(`/expiry/soon?days=${days}`).then(r => r.data);

/** Summary counts: alreadyExpired / expiringToday / in3Days / in7Days */
export const getExpiryStats    = () =>
  api.get('/expiry/stats').then(r => r.data);

/** Write off a batch's remaining qty as wastage */
export const markBatchWasted   = (batchId, reason = 'expired') =>
  api.post(`/expiry/${batchId}/waste`, { reason }).then(r => r.data);

/** Alternative path — from Inventory page batch list */
export const markBatchWastedFromInventory = (batchId, reason = 'manual_write_off') =>
  api.post(`/inventory/batches/${batchId}/waste`, { reason }).then(r => r.data);