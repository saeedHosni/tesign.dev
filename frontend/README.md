# فرانت‌اند تیزاین — آژانس دیجیتال فارسی

ساخته‌شده با **React + Vite + Tailwind CSS v4**  
بدون React Router — مسیریابی دستی با `window.location`

---

## ⚙️ پیش‌نیازها

- Node.js `>= 18`
- بک‌اند تیزاین در حال اجرا روی `http://localhost:5000`

---

## 🚀 راه‌اندازی سریع

```bash
# نصب وابستگی‌ها
npm install

# ایجاد فایل env
cp .env.example .env
```

فایل `.env` را ویرایش کنید:

```env
VITE_API_URL=http://localhost:5000/api
```

```bash
# اجرای محیط توسعه
npm run dev
```

پروژه روی `http://localhost:5173` بالا می‌آید.

---

## 📁 ساختار پروژه

```
src/
├── components/
│   ├── auth/
│   │   └── AuthModal.jsx        # مودال ورود / ثبت‌نام
│   ├── layout/
│   │   ├── Navbar.jsx
│   │   └── Footer.jsx
│   ├── sections/                # بخش‌های صفحه اصلی
│   │   ├── Hero.jsx
│   │   ├── Ticker.jsx
│   │   ├── Services.jsx
│   │   ├── Shop.jsx
│   │   └── ProjectBanner.jsx
│   └── ui/                      # کامپوننت‌های پایه
│       ├── Button.jsx
│       ├── Logo.jsx
│       ├── ArrowIcon.jsx
│       └── SectionLabel.jsx
├── context/
│   ├── AuthContext.jsx           # مدیریت احراز هویت
│   └── CartContext.jsx           # مدیریت سبد خرید
├── hooks/
│   ├── useProducts.js
│   ├── useProductDetail.js
│   ├── useServices.js
│   ├── useSiteData.js
│   ├── useActiveNav.js
│   ├── useCounter.js
│   └── useScrollReveal.js
├── pages/
│   ├── ShopPage.jsx
│   ├── ServicesPage.jsx
│   ├── ProductDetailPage.jsx
│   ├── CheckoutPage.jsx
│   ├── OrderPage.jsx
│   ├── DashboardPage.jsx
│   ├── AboutPage.jsx
│   └── admin/
│       ├── AdminLayout.jsx       # لایه مشترک پنل ادمین
│       ├── AdminUI.jsx           # کامپوننت‌های UI پنل ادمین
│       ├── AdminOverviewPage.jsx
│       ├── AdminProductsPage.jsx
│       ├── AdminCategoriesPage.jsx
│       ├── AdminServicesPage.jsx
│       ├── AdminOrdersPage.jsx
│       ├── AdminUsersPage.jsx
│       ├── AdminSettingsPage.jsx
│       └── AdminMiscPages.jsx    # Projects, Reviews, Coupons
├── services/
│   └── api.js                   # تمام توابع API
├── data/
│   └── siteData.js              # داده‌های پیش‌فرض و fallback
├── styles/
│   └── globals.css
├── App.jsx                      # روتر اصلی
├── main.jsx
└── index.css                    # Design tokens + Tailwind
```

---

## 🗺️ مسیرها

### صفحات عمومی

| مسیر | صفحه |
|------|-------|
| `/` | صفحه اصلی (Hero، Ticker، Services، Shop، ProjectBanner) |
| `/shop` | فروشگاه با فیلتر و جستجو |
| `/product/:slug` | جزئیات محصول |
| `/services` | لیست خدمات |
| `/order` | ثبت سفارش پروژه |
| `/checkout` | تسویه‌حساب |
| `/dashboard` | داشبورد کاربر |
| `/about` | درباره ما |

### پنل ادمین (نیاز به نقش `ADMIN` یا `SUPER_ADMIN`)

| مسیر | صفحه |
|------|-------|
| `/admin` | نمای کلی و آمار |
| `/admin/products` | مدیریت محصولات |
| `/admin/categories` | مدیریت دسته‌بندی‌ها |
| `/admin/services` | مدیریت خدمات |
| `/admin/orders` | مدیریت سفارشات |
| `/admin/users` | مدیریت کاربران |
| `/admin/projects` | درخواست‌های پروژه |
| `/admin/reviews` | مدیریت نظرات |
| `/admin/coupons` | کدهای تخفیف |
| `/admin/settings` | تنظیمات سایت |

---

## 🔌 سرویس API

همه درخواست‌ها از `src/services/api.js` مدیریت می‌شوند. توکن به صورت خودکار از `localStorage` به هدر `Authorization` اضافه می‌شود.

### متغیر محیطی

```env
VITE_API_URL=http://localhost:5000/api
```

### گروه‌های API

```js
import {
  productApi,   // محصولات عمومی
  serviceApi,   // خدمات عمومی
  projectApi,   // ثبت درخواست پروژه
  authApi,      // احراز هویت
  cartApi,      // سبد خرید
  orderApi,     // سفارشات کاربر
  reviewApi,    // نظرات محصول
  settingsApi,  // تنظیمات عمومی سایت
  adminApi,     // تمام عملیات پنل ادمین
} from './services/api';
```

### جزئیات `adminApi`

| متد | Endpoint بک‌اند | توضیح |
|-----|-----------------|-------|
| `getDashboardStats()` | `GET /settings/dashboard` | آمار داشبورد |
| `getAnalytics(params)` | `GET /admin/analytics` | نمودار درآمد |
| `getUsers(params)` | `GET /admin/users` | لیست کاربران |
| `updateUser(id, body)` | `PATCH /admin/users/:id` | ویرایش کاربر |
| `deleteUser(id)` | `DELETE /admin/users/:id` | غیرفعال‌کردن کاربر |
| `createAdmin(body)` | `POST /admin/users` | ایجاد ادمین جدید |
| `getProducts(params)` | `GET /products` | لیست محصولات |
| `createProduct(body)` | `POST /products` | ایجاد محصول |
| `updateProduct(id, body)` | `PUT /products/:id` | ویرایش محصول |
| `deleteProduct(id)` | `DELETE /products/:id` | حذف محصول |
| `getAdminCategories()` | `GET /admin/categories` | لیست دسته‌بندی‌ها |
| `createCategory(body)` | `POST /admin/categories` | ایجاد دسته‌بندی |
| `updateCategory(id, body)` | `PATCH /admin/categories/:id` | ویرایش دسته‌بندی |
| `deleteCategory(id)` | `DELETE /admin/categories/:id` | حذف دسته‌بندی |
| `createService(body)` | `POST /services` | ایجاد خدمت |
| `updateService(id, body)` | `PUT /services/:id` | ویرایش خدمت |
| `deleteService(id)` | `DELETE /services/:id` | حذف خدمت |
| `getAllOrders(params)` | `GET /orders/admin/all` | لیست سفارشات |
| `updateOrderStatus(id, body)` | `PATCH /admin/orders/:id` | تغییر وضعیت سفارش |
| `confirmOrder(id)` | `POST /orders/:id/confirm` | تأیید پرداخت |
| `getProjects(params)` | `GET /projects` | درخواست‌های پروژه |
| `updateProject(id, body)` | `PATCH /projects/:id` | تغییر وضعیت درخواست |
| `getReviews(params)` | `GET /admin/reviews` | لیست نظرات |
| `approveReview(id)` | `PATCH /reviews/:id/approve` | تأیید نظر |
| `rejectReview(id)` | `PATCH /reviews/:id/reject` | رد نظر |
| `deleteReview(id)` | `DELETE /admin/reviews/:id` | حذف نظر |
| `getCoupons()` | `GET /coupons` | لیست کوپن‌ها |
| `createCoupon(body)` | `POST /coupons` | ایجاد کوپن |
| `updateCoupon(id, body)` | `PATCH /admin/coupons/:id` | ویرایش کوپن |
| `deleteCoupon(id)` | `DELETE /coupons/:id` | غیرفعال‌کردن کوپن |
| `getSettings()` | `GET /settings` | تنظیمات سایت |
| `updateSettings(settings)` | `PUT /settings` | ذخیره تنظیمات |
| `updateTicker(items)` | `PUT /settings/ticker` | ذخیره تیکر |
| `updateStats(stats)` | `PUT /settings/stats` | ذخیره آمار هیرو |
| `uploadImage(file)` | `POST /upload/image` | آپلود تصویر |
| `deleteFile(filename)` | `DELETE /upload/:filename` | حذف فایل |

---

## 🔐 احراز هویت

`AuthContext` سه کلید در `localStorage` نگه می‌دارد:

| کلید | مقدار |
|------|-------|
| `tesign_token` | Access Token (JWT — عمر ۱۵ دقیقه) |
| `tesign_refresh` | Refresh Token (عمر ۳۰ روز) |
| `tesign_user` | آبجکت user به فرمت JSON |

توکن در هر درخواست به هدر `Authorization: Bearer <token>` اضافه می‌شود.

### استفاده در کامپوننت

```jsx
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user, isLoggedIn, isAdmin, login, logout } = useAuth();
}
```

### سطوح دسترسی

| نقش | دسترسی |
|-----|---------|
| `CUSTOMER` | داشبورد، خرید، نظر |
| `ADMIN` | پنل ادمین (بدون حذف کاربر و دسته‌بندی) |
| `SUPER_ADMIN` | دسترسی کامل |

---

## 🛒 سبد خرید

`CartContext` دو حالت دارد:

- **کاربر لاگین‌کرده:** سبد از API بک‌اند خوانده و نوشته می‌شود
- **کاربر مهمان:** سبد در `localStorage` با کلید `tesign_cart` ذخیره می‌شود

```jsx
import { useCart } from '../context/CartContext';

function MyComponent() {
  const { items, addItem, removeItem, updateQuantity, clearCart, total } = useCart();
}
```

---

## 🎨 سیستم طراحی

پروژه از **Tailwind CSS v4** با Design Tokens سفارشی استفاده می‌کند که در `src/index.css` تعریف شده‌اند:

### رنگ‌ها

| توکن | مقدار | کاربرد |
|------|-------|---------|
| `bg-base` | `#1E1E1E` | پس‌زمینه اصلی |
| `bg-surface` | `#252525` | لایه دوم |
| `bg-card` | `#2A2A2A` | کارت‌ها |
| `accent-yellow` | `#F5C518` | رنگ اصلی برند |
| `accent-orange` | `#FF6B35` | تأکید ثانویه |
| `text-primary` | `#F0F0F0` | متن اصلی |
| `text-secondary` | `#A8A8A8` | متن ثانویه |
| `text-muted` | `#6A6A6A` | متن کم‌رنگ |

### فونت

فونت **Vazirmatn** از Google Fonts بارگذاری می‌شود. RTL به‌صورت پیش‌فرض روی کل سایت اعمال است.

### کلاس‌های ابزاری سفارشی

| کلاس | توضیح |
|------|-------|
| `grad-bg` | گرادیان زرد به نارنجی (دکمه‌های CTA) |
| `grad-text` | همان گرادیان روی متن |
| `card-hover` | افکت hover کارت‌ها |
| `reveal` | انیمیشن ورود هنگام اسکرول |

---

## 🪝 Hooks

| Hook | ورودی | خروجی |
|------|-------|-------|
| `useProducts(params)` | فیلترهای جستجو | `{ products, loading, error }` |
| `useProductDetail(slug)` | اسلاگ محصول | `{ product, loading, error }` |
| `useServices()` | — | `{ services, loading, error }` |
| `useSiteData()` | — | `{ stats, ticker, loading }` |
| `useScrollReveal()` | — | انیمیشن عناصر `.reveal` |
| `useCounter(target, active)` | عدد هدف | عدد فعلی (شمارش) |
| `useActiveNav()` | — | مسیر فعال |

---

## 🛠️ اسکریپت‌ها

```bash
npm run dev      # اجرای سرور توسعه (پورت 5173)
npm run build    # بیلد برای production
npm run preview  # پیش‌نمایش بیلد production
```

---

## 📝 نکات مهم

**مسیریابی:** پروژه از React Router استفاده نمی‌کند. مسیریابی با `window.location.pathname` و `pushState` پیاده‌سازی شده. برای اضافه‌کردن مسیر جدید، فایل `App.jsx` را ویرایش کنید.

**Fallback داده:** hooks محصولات و خدمات در صورت عدم دسترسی به API، از داده‌های استاتیک `src/data/siteData.js` به عنوان fallback استفاده می‌کنند.

**پنل ادمین:** صفحات `/admin/*` بدون Navbar و Footer سایت رندر می‌شوند و layout جداگانه‌ای دارند (`AdminLayout.jsx`).

**آپلود تصویر:** endpoint آپلود (`/upload/image`) یک فایل `multipart/form-data` با فیلد `image` دریافت می‌کند و آدرس فایل آپلودشده را برمی‌گرداند.
