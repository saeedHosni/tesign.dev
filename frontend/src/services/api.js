// src/services/api.js
const BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  'http://localhost:5000/api';

// ─── Token refresh state ───────────────────────────────────────────────────────
// جلوگیری از چند درخواست refresh موازی
let refreshPromise = null;

async function doRefresh() {
  const refreshToken = localStorage.getItem('tesign_refresh');
  if (!refreshToken) throw new Error('no_refresh_token');

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  const data = await res.json();

  if (!res.ok) throw new Error('refresh_failed');

  // توکن‌های جدید را ذخیره کن
  localStorage.setItem('tesign_token', data.data.accessToken);
  localStorage.setItem('tesign_refresh', data.data.refreshToken);
  return data.data.accessToken;
}

// ─── Core request ──────────────────────────────────────────────────────────────
async function request(endpoint, options = {}, retry = true) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  };

  const token = localStorage.getItem('tesign_token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, config);
  const data = await res.json();

  // اگر access token منقضی شده، یک‌بار refresh کن و retry کن
  if (res.status === 401 && data?.code === 'TOKEN_EXPIRED' && retry) {
    try {
      // اگر refresh در حال اجرا است، همان promise را دنبال کن
      if (!refreshPromise) {
        refreshPromise = doRefresh().finally(() => { refreshPromise = null; });
      }
      const newToken = await refreshPromise;

      // با توکن جدید retry کن
      return request(endpoint, {
        ...options,
        headers: { ...options.headers, Authorization: `Bearer ${newToken}` },
      }, false); // retry=false تا loop نشه
    } catch {
      // refresh شکست خورد — session را پاک کن
      localStorage.removeItem('tesign_token');
      localStorage.removeItem('tesign_refresh');
      localStorage.removeItem('tesign_user');
      // رویداد broadcast تا AuthContext هم آپدیت بشه
      window.dispatchEvent(new CustomEvent('auth:session-expired'));
      throw new Error('نشست شما منقضی شده است. لطفاً دوباره وارد شوید.');
    }
  }

  if (!res.ok) throw new Error(data.message || 'خطا در ارتباط با سرور');
  return data;
}

// ─── Upload request ────────────────────────────────────────────────────────────
async function uploadRequest(endpoint, formData, retry = true) {
  const url = `${BASE_URL}${endpoint}`;
  const token = localStorage.getItem('tesign_token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const res = await fetch(url, { method: 'POST', headers, body: formData });
  const data = await res.json();

  // ✅ همون منطق refresh که تو request() داری
  if (res.status === 401 && data?.code === 'TOKEN_EXPIRED' && retry) {
    try {
      if (!refreshPromise) {
        refreshPromise = doRefresh().finally(() => { refreshPromise = null; });
      }
      await refreshPromise;
      return uploadRequest(endpoint, formData, false);
    } catch {
      localStorage.removeItem('tesign_token');
      localStorage.removeItem('tesign_refresh');
      localStorage.removeItem('tesign_user');
      window.dispatchEvent(new CustomEvent('auth:session-expired'));
      throw new Error('نشست شما منقضی شده است. لطفاً دوباره وارد شوید.');
    }
  }

  if (!res.ok) throw new Error(data.message || 'خطا در آپلود فایل');
  return data;
}

// ─── API modules ───────────────────────────────────────────────────────────────

export const productApi = {
  getAll:        (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/products${q ? `?${q}` : ''}`);
  },
  getFeatured:   ()     => request('/products/featured'),
  getCategories: ()     => request('/products/categories'),
  getBySlug:     (slug) => request(`/products/${slug}`),
};

export const serviceApi = {
  getAll:    ()     => request('/services'),
  getBySlug: (slug) => request(`/services/${slug}`),
};

export const uploadApi = {
  projectFiles: (files) => {
    const fd = new FormData();
    files.forEach(f => fd.append('files', f));
    return uploadRequest('/upload/project-files', fd);
  },
};

export const authApi = {
  login:    (body) => request('/auth/login',           { method: 'POST',  body: JSON.stringify(body) }),
  register: (body) => request('/auth/register',        { method: 'POST',  body: JSON.stringify(body) }),
  logout:   ()     => request('/auth/logout',          { method: 'POST',  body: JSON.stringify({ refreshToken: localStorage.getItem('tesign_refresh') }) }),
  logoutAll: ()    => request('/auth/logout-all',      { method: 'POST' }),
  me:       ()     => request('/auth/me'),
};

export const cartApi = {
  get:    ()                        => request('/cart'),
  add:    (productId, quantity = 1) => request('/cart/add',        { method: 'POST',   body: JSON.stringify({ productId, quantity }) }),
  update: (itemId, quantity)        => request(`/cart/item/${itemId}`, { method: 'PATCH', body: JSON.stringify({ quantity }) }),
  remove: (itemId)                  => request(`/cart/item/${itemId}`, { method: 'DELETE' }),
  clear:  ()                        => request('/cart/clear',       { method: 'DELETE' }),
};

export const orderApi = {
  create:  (body) => request('/orders',      { method: 'POST', body: JSON.stringify(body) }),
  getMy:   ()     => request('/orders/my'),
  getById: (id)   => request(`/orders/${id}`),
};

export const reviewApi = {
  create:       (body)      => request('/reviews',         { method: 'POST', body: JSON.stringify(body) }),
  getByProduct: (productId) => request(`/reviews/${productId}`),
};

export const wishlistApi = {
  getAll: ()          => request('/cart/wishlist'),
  add:    (productId) => request('/cart/wishlist',          { method: 'POST',   body: JSON.stringify({ productId }) }),
  remove: (productId) => request(`/cart/wishlist/${productId}`, { method: 'DELETE' }),
};

export const settingsApi = {
  getPublic: () => request('/settings/public'),
};

// ─── Dashboard API ─────────────────────────────────────────────────────────────
// تمام اندپوینت‌های پنل کاربری زیر /api/dashboard — نیاز به Bearer Token دارند

export const dashboardApi = {
  // خلاصه داشبورد
  getSummary: () => request('/dashboard/summary'),
  getProfile:  ()         => request('/dashboard/profile'),
  updateProfile: (body)   => request('/dashboard/profile',         { method: 'PATCH', body: JSON.stringify(body) }),
  changePassword: (body)  => request('/dashboard/change-password', { method: 'PATCH', body: JSON.stringify(body) }),
  changeEmail: (body)     => request('/dashboard/change-email',    { method: 'PATCH', body: JSON.stringify(body) }),

  // سفارشات
  getOrders: (params = {}) => {
    const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''));
    const q = new URLSearchParams(clean).toString();
    return request(`/dashboard/orders${q ? `?${q}` : ''}`);
  },
  getOrderById: (orderId) => request(`/dashboard/orders/${orderId}`),

  // دانلودها
  getDownloads: () => request('/dashboard/downloads'),

  // پروژه‌ها
  getProjects: (params = {}) => {
    const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''));
    const q = new URLSearchParams(clean).toString();
    return request(`/dashboard/projects${q ? `?${q}` : ''}`);
  },
  getProjectById: (projectId) => request(`/dashboard/projects/${projectId}`),
  createProject:  (body)      => request('/dashboard/projects', { method: 'POST', body: JSON.stringify(body) }),
};

// ─── Project API (legacy — برای سازگاری با کد قدیمی) ──────────────────────────
// داشبورد از dashboardApi.createProject استفاده می‌کند؛ این فقط برای ثبت عمومی (بدون login) است
export const projectApi = {
  submit: (body) => request('/projects', { method: 'POST', body: JSON.stringify(body) }),
};

export const adminApi = {
  // Dashboard
  getDashboardStats: () => request('/settings/dashboard'),
  getAnalytics: (params = {}) => {
    const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''));
    const q = new URLSearchParams(clean).toString();
    return request(`/admin/analytics${q ? `?${q}` : ''}`);
  },

  // Users
  getUsers: (params = {}) => {
    const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''));
    const q = new URLSearchParams(clean).toString();
    return request(`/admin/users${q ? `?${q}` : ''}`);
  },
  updateUser:  (id, body) => request(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteUser:  (id)       => request(`/admin/users/${id}`, { method: 'DELETE' }),
  createAdmin: (body)     => request('/admin/users',       { method: 'POST',  body: JSON.stringify(body) }),

  // Products
  getProducts: (params = {}) => {
    const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''));
    const q = new URLSearchParams(clean).toString();
    return request(`/products${q ? `?${q}` : ''}`);
  },
  createProduct: (body)     => request('/products',       { method: 'POST',   body: JSON.stringify(body) }),
  updateProduct: (id, body) => request(`/products/${id}`, { method: 'PUT',    body: JSON.stringify(body) }),
  deleteProduct: (id)       => request(`/products/${id}`, { method: 'DELETE' }),

  // Categories
  getAdminCategories: () => request('/admin/categories'),
  createCategory: (body)     => request('/admin/categories',       { method: 'POST',  body: JSON.stringify(body) }),
  updateCategory: (id, body) => request(`/admin/categories/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteCategory: (id)       => request(`/admin/categories/${id}`, { method: 'DELETE' }),

  // Product Images
  addProductImage:    (productId, body)    => request(`/admin/products/${productId}/images`,             { method: 'POST',   body: JSON.stringify(body) }),
  deleteProductImage: (productId, imageId) => request(`/admin/products/${productId}/images/${imageId}`, { method: 'DELETE' }),

  // Services
  createService: (body)     => request('/services',       { method: 'POST', body: JSON.stringify(body) }),
  updateService: (id, body) => request(`/services/${id}`, { method: 'PUT',  body: JSON.stringify(body) }),
  deleteService: (id)       => request(`/services/${id}`, { method: 'DELETE' }),

  // Orders
  getAllOrders: (params = {}) => {
    const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''));
    const q = new URLSearchParams(clean).toString();
    return request(`/orders/admin/all${q ? `?${q}` : ''}`);
  },
  getOrderById:      (id)       => request(`/orders/${id}`),
  confirmOrder:      (id)       => request(`/orders/${id}/confirm`,   { method: 'POST' }),
  updateOrderStatus: (id, body) => request(`/admin/orders/${id}`,     { method: 'PATCH', body: JSON.stringify(body) }),

  // Projects
  getProjects: (params = {}) => {
    const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''));
    const q = new URLSearchParams(clean).toString();
    return request(`/projects${q ? `?${q}` : ''}`);
  },
  getProjectById: (id)       => request(`/projects/${id}`),
  updateProject:  (id, body) => request(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  // Reviews
  getReviews: (params = {}) => {
    const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''));
    const q = new URLSearchParams(clean).toString();
    return request(`/admin/reviews${q ? `?${q}` : ''}`);
  },
  approveReview: (id) => request(`/reviews/${id}/approve`, { method: 'PATCH' }),
  rejectReview:  (id) => request(`/reviews/${id}/reject`,  { method: 'PATCH' }),
  deleteReview:  (id) => request(`/admin/reviews/${id}`,   { method: 'DELETE' }),

  // Coupons
  getCoupons:   ()         => request('/coupons'),
  createCoupon: (body)     => request('/coupons',             { method: 'POST',  body: JSON.stringify(body) }),
  updateCoupon: (id, body) => request(`/admin/coupons/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteCoupon: (id)       => request(`/coupons/${id}`,       { method: 'DELETE' }),

  // Settings
  getSettings:    ()         => request('/settings'),
  updateSettings: (settings) => request('/settings',        { method: 'PUT', body: JSON.stringify({ settings }) }),
  updateTicker:   (items)    => request('/settings/ticker', { method: 'PUT', body: JSON.stringify({ items }) }),
  updateStats:    (stats)    => request('/settings/stats',  { method: 'PUT', body: JSON.stringify({ stats }) }),

  // Upload
  uploadImage: (file) => {
    const fd = new FormData();
    fd.append('image', file);
    const url = `${BASE_URL}/upload/image`;
    const token = localStorage.getItem('tesign_token');
    return fetch(url, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    }).then(r => r.json());
  },
  deleteFile: (filename) => request(`/upload/${filename}`, { method: 'DELETE' }),
};