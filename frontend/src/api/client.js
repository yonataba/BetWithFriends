import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

// Attach JWT access token to every request (except public auth endpoints)
const NO_AUTH_ENDPOINTS = ["/auth/google/", "/auth/login/", "/auth/register/", "/auth/token/refresh/"];
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token && !NO_AUTH_ENDPOINTS.includes(config.url)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, attempt a token refresh; on second failure, force logout
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem("refresh_token");
      if (refresh) {
        try {
          const { data } = await axios.post("/api/auth/token/refresh/", { refresh });
          localStorage.setItem("access_token", data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch {
          // Refresh failed — clear tokens so AuthContext redirects to login
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
