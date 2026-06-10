// src/services/api.js

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, config);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'خطا در ارتباط با سرور');
  }

  return data;
}

// ─── Products ────────────────────────────────────────────────────────────────
export const productApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/products${query ? `?${query}` : ''}`);
  },
  getFeatured: () => request('/products/featured'),
  getBySlug: (slug) => request(`/products/${slug}`),
};

// ─── Services ─────────────────────────────────────────────────────────────────
export const serviceApi = {
  getAll: () => request('/services'),
  getBySlug: (slug) => request(`/services/${slug}`),
};

// ─── Projects (Lead Form) ─────────────────────────────────────────────────────
export const projectApi = {
  submit: (body) =>
    request('/projects', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (body) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  register: (body) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
};
