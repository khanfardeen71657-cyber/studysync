// client/src/api.js
import axios from "axios";

// ═══════════════════════════════════════════════════════════════
// BASE URL
// ═══════════════════════════════════════════════════════════════
const baseURL =
  (import.meta.env.VITE_API_URL || "http://localhost:5001") + "/api";

// ═══════════════════════════════════════════════════════════════
// AXIOS INSTANCE
// ═══════════════════════════════════════════════════════════════
export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ═══════════════════════════════════════════════════════════════
// REQUEST INTERCEPTOR — attach token
// ═══════════════════════════════════════════════════════════════
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ═══════════════════════════════════════════════════════════════
// RESPONSE INTERCEPTOR — normalize errors
// ═══════════════════════════════════════════════════════════════
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg =
      err?.response?.data?.message ||
      err.message ||
      "Request failed";
    return Promise.reject(new Error(msg));
  }
);

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

// ✅ File upload — auto-detects form-data
api.upload = (url, formData) =>
  api.post(url, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// ✅ Alias for DELETE (kyunki kuch code mein `api.del` use hua tha)
api.del = (url, config) => api.delete(url, config);

export default api;