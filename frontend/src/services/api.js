// src/services/api.js
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  };
  const token = localStorage.getItem('tesign_token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, config);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'خطا در ارتباط با سرور');
  return data;
}

async function uploadRequest(endpoint, formData) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {};
  const token = localStorage.getItem('tesign_token');
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { method: 'POST', headers, body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'خطا در آپلود فایل');
  return data;
}

export const productApi = {
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/products${q ? `?${q}` : ''}`);
  },
  getFeatured: ()       => request('/products/featured'),
  getCategories: ()     => request('/products/categories'),
  getBySlug: (slug)     => request(`/products/${slug}`),
};

export const serviceApi = {
  getAll:       ()     => request('/services'),
  getBySlug: (slug)    => request(`/services/${slug}`),
};

export const projectApi = {
  submit: (formData)   => uploadRequest('/projects/submit-form', formData),
  submitSimple: (body) => request('/projects', { method: 'POST', body: JSON.stringify(body) }),
};

export const authApi = {
  login:    (body)  => request('/auth/login',    { method: 'POST', body: JSON.stringify(body) }),
  register: (body)  => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  logout:   ()      => request('/auth/logout',   { method: 'POST' }),
  me:       ()      => request('/auth/me'),
};

export const cartApi = {
  get:    ()                        => request('/cart'),
  add:    (productId, quantity = 1) => request('/cart/add', { method: 'POST', body: JSON.stringify({ productId, quantity }) }),
  update: (itemId, quantity)        => request(`/cart/item/${itemId}`, { method: 'PATCH', body: JSON.stringify({ quantity }) }),
  remove: (itemId)                  => request(`/cart/item/${itemId}`, { method: 'DELETE' }),
  clear:  ()                        => request('/cart/clear', { method: 'DELETE' }),
};

export const settingsApi = {
  getPublic: () => request('/settings/public'),
};