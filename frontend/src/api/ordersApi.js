import axios from "axios";

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "") + "/api",
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("inv_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getOrders = () => api.get("/orders").then((r) => r.data);
export const getOrder = (id) => api.get(`/orders/${id}`).then((r) => r.data);
export const createOrder = (data) =>
  api.post("/orders", data).then((r) => r.data);
