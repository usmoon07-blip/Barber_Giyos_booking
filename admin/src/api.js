const BASE_URL = import.meta.env.VITE_API_URL || '';
const TOKEN_KEY = 'barber.admin.token';

export function getToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch (_error) {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch (_error) {
    /* ahamiyatsiz */
  }
}

/** Sessiya tugaganda chaqiriladi (App tomonidan o'rnatiladi). */
let onUnauthorized = () => {};
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

async function request(path, options = {}) {
  const token = getToken();

  const response = await fetch(`${BASE_URL}/api/admin${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (_error) {
    payload = null;
  }

  if (response.status === 401) {
    setToken(null);
    onUnauthorized();
  }

  if (!response.ok || !payload?.ok) {
    const error = new Error(payload?.error?.message || 'Serverga ulanib bo\'lmadi');
    error.code = payload?.error?.code || 'NETWORK_ERROR';
    error.status = response.status;
    throw error;
  }

  return payload.data;
}

function query(params) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params || {})) {
    if (value !== undefined && value !== null && value !== '') search.set(key, value);
  }
  const text = search.toString();
  return text ? `?${text}` : '';
}

export const api = {
  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  me: () => request('/auth/me'),

  getDashboard: () => request('/dashboard'),
  getStats: () => request('/stats'),
  getReport: (from, to) => request(`/reports${query({ from, to })}`),
  getSchedule: (date) => request(`/schedule${query({ date })}`),

  getAppointments: (params) => request(`/appointments${query(params)}`),
  createAppointment: (data) => request('/appointments', { method: 'POST', body: JSON.stringify(data) }),
  getAvailability: (barberId, serviceId, date) =>
    request(`/availability${query({ barberId, serviceId, date })}`),
  searchUsers: (q) => request(`/users/search${query({ q })}`),
  updateAppointmentStatus: (id, status) =>
    request(`/appointments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  setAppointmentPayment: (id, data) =>
    request(`/appointments/${id}/payment`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteAppointment: (id) => request(`/appointments/${id}`, { method: 'DELETE' }),

  getBarbers: () => request('/barbers'),
  createBarber: (data) => request('/barbers', { method: 'POST', body: JSON.stringify(data) }),
  updateBarber: (id, data) => request(`/barbers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteBarber: (id) => request(`/barbers/${id}`, { method: 'DELETE' }),

  getWorkingHours: (barberId) => request(`/barbers/${barberId}/working-hours`),
  updateWorkingHours: (barberId, hours) =>
    request(`/barbers/${barberId}/working-hours`, { method: 'PUT', body: JSON.stringify({ hours }) }),

  getServices: () => request('/services'),
  createService: (data) => request('/services', { method: 'POST', body: JSON.stringify(data) }),
  updateService: (id, data) => request(`/services/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteService: (id) => request(`/services/${id}`, { method: 'DELETE' }),

  getUsers: (params) => request(`/users${query(params)}`),

  getTimeBlocks: (from, to) => request(`/time-blocks${query({ from, to })}`),
  createTimeBlock: (data) => request('/time-blocks', { method: 'POST', body: JSON.stringify(data) }),
  deleteTimeBlock: (id) => request(`/time-blocks/${id}`, { method: 'DELETE' }),

  getSettings: () => request('/settings'),
  updateSettings: (data) => request('/settings', { method: 'PATCH', body: JSON.stringify(data) }),
};

export default api;
