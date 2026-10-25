// client/src/services/authService.js
import { api } from "../api";

export const authService = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  getMe: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout"),
  updateProfile: (data) => api.patch("/auth/profile", data),
  changePassword: (data) => api.patch("/auth/password", data),
  togglePremium: (isPremium) => api.patch("/auth/premium", { isPremium }),
};

export default authService;