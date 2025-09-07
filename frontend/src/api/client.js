import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
  withCredentials: true,
});

let isRefreshing = false;
let pendingResolvers = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config || {};
    if (error?.response?.status === 401 && !original._retry) {
      original._retry = true;
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          await api.post("/auth/refresh");
          pendingResolvers.forEach((r) => r.resolve());
        } catch (e) {
          pendingResolvers.forEach((r) => r.reject(e));
          throw error;
        } finally {
          isRefreshing = false;
          pendingResolvers = [];
        }
      }
      await new Promise((resolve, reject) => pendingResolvers.push({ resolve, reject }));
      return api(original);
    }
    throw error;
  }
);


