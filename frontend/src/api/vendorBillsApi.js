import axios from "axios";

const api = axios.create({ baseURL: "/api" });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("inv_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getBills = () => api.get("/vendor-bills").then((r) => r.data);
export const getBill = (id) =>
  api.get(`/vendor-bills/${id}`).then((r) => r.data);
export const createBill = (data) =>
  api.post("/vendor-bills", data).then((r) => r.data);
export const confirmBill = (id) =>
  api.put(`/vendor-bills/${id}/confirm`).then((r) => r.data);

// ← updated: backend now expects vendor_id inside FormData
export const scanBill = (formData) =>
  api
    .post("/vendor-bills/scan", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);

// ← new: save staff corrections from BillReviewModal
export const updateBillLineItems = (billId, lines) =>
  api.put(`/vendor-bills/${billId}/line-items`, lines).then((r) => r.data);

export const getDishes = () => api.get("/recipes/dishes").then((r) => r.data);
export const createDish = (data) =>
  api.post("/recipes/dishes", data).then((r) => r.data);
export const getDishRecipe = (id) =>
  api.get(`/recipes/dishes/${id}/recipe`).then((r) => r.data);
export const setDishRecipe = (id, data) =>
  api.put(`/recipes/dishes/${id}/recipe`, data).then((r) => r.data);
