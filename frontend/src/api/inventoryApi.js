import axios from 'axios';

const api = axios.create({ baseURL: '/api' });
api.interceptors.request.use(config => {
  const token = localStorage.getItem('inv_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

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