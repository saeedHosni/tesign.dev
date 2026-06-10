# DigiTeam Backend API 🚀

بک‌اند کامل سایت دیجی‌تیم — آژانس دیجیتال فارسی  
ساخته شده با **Node.js + Express + PostgreSQL + Prisma**

---

## ⚙️ پیش‌نیازها

- Node.js `>= 18`
- PostgreSQL `>= 14`
- npm یا yarn

---

## 🚀 راه‌اندازی سریع

### ۱. نصب وابستگی‌ها

```bash
cd digiteam-backend
npm install
```

### ۲. تنظیم محیط

```bash
cp .env.example .env
```

فایل `.env` را باز کنید و اطلاعات را تکمیل کنید:

```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/digiteam_db?schema=public"
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_REFRESH_SECRET=your_super_secret_refresh_key
```

### ۳. ساخت دیتابیس

```bash
# ساخت دیتابیس در PostgreSQL
createdb digiteam_db

# یا با psql:
psql -U postgres -c "CREATE DATABASE digiteam_db;"
```

### ۴. اجرای Migration و Seed

```bash
npm run db:migrate    # ساخت جداول
npm run db:seed       # پر کردن دیتای اولیه
```

### ۵. اجرای سرور

```bash
npm run dev    # حالت توسعه (با nodemon)
npm start      # حالت تولید
```

سرور روی `http://localhost:5000` اجرا می‌شود.

---

## 📁 ساختار پروژه

```
digiteam-backend/
├── prisma/
│   ├── schema.prisma          # تعریف کامل دیتابیس
│   └── seed.js                # دیتای اولیه (خدمات، محصولات، ادمین)
├── src/
│   ├── server.js              # نقطه ورود Express
│   ├── config/
│   │   └── db.js              # اتصال Prisma
│   ├── middleware/
│   │   ├── auth.middleware.js # JWT + نقش‌ها
│   │   ├── errorHandler.js    # مدیریت خطا
│   │   └── validate.js        # اعتبارسنجی
│   ├── controllers/           # منطق هر API
│   │   ├── auth.controller.js
│   │   ├── product.controller.js
│   │   ├── service.controller.js
│   │   ├── project.controller.js
│   │   ├── order.controller.js
│   │   ├── cart.controller.js
│   │   ├── review.controller.js
│   │   ├── coupon.controller.js
│   │   ├── settings.controller.js
│   │   ├── admin.controller.js
│   │   └── upload.controller.js
│   └── routes/                # تعریف مسیرها
│       ├── auth.routes.js
│       ├── product.routes.js
│       └── ...
└── uploads/                   # فایل‌های آپلودی
```

---

## 🗄️ مدل‌های دیتابیس

| جدول              | توضیح                                      |
|-------------------|--------------------------------------------|
| `users`           | کاربران (ادمین، مدیر، مشتری)               |
| `refresh_tokens`  | توکن‌های بازنشانی JWT                       |
| `services`        | خدمات آژانس                                |
| `service_features`| آیتم‌های هر سرویس                          |
| `products`        | محصولات فروشگاه                            |
| `categories`      | دسته‌بندی محصولات                          |
| `product_images`  | تصاویر محصول                               |
| `carts`           | سبد خرید                                   |
| `cart_items`      | آیتم‌های سبد                               |
| `wishlist_items`  | علاقه‌مندی‌ها                              |
| `orders`          | سفارشات با شماره منحصربه‌فرد DT-1404-XXXX  |
| `order_items`     | آیتم‌های سفارش (قیمت لحظه خرید)           |
| `order_downloads` | لینک دانلود محصولات دیجیتال                |
| `project_leads`   | فرم ثبت پروژه                              |
| `reviews`         | نظرات (فقط خریداران، نیاز به تأیید)         |
| `coupons`         | کدهای تخفیف (درصدی / مقداری)              |
| `site_settings`   | تنظیمات سایت (key-value)                  |
| `ticker_items`    | متن‌های مارکی                              |
| `site_stats`      | آمارهای Hero (پروژه‌ها، مشتریان، رتبه)    |

---

## 🔌 API Endpoints

### 🔐 احراز هویت `/api/auth`
| Method | Path               | Access  | توضیح                    |
|--------|--------------------|---------|--------------------------|
| POST   | `/register`        | Public  | ثبت‌نام                  |
| POST   | `/login`           | Public  | ورود                     |
| POST   | `/refresh`         | Public  | تمدید access token       |
| POST   | `/logout`          | Public  | خروج                     |
| GET    | `/me`              | User    | اطلاعات کاربر جاری       |
| PATCH  | `/me`              | User    | بروزرسانی پروفایل        |
| PATCH  | `/change-password` | User    | تغییر رمز عبور           |

### 📦 محصولات `/api/products`
| Method | Path               | Access  | توضیح                    |
|--------|--------------------|---------|--------------------------|
| GET    | `/`                | Public  | لیست + فیلتر + صفحه‌بندی |
| GET    | `/featured`        | Public  | محصولات ویژه             |
| GET    | `/categories`      | Public  | دسته‌بندی‌ها             |
| GET    | `/:slug`           | Public  | جزئیات محصول             |
| POST   | `/`                | Admin   | ایجاد محصول              |
| PUT    | `/:id`             | Admin   | ویرایش محصول             |
| DELETE | `/:id`             | Admin   | حذف (soft)               |

### 🛠️ خدمات `/api/services`
| Method | Path     | Access  | توضیح        |
|--------|----------|---------|--------------|
| GET    | `/`      | Public  | همه خدمات    |
| GET    | `/:slug` | Public  | یک سرویس     |
| POST   | `/`      | Admin   | ایجاد        |
| PUT    | `/:id`   | Admin   | ویرایش       |

### 📝 ثبت پروژه `/api/projects`
| Method | Path       | Access  | توضیح               |
|--------|------------|---------|---------------------|
| POST   | `/`        | Public  | ارسال فرم تماس      |
| GET    | `/`        | Admin   | لیست درخواست‌ها     |
| GET    | `/stats`   | Admin   | آمار درخواست‌ها     |
| PATCH  | `/:id`     | Admin   | تغییر وضعیت         |

### 🛒 سبد خرید `/api/cart`
| Method | Path            | Access | توضیح              |
|--------|-----------------|--------|--------------------|
| GET    | `/`             | User   | مشاهده سبد          |
| POST   | `/add`          | User   | افزودن محصول        |
| PATCH  | `/item/:itemId` | User   | تغییر تعداد         |
| DELETE | `/item/:itemId` | User   | حذف از سبد          |
| DELETE | `/clear`        | User   | خالی کردن سبد       |

### 💳 سفارشات `/api/orders`
| Method | Path            | Access | توضیح                |
|--------|-----------------|--------|----------------------|
| POST   | `/`             | User   | ثبت سفارش از سبد     |
| GET    | `/my`           | User   | سفارشات من           |
| GET    | `/:id`          | User   | جزئیات سفارش         |
| GET    | `/admin/all`    | Admin  | همه سفارشات          |
| POST   | `/:id/confirm`  | Admin  | تأیید پرداخت          |

### ⭐ نظرات `/api/reviews`
| Method | Path                | Access | توضیح                     |
|--------|---------------------|--------|---------------------------|
| POST   | `/`                 | User   | ارسال نظر (فقط خریداران) |
| GET    | `/:productId`       | Public | نظرات یک محصول            |
| PATCH  | `/:id/approve`      | Admin  | تأیید نظر                 |

### 🏷️ کوپن `/api/coupons`
| Method | Path          | Access  | توضیح           |
|--------|---------------|---------|-----------------|
| POST   | `/validate`   | User    | بررسی کد تخفیف  |
| GET    | `/`           | Admin   | لیست کوپن‌ها    |
| POST   | `/`           | Admin   | ایجاد کوپن      |
| DELETE | `/:id`        | Admin   | غیرفعال کردن    |

### ⚙️ تنظیمات `/api/settings`
| Method | Path          | Access  | توضیح                          |
|--------|---------------|---------|--------------------------------|
| GET    | `/public`     | Public  | همه دیتای صفحه اول یکجا        |
| GET    | `/dashboard`  | Admin   | آمار داشبورد                   |
| GET    | `/`           | Admin   | همه تنظیمات                    |
| PUT    | `/`           | Admin   | بروزرسانی تنظیمات              |
| PUT    | `/ticker`     | Admin   | بروزرسانی متن‌های مارکی        |
| PUT    | `/stats`      | Admin   | بروزرسانی آمار Hero            |

### 👑 ادمین `/api/admin`
| Method | Path             | Access       | توضیح             |
|--------|------------------|--------------|-------------------|
| GET    | `/users`         | Admin        | لیست کاربران      |
| PATCH  | `/users/:id`     | Admin        | ویرایش کاربر      |
| POST   | `/users`         | SuperAdmin   | ایجاد ادمین جدید  |
| GET    | `/analytics`     | Admin        | نمودار درآمد      |

### 📤 آپلود `/api/upload`
| Method | Path            | Access | توضیح          |
|--------|-----------------|--------|----------------|
| POST   | `/image`        | Admin  | آپلود تصویر    |
| DELETE | `/:filename`    | Admin  | حذف فایل       |

---

## 🔒 نکات امنیتی

- JWT با Refresh Token Rotation
- Rate Limiting (کلی و برای login/register)
- Helmet.js برای HTTP headers امن
- اعتبارسنجی کامل ورودی‌ها با express-validator
- Soft delete برای محصولات
- فقط خریداران می‌توانند نظر بگذارند
- نظرات نیاز به تأیید ادمین دارند

---

## 🔄 اتصال به فرانت‌اند

در فرانت‌اند React خود، این endpoint را در Load سایت فراخوانی کنید تا همه دیتا یکجا بارگذاری شود:

```javascript
// src/hooks/useSiteData.js
const response = await fetch(`${API_URL}/api/settings/public`);
const { stats, ticker, services, featuredProducts } = await response.json();
```

برای فرم ثبت پروژه (ProjectBanner):

```javascript
const response = await fetch(`${API_URL}/api/projects`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: value, source: 'banner' }),
});
```

---

## 🗃️ دستورات Prisma

```bash
npm run db:migrate    # اجرای migration‌های جدید
npm run db:seed       # seed کردن دیتا
npm run db:studio     # باز کردن Prisma Studio (GUI)
npm run db:reset      # reset کامل + seed مجدد
npm run db:generate   # بازسازی Prisma Client
```

---

## 📧 ایمیل (در مرحله بعد)

برای فعال‌سازی ارسال ایمیل، در `.env` اطلاعات SMTP را تکمیل کنید. 
سیستم از nodemailer استفاده می‌کند و آماده اضافه کردن template فارسی است.
