// src/services/api.js
const BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:5000/api';

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
  // Backend route: POST /api/projects  (NOT /projects/submit-form)
  submit: (formData)   => uploadRequest('/projects', formData),
  submitSimple: (body) => request('/projects', { method: 'POST', body: JSON.stringify(body) }),
};

export const authApi = {
  login:    (body)  => request('/auth/login',    { method: 'POST', body: JSON.stringify(body) }),
  register: (body)  => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  logout:   ()      => request('/auth/logout',   { method: 'POST' }),
  me:       ()      => request('/auth/me'),
  updateMe: (body)  => request('/auth/me',       { method: 'PATCH', body: JSON.stringify(body) }),
  changePassword: (body) => request('/auth/change-password', { method: 'PATCH', body: JSON.stringify(body) }),
};

export const cartApi = {
  get:    ()                        => request('/cart'),
  add:    (productId, quantity = 1) => request('/cart/add', { method: 'POST', body: JSON.stringify({ productId, quantity }) }),
  update: (itemId, quantity)        => request(`/cart/item/${itemId}`, { method: 'PATCH', body: JSON.stringify({ quantity }) }),
  remove: (itemId)                  => request(`/cart/item/${itemId}`, { method: 'DELETE' }),
  clear:  ()                        => request('/cart/clear', { method: 'DELETE' }),
};

export const orderApi = {
  create:   (body)  => request('/orders',    { method: 'POST', body: JSON.stringify(body) }),
  getMy:    ()      => request('/orders/my'),
  getById:  (id)    => request(`/orders/${id}`),
};

export const reviewApi = {
  create:      (body) => request('/reviews', { method: 'POST', body: JSON.stringify(body) }),
  getByProduct:(productId) => request(`/reviews/${productId}`),
};

export const wishlistApi = {
  // Wishlist endpoints if available via cart context
  getAll: () => request('/cart/wishlist'),
  add:    (productId) => request('/cart/wishlist', { method: 'POST', body: JSON.stringify({ productId }) }),
  remove: (productId) => request(`/cart/wishlist/${productId}`, { method: 'DELETE' }),
};

export const settingsApi = {
  getPublic: () => request('/settings/public'),
};





export const adminApi = {
  // Dashboard
  getDashboardStats: ()        => request('/settings/dashboard'),
  getAnalytics:      ()        => request('/admin/analytics'),

  // Users
getUsers: (params = {}) => {
  // مقادیر undefined و '' رو حذف کن قبل از URLSearchParams
  const clean = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== undefined && v !== '')
  );
  const q = new URLSearchParams(clean).toString();
  return request(`/admin/users${q ? `?${q}` : ''}`);
},  updateUser:  (id, body)      => request(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  createAdmin: (body)          => request('/admin/users', { method: 'POST', body: JSON.stringify(body) }),

  // Products (admin CRUD)
  getProducts: (params = {}) => {
  const q = new URLSearchParams({ ...params, admin: 'true' }).toString();
  return request(`/products${q ? `?${q}` : ''}`);
},
  createProduct: (body)        => request('/products', { method: 'POST', body: JSON.stringify(body) }),
  updateProduct: (id, body)    => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteProduct: (id)          => request(`/products/${id}`, { method: 'DELETE' }),

  // Categories
  createCategory: (body)       => request('/products/categories', { method: 'POST', body: JSON.stringify(body) }),
  updateCategory: (id, body)   => request(`/products/categories/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCategory: (id)         => request(`/products/categories/${id}`, { method: 'DELETE' }),

  // Services
  createService: (body)        => request('/services', { method: 'POST', body: JSON.stringify(body) }),
  updateService: (id, body)    => request(`/services/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  // Orders
  getAllOrders:   (params = {}) => { const q = new URLSearchParams(params).toString(); return request(`/orders/admin/all${q ? `?${q}` : ''}`); },
  getOrderById:  (id)          => request(`/orders/${id}`),
  confirmOrder:  (id)          => request(`/orders/${id}/confirm`, { method: 'POST' }),

  // Projects
  getProjects:   (params = {}) => { const q = new URLSearchParams(params).toString(); return request(`/projects${q ? `?${q}` : ''}`); },
  updateProject: (id, body)    => request(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  // Reviews
  getReviews:    (params = {}) => { const q = new URLSearchParams(params).toString(); return request(`/reviews${q ? `?${q}` : ''}`); },
  approveReview: (id)          => request(`/reviews/${id}/approve`, { method: 'PATCH' }),
  deleteReview:  (id)          => request(`/reviews/${id}`, { method: 'DELETE' }),

  // Coupons
  getCoupons:    ()            => request('/coupons'),
  createCoupon:  (body)        => request('/coupons', { method: 'POST', body: JSON.stringify(body) }),
  deleteCoupon:  (id)          => request(`/coupons/${id}`, { method: 'DELETE' }),

  // Settings
  getSettings:   ()            => request('/settings'),
  updateSettings:(settings)    => request('/settings', { method: 'PUT', body: JSON.stringify({ settings }) }),
  updateTicker:  (items)       => request('/settings/ticker', { method: 'PUT', body: JSON.stringify({ items }) }),
  updateStats:   (stats)       => request('/settings/stats', { method: 'PUT', body: JSON.stringify({ stats }) }),

  // Upload
  uploadImage:   (file)        => {
    const fd = new FormData(); fd.append('image', file);
    const url = `${(typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:5000/api'}/upload/image`;
    const token = localStorage.getItem('tesign_token');
    return fetch(url, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd })
      .then(r => r.json());
  },
  deleteFile: (filename)       => request(`/upload/${filename}`, { method: 'DELETE' }),
};