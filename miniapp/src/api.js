import { getInitData } from './telegram';

const BASE_URL = import.meta.env.VITE_API_URL || '';

/** Serverga so'rov yuboradi va xatoliklarni bir xil ko'rinishda qaytaradi. */
async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}/api/client${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Telegram-Init-Data': getInitData(),
      ...(options.headers || {}),
    },
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (_error) {
    payload = null;
  }

  if (!response.ok || !payload?.ok) {
    const error = new Error(payload?.error?.message || 'Serverga ulanib bo\'lmadi');
    error.code = payload?.error?.code || 'NETWORK_ERROR';
    error.status = response.status;
    throw error;
  }

  return payload.data;
}

export const api = {
  getMe: () => request('/me'),
  updateMe: (data) => request('/me', { method: 'PATCH', body: JSON.stringify(data) }),

  getServices: () => request('/services'),
  getPopularServices: () => request('/services/popular'),
  getService: (id) => request(`/services/${id}`),

  getBarbers: () => request('/barbers'),
  getBarber: (id) => request(`/barbers/${id}`),

  getAvailableDates: (barberId, serviceId) =>
    request(`/availability/dates?barberId=${barberId}&serviceId=${serviceId}`),
  getAvailableSlots: (barberId, serviceId, date) =>
    request(`/availability/slots?barberId=${barberId}&serviceId=${serviceId}&date=${date}`),

  getAppointments: () => request('/appointments'),
  createAppointment: (data) => request('/appointments', { method: 'POST', body: JSON.stringify(data) }),
  cancelAppointment: (id) => request(`/appointments/${id}/cancel`, { method: 'POST' }),
  markOnTheWay: (id) => request(`/appointments/${id}/on-the-way`, { method: 'POST' }),
};

export default api;
