import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// 请求拦截器 — 自动带上 token
client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器 — token 过期时自动刷新
client.interceptors.response.use(
  (res) => {
    if (res.data && typeof res.data === 'object' && 'success' in res.data && 'data' in res.data) {
      return { ...res, data: res.data.data };
    }
    return res;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.data?.error?.message) {
      error.response.data.message = error.response.data.error.message;
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        try {
          const res = await axios.post('/api/auth/refresh', { refreshToken });
          const authData = res.data?.data || res.data;
          const { accessToken, refreshToken: newRefresh } = authData;
          useAuthStore.getState().setTokens(accessToken, newRefresh);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return client(originalRequest);
        } catch {
          useAuthStore.getState().logout();
        }
      } else {
        useAuthStore.getState().logout();
      }
    }

    return Promise.reject(error);
  },
);

export default client;
