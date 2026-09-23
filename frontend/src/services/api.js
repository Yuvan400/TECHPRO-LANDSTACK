import axios from 'axios';
import { getCachedParcels, getCachedParcelByUlpin, cacheParcels } from './indexedDbService';

const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('landstack_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401/403 and offline caching
api.interceptors.response.use(
  (response) => {
    // Cache parcel data in background when fetched online
    if (response.config.url === '/api/parcels' && Array.isArray(response.data)) {
      cacheParcels(response.data).catch(() => {});
    }
    return response;
  },
  async (error) => {
    // Network Error or Offline fallback
    if (!navigator.onLine || error.code === 'ERR_NETWORK' || !error.response) {
      const url = error.config?.url;
      if (url === '/api/parcels') {
        const cached = await getCachedParcels();
        if (cached && cached.length > 0) {
          return { data: cached, status: 200, fromCache: true };
        }
      } else if (url && url.startsWith('/api/parcels/')) {
        const ulpin = url.split('/').pop();
        const cached = await getCachedParcelByUlpin(ulpin);
        if (cached) {
          return { data: cached, status: 200, fromCache: true };
        }
      }
    }

    if (error.response?.status === 401) {
      // Clear token on 401
      localStorage.removeItem('landstack_token');
      localStorage.removeItem('landstack_user');
      const isStaffRoute = window.location.pathname.startsWith('/admin') ||
                           window.location.pathname.startsWith('/supervisor') ||
                           window.location.pathname.startsWith('/field') ||
                           window.location.pathname.startsWith('/staff');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = isStaffRoute ? '/staff/login' : '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
