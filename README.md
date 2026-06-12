# تیزاین — پلتفرم آژانس دیجیتال فارسی

سایت کامل یک آژانس دیجیتال با فروشگاه محصولات، مدیریت خدمات، ثبت درخواست پروژه و پنل ادمین کامل.

```
frontend/   →  React + Vite + Tailwind CSS v4   (پورت 5173)
backend/    →  Node.js + Express + PostgreSQL    (پورت 5000)
```

---

## ⚙️ پیش‌نیازها

- Node.js `>= 18`
- PostgreSQL `>= 14`
- npm

---

## 🚀 راه‌اندازی کامل

### ۱. بک‌اند

```bash
cd backend
npm install
cp .env.example .env
```

فایل `backend/.env` را ویرایش کنید:

```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/tesign_db?schema=public"
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_REFRESH_SECRET=your_super_secret_refresh_key
CLIENT_URL=http://localhost:5173
```

```bash
# ساخت دیتابیس
createdb tesign_db

# اجرای migration و seed
npm run db:migrate
npm run db:seed

# اجرای سرور
npm run dev
```

بک‌اند روی `http://localhost:5000` بالا می‌آید.

---

### ۲. فرانت‌اند

```bash
cd frontend
npm install
cp .env.example .env
```

فایل `frontend/.env` را ویرایش کنید:

```env
VITE_API_URL=http://localhost:5000/api
```

```bash
npm run dev
```

سایت روی `http://localhost:5173` بالا می‌آید.

---

## 📁 ساختار پروژه

```
tesign/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # تعریف دیتابیس
│   │   ├── seed.js                # دیتای اولیه
│   │   └── migrations/
│   ├── src/
│   │   ├── server.js              # نقطه ورود Express
│   │   ├── config/db.js           # اتصال Prisma
│   │   ├── middleware/            # auth، errorHandler، validate
│   │   ├── controllers/           # منطق هر API
│   │   └── routes/                # تعریف مسیرها
│   ├── uploads/                   # فایل‌های آپلودی
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/            # Navbar، Footer، sections، UI
│   │   ├── context/               # AuthContext، CartContext
│   │   ├── hooks/                 # useProducts، useServices، ...
│   │   ├── pages/
│   │   │   ├── ShopPage.jsx
│   │   │   ├── ServicesPage.jsx
│   │   │   ├── CheckoutPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   └── admin/             # پنل مدیریت
│   │   ├── services/api.js        # همه توابع API
│   │   ├── data/siteData.js       # داده‌های fallback
│   │   ├── App.jsx                # روتر اصلی
│   │   └── index.css              # Design tokens + Tailwind
│   └── .env
│
└── README.md
```

---

## 🗺️ صفحات سایت

### عمومی

| مسیر | توضیح |
|------|-------|
| `/` | صفحه اصلی — Hero، Ticker، خدمات، فروشگاه |
| `/shop` | فروشگاه با جستجو و فیلتر |
| `/product/:slug` | جزئیات محصول |
| `/services` | لیست خدمات |
| `/order` | ثبت درخواست پروژه |
| `/checkout` | تسویه‌حساب |
| `/dashboard` | داشبورد کاربر |
| `/about` | درباره ما |

### پنل ادمین (نیاز به نقش `ADMIN` یا `SUPER_ADMIN`)

| مسیر | توضیح |
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
| `/admin/settings` | تنظیمات سایت (تیکر، آمار Hero) |

---

## 🔌 API — جدول کامل

**Base URL:** `http://localhost:5000/api`

### احراز هویت `/auth`

| Method | Path | دسترسی | توضیح |
|--------|------|---------|-------|
| POST | `/auth/register` | عمومی | ثبت‌نام |
| POST | `/auth/login` | عمومی | ورود |
| POST | `/auth/refresh` | عمومی | تمدید access token |
| POST | `/auth/logout` | عمومی | خروج |
| GET | `/auth/me` | کاربر | اطلاعات کاربر جاری |
| PATCH | `/auth/me` | کاربر | ویرایش پروفایل |
| PATCH | `/auth/change-password` | کاربر | تغییر رمز عبور |

### محصولات `/products`

| Method | Path | دسترسی | توضیح |
|--------|------|---------|-------|
| GET | `/products` | عمومی | لیست + فیلتر + صفحه‌بندی |
| GET | `/products/featured` | عمومی | محصولات ویژه (حداکثر ۸) |
| GET | `/products/categories` | عمومی | دسته‌بندی‌ها با تعداد محصول |
| GET | `/products/:slug` | عمومی | جزئیات محصول |
| POST | `/products` | ادمین | ایجاد محصول |
| PUT | `/products/:id` | ادمین | ویرایش محصول |
| DELETE | `/products/:id` | ادمین | غیرفعال کردن (soft delete) |

پارامترهای فیلتر: `?page=1&limit=12&category=slug&search=text&sort=price&order=desc&featured=true&minPrice=10000&maxPrice=500000`

### خدمات `/services`

| Method | Path | دسترسی | توضیح |
|--------|------|---------|-------|
| GET | `/services` | عمومی | خدمات فعال |
| GET | `/services/:slug` | عمومی | جزئیات خدمت |
| POST | `/services` | ادمین | ایجاد خدمت |
| PUT | `/services/:id` | ادمین | ویرایش خدمت |
| DELETE | `/services/:id` | ادمین | غیرفعال کردن |

### سبد خرید `/cart`

| Method | Path | دسترسی | توضیح |
|--------|------|---------|-------|
| GET | `/cart` | کاربر | مشاهده سبد |
| POST | `/cart/add` | کاربر | افزودن محصول |
| PATCH | `/cart/item/:itemId` | کاربر | تغییر تعداد |
| DELETE | `/cart/item/:itemId` | کاربر | حذف از سبد |
| DELETE | `/cart/clear` | کاربر | خالی کردن سبد |

### سفارشات `/orders`

| Method | Path | دسترسی | توضیح |
|--------|------|---------|-------|
| POST | `/orders` | کاربر | ثبت سفارش از سبد |
| GET | `/orders/my` | کاربر | سفارشات کاربر جاری |
| GET | `/orders/:id` | کاربر/ادمین | جزئیات سفارش |
| GET | `/orders/admin/all` | ادمین | همه سفارشات + فیلتر |
| POST | `/orders/:id/confirm` | ادمین | تأیید پرداخت |

### درخواست پروژه `/projects`

| Method | Path | دسترسی | توضیح |
|--------|------|---------|-------|
| POST | `/projects` | عمومی | ارسال فرم |
| GET | `/projects` | ادمین | لیست درخواست‌ها |
| PATCH | `/projects/:id` | ادمین | تغییر وضعیت |

### نظرات `/reviews`

| Method | Path | دسترسی | توضیح |
|--------|------|---------|-------|
| POST | `/reviews` | کاربر | ثبت نظر (فقط خریداران) |
| GET | `/reviews/:productId` | عمومی | نظرات تأییدشده محصول |
| PATCH | `/reviews/:id/approve` | ادمین | تأیید نظر |
| PATCH | `/reviews/:id/reject` | ادمین | رد نظر |

### کوپن `/coupons`

| Method | Path | دسترسی | توضیح |
|--------|------|---------|-------|
| POST | `/coupons/validate` | کاربر | اعتبارسنجی کد تخفیف |
| GET | `/coupons` | ادمین | لیست کوپن‌ها |
| POST | `/coupons` | ادمین | ایجاد کوپن |
| PATCH | `/coupons/:id` | ادمین | ویرایش کوپن |
| DELETE | `/coupons/:id` | ادمین | غیرفعال کردن |

### تنظیمات `/settings`

| Method | Path | دسترسی | توضیح |
|--------|------|---------|-------|
| GET | `/settings/public` | عمومی | دیتای صفحه اصلی یکجا (stats + ticker + services + featured) |
| GET | `/settings/dashboard` | ادمین | آمار داشبورد |
| GET | `/settings` | ادمین | تنظیمات key-value |
| PUT | `/settings` | ادمین | ذخیره تنظیمات |
| PUT | `/settings/ticker` | ادمین | بازنویسی آیتم‌های تیکر |
| PUT | `/settings/stats` | ادمین | بروزرسانی آمار Hero |

### پنل ادمین `/admin`

| Method | Path | دسترسی | توضیح |
|--------|------|---------|-------|
| GET | `/admin/users` | ادمین | لیست کاربران |
| PATCH | `/admin/users/:id` | ادمین | ویرایش کاربر |
| DELETE | `/admin/users/:id` | سوپرادمین | غیرفعال کردن کاربر |
| POST | `/admin/users` | سوپرادمین | ایجاد ادمین جدید |
| GET | `/admin/analytics` | ادمین | نمودار درآمد روزانه + پرفروش‌ها |
| GET | `/admin/orders` | ادمین | لیست سفارشات با فیلتر |
| PATCH | `/admin/orders/:id` | ادمین | تغییر وضعیت سفارش |
| GET | `/admin/reviews` | ادمین | لیست نظرات |
| DELETE | `/admin/reviews/:id` | ادمین | حذف نظر |
| PATCH | `/admin/coupons/:id` | ادمین | ویرایش کوپن |
| GET | `/admin/categories` | ادمین | لیست دسته‌بندی‌ها |
| POST | `/admin/categories` | ادمین | ایجاد دسته‌بندی |
| PATCH | `/admin/categories/:id` | ادمین | ویرایش دسته‌بندی |
| DELETE | `/admin/categories/:id` | سوپرادمین | حذف دسته‌بندی |
| POST | `/admin/products/:id/images` | ادمین | افزودن تصویر به محصول |
| DELETE | `/admin/products/:id/images/:imageId` | ادمین | حذف تصویر محصول |

### آپلود `/upload`

| Method | Path | دسترسی | توضیح |
|--------|------|---------|-------|
| POST | `/upload/image` | ادمین | آپلود تصویر (max 10MB) |
| DELETE | `/upload/:filename` | ادمین | حذف فایل |

---

## 🔐 احراز هویت

سیستم بر پایه **JWT + Refresh Token** است.

```
Access Token  →  عمر ۱۵ دقیقه  →  هدر Authorization: Bearer <token>
Refresh Token →  عمر ۳۰ روز   →  ذخیره در localStorage (کلید: tesign_refresh)
```

فرانت‌اند توکن را در `localStorage` با کلید `tesign_token` ذخیره می‌کند و به صورت خودکار به هدر همه درخواست‌ها اضافه می‌شود.

### سطوح دسترسی

| نقش | دسترسی |
|-----|---------|
| `CUSTOMER` | خرید، سبد، نظر، پروفایل |
| `ADMIN` | پنل ادمین کامل (بدون عملیات سوپرادمین) |
| `SUPER_ADMIN` | دسترسی کامل شامل حذف کاربر و دسته‌بندی |

---

## 🗄️ دیتابیس

| جدول | توضیح |
|------|-------|
| `users` | کاربران |
| `refresh_tokens` | توکن‌های JWT |
| `products` | محصولات فروشگاه |
| `categories` | دسته‌بندی محصولات |
| `product_images` | تصاویر محصول |
| `services` | خدمات آژانس |
| `service_features` | آیتم‌های هر خدمت |
| `carts` / `cart_items` | سبد خرید |
| `orders` / `order_items` | سفارشات (شماره DT-1404-XXXX) |
| `order_downloads` | لینک دانلود محصولات دیجیتال |
| `project_leads` | فرم‌های ثبت پروژه |
| `reviews` | نظرات (نیاز به تأیید ادمین) |
| `coupons` | کدهای تخفیف (درصدی / مقداری) |
| `site_settings` | تنظیمات key-value |
| `ticker_items` | متن‌های تیکر |
| `site_stats` | آمارهای Hero |

### دستورات Prisma

```bash
npm run db:migrate   # اجرای migration‌های جدید
npm run db:seed      # seed کردن دیتا
npm run db:studio    # رابط گرافیکی Prisma Studio
npm run db:reset     # reset کامل + seed مجدد
npm run db:generate  # بازسازی Prisma Client
```

---

## 🎨 طراحی (فرانت‌اند)

Tailwind CSS v4 با Design Tokens سفارشی، تم تاریک، فونت Vazirmatn و پشتیبانی کامل از RTL.

| توکن | مقدار |
|------|-------|
| `bg-base` | `#1E1E1E` |
| `bg-card` | `#2A2A2A` |
| `accent-yellow` | `#F5C518` |
| `accent-orange` | `#FF6B35` |
| `text-primary` | `#F0F0F0` |

---

## 🛠️ اسکریپت‌ها

```bash
# بک‌اند
cd backend
npm run dev          # حالت توسعه (nodemon)
npm start            # حالت production
npm run db:migrate
npm run db:seed
npm run db:studio

# فرانت‌اند
cd frontend
npm run dev          # سرور توسعه (پورت 5173)
npm run build        # بیلد production
npm run preview      # پیش‌نمایش بیلد
```

---

## 🔍 Health Check

```bash
curl http://localhost:5000/health
```

```json
{
  "status": "ok",
  "env": "development",
  "db": "connected",
  "timestamp": "..."
}
```

---

## 📝 نکات مهم

**مسیریابی فرانت:** پروژه از React Router استفاده نمی‌کند. مسیریابی با `window.location.pathname` پیاده‌سازی شده — برای مسیر جدید `App.jsx` را ویرایش کنید.

**Soft Delete:** محصولات، خدمات، کوپن‌ها و کاربران واقعاً حذف نمی‌شوند بلکه غیرفعال می‌شوند.

**نظرات:** فقط کاربرانی که محصول را با پرداخت موفق خریده‌اند می‌توانند نظر بگذارند. نظرات نیاز به تأیید ادمین دارند.

**Fallback داده:** اگر API در دسترس نباشد، فرانت‌اند از داده‌های استاتیک `src/data/siteData.js` استفاده می‌کند.

**آپلود:** فایل‌های آپلودشده در `backend/uploads/` ذخیره و از مسیر `/uploads/filename` قابل دسترس هستند.
