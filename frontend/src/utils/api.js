import axios from 'axios';

/**
 * Express mounts all routes under /api.
 * Connecting directly to the live Render backend instance.
 */
function resolveApiBaseURL() {
  // 🚀 Direct Render ka URL return kar rahe hain taaki koi galti na ho
  return 'https://ass-9.onrender.com/api';
}

const API = axios.create({
  baseURL: resolveApiBaseURL(),
  timeout: 30000,
});

// Attach JWT token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('visipass_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
API.interceptors.response.use(
  (res) => res,
  (err) => {
    const requestUrl = err.config?.url || '';
    const isLoginRequest = requestUrl.endsWith('/auth/login');

    if (err.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('visipass_token');
      localStorage.removeItem('visipass_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────
export const authAPI = {
  login: (data) => API.post('/auth/login', data),
  register: (data) => API.post('/auth/register', data),
  getMe: () => API.get('/auth/me'),
  updatePassword: (data) => API.put('/auth/update-password', data),
};

// ── Visitors ──────────────────────────────────────────────
export const visitorsAPI = {
  getAll: (params) => API.get('/visitors', { params }),
  getOne: (id) => API.get(`/visitors/${id}`),
  create: (data) => API.post('/visitors', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => API.put(`/visitors/${id}`, data),
  approve: (id) => API.put(`/visitors/${id}/approve`),
  reject: (id) => API.put(`/visitors/${id}/reject`),
  delete: (id) => API.delete(`/visitors/${id}`),
};

// ── Appointments ─────────────────────────────────────────
export const appointmentsAPI = {
  getAll: (params) => API.get('/appointments', { params }),
  create: (data) => API.post('/appointments', data),
  update: (id, data) => API.put(`/appointments/${id}`, data),
  delete: (id) => API.delete(`/appointments/${id}`),
  getPreRegister: (token) => API.get(`/appointments/pre-register/${encodeURIComponent(token)}`),
  submitPreRegister: (token, data) => API.put(`/appointments/pre-register/${encodeURIComponent(token)}`, data),
};

// ── Passes ───────────────────────────────────────────────
export const passesAPI = {
  getAll: (params) => API.get('/passes', { params }),
  getOne: (id) => API.get(`/passes/${id}`),
  issue: (data) => API.post('/passes', data),
  verify: (qrToken, gate) => API.post('/passes/verify', { qrToken, gate }),
  getPublic: (token) => API.get(`/passes/public/${token}`),
  revoke: (id, reason) => API.put(`/passes/${id}/revoke`, { reason }),
  downloadPDF: (id) => API.get(`/passes/${id}/pdf`, { responseType: 'blob' }),
};

// ── Check Logs ───────────────────────────────────────────
export const checkLogsAPI = {
  getAll: (params) => API.get('/check-logs', { params }),
  getActive: () => API.get('/check-logs/active'),
  manual: (data) => API.post('/check-logs/manual', data),
};

// ── Reports ──────────────────────────────────────────────
export const reportsAPI = {
  getDashboard: () => API.get('/reports/dashboard'),
  export: (params) => API.get('/reports/export', { params }),
};

// ── Users ────────────────────────────────────────────────
export const usersAPI = {
  getAll: () => API.get('/users'),
  getHostsList: () => API.get('/users/hosts/list'),
  update: (id, data) => API.put(`/users/${id}`, data),
  delete: (id) => API.delete(`/users/${id}`),
};

export default API;
