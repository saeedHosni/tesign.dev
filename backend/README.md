بک‌اند کامل سایت تیزاین — آژانس دیجیتال فارسی  
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
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/tesign_db?schema=public"
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_REFRESH_SECRET=your_super_secret_refresh_key
```

### ۳. ساخت دیتابیس

```bash
createdb tesign_db
# یا با psql:
psql -U postgres -c "CREATE DATABASE tesign_db;"
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
│       ├── service.routes.js
│       ├── project.routes.js
│       ├── order.routes.js
│       ├── cart.routes.js
│       ├── review.routes.js
│       ├── coupon.routes.js
│       ├── settings.routes.js
│       ├── admin.routes.js
│       └── upload.routes.js
└── uploads/                   # فایل‌های آپلودی
```

---

## 🗄️ مدل‌های دیتابیس

| جدول                 | توضیح                                     |
| -------------------- | ----------------------------------------- |
| `users`              | کاربران (ادمین، مدیر، مشتری)              |
| `refresh_tokens`     | توکن‌های بازنشانی JWT                     |
| `services`           | خدمات آژانس                               |
| `service_features`   | آیتم‌های هر سرویس                         |
| `products`           | محصولات فروشگاه                           |
| `categories`         | دسته‌بندی محصولات                         |
| `product_images`     | تصاویر محصول                              |
| `carts`              | سبد خرید                                  |
| `cart_items`         | آیتم‌های سبد                              |
| `wishlist_items`     | علاقه‌مندی‌ها                             |
| `orders`             | سفارشات با شماره منحصربه‌فرد DT-1404-XXXX |
| `order_items`        | آیتم‌های سفارش (قیمت لحظه خرید)           |
| `order_downloads`    | لینک دانلود محصولات دیجیتال               |
| `project_leads`      | فرم ثبت پروژه                             |
| `project_lead_files` | فایل‌های مرجع آپلودشده با فرم ثبت سفارش   |
| `reviews`            | نظرات (فقط خریداران، نیاز به تأیید)       |
| `coupons`            | کدهای تخفیف (درصدی / مقداری)              |
| `site_settings`      | تنظیمات سایت (key-value)                  |
| `ticker_items`       | متن‌های مارکی                             |
| `site_stats`         | آمارهای Hero (پروژه‌ها، مشتریان، رتبه)    |

---

## 🔌 API Endpoints

### 🔐 احراز هویت `/api/auth`

| Method | Path               | Access | توضیح              |
| ------ | ------------------ | ------ | ------------------ |
| POST   | `/register`        | Public | ثبت‌نام            |
| POST   | `/login`           | Public | ورود               |
| POST   | `/refresh`         | Public | تمدید access token |
| POST   | `/logout`          | Public | خروج               |
| GET    | `/me`              | User   | اطلاعات کاربر جاری |
| PATCH  | `/me`              | User   | بروزرسانی پروفایل  |
| PATCH  | `/change-password` | User   | تغییر رمز عبور     |

---

### 📦 محصولات `/api/products`

| Method | Path          | Access | توضیح                                                   |
| ------ | ------------- | ------ | ------------------------------------------------------- |
| GET    | `/`           | Public | لیست + فیلتر + صفحه‌بندی (`?admin=1` برای ادمین)        |
| GET    | `/featured`   | Public | محصولات ویژه (حداکثر ۸ تا)                              |
| GET    | `/categories` | Public | دسته‌بندی‌های سطح اول با تعداد محصول                    |
| GET    | `/:slug`      | Public | جزئیات محصول + تصاویر + نظرات تأییدشده                  |
| POST   | `/`           | Admin  | ایجاد محصول (slug خودکار ساخته می‌شود)                  |
| PUT    | `/:id`        | Admin  | ویرایش محصول (slug فقط در صورت تغییر name تغییر می‌کند) |
| DELETE | `/:id`        | Admin  | غیرفعال کردن محصول (soft delete)                        |

**پارامترهای فیلتر GET `/`:**

```
?page=1&limit=12&category=slug&search=text&sort=price&order=desc
&featured=true&minPrice=10000&maxPrice=500000&admin=1
```

---

### 🛠️ خدمات `/api/services`

| Method | Path     | Access | توضیح                                          |
| ------ | -------- | ------ | ---------------------------------------------- |
| GET    | `/`      | Public | خدمات فعال (`?admin=1` برای همه خدمات)         |
| GET    | `/:slug` | Public | جزئیات یک سرویس                                |
| POST   | `/`      | Admin  | ایجاد سرویس + features                         |
| PUT    | `/:id`   | Admin  | ویرایش سرویس (features کاملاً جایگزین می‌شوند) |
| DELETE | `/:id`   | Admin  | غیرفعال کردن سرویس (soft delete)               |

---

### 📝 ثبت پروژه `/api/projects`

| Method | Path                 | Access | توضیح                                  |
| ------ | -------------------- | ------ | -------------------------------------- |
| POST   | `/`                  | Public | ارسال فرم ثبت سفارش (auth اختیاری)     |
| GET    | `/`                  | Admin  | لیست درخواست‌ها + فیلتر                |
| GET    | `/stats`             | Admin  | آمار تعداد بر اساس وضعیت               |
| GET    | `/:id`               | Admin  | جزئیات کامل یک درخواست + فایل‌های مرجع |
| PATCH  | `/:id`               | Admin  | تغییر status / notes / assignedTo      |
| DELETE | `/:id/files/:fileId` | Admin  | حذف یک فایل مرجع از درخواست            |

بدنه‌ی `POST /api/projects` این فیلدها را می‌پذیرد:

```json
{
  "name": "string",
  "email": "string (یا phone الزامی)",
  "phone": "string (یا email الزامی)",
  "serviceId": "uuid (اختیاری)",
  "projectType": "طراحی وبسایت | UI/UX طراحی | ...",
  "subcategories": ["وبسایت شرکتی / سازمانی", "..."],
  "budget": "۲ تا ۵ میلیون تومان | ...",
  "timeline": "۱ تا ۲ ماه | ...",
  "description": "string",
  "attachments": [
    {
      "filename": "uuid.png",
      "url": "...",
      "originalName": "...",
      "mimetype": "...",
      "size": 12345
    }
  ],
  "source": "hero | services | banner | footer | order_form"
}
```

#### 📎 آپلود فایل‌های مرجع `/api/upload/project-files`

| Method | Path             | Access                | توضیح                                                                                  |
| ------ | ---------------- | --------------------- | -------------------------------------------------------------------------------------- |
| POST   | `/project-files` | Public (rate-limited) | آپلود تا ۵ فایل (تصویر/PDF/ZIP/PSD/AI/Figma/Sketch، حداکثر هرکدام طبق `MAX_FILE_SIZE`) |

پاسخ شامل آرایه‌ای از `{ filename, originalName, url, mimetype, size }` است. خروجی هر فایل باید پیش از ارسال فرم نهایی، داخل آرایه‌ی `attachments` در `POST /api/projects` قرار بگیرد.

---

### 🛒 سبد خرید `/api/cart`

| Method | Path            | Access | توضیح         |
| ------ | --------------- | ------ | ------------- |
| GET    | `/`             | User   | مشاهده سبد    |
| POST   | `/add`          | User   | افزودن محصول  |
| PATCH  | `/item/:itemId` | User   | تغییر تعداد   |
| DELETE | `/item/:itemId` | User   | حذف از سبد    |
| DELETE | `/clear`        | User   | خالی کردن سبد |

---

### 💳 سفارشات `/api/orders`

| Method | Path           | Access | توضیح                                                |
| ------ | -------------- | ------ | ---------------------------------------------------- |
| POST   | `/`            | User   | ثبت سفارش از سبد (با اعتبارسنجی کوپن و موجودی محصول) |
| GET    | `/my`          | User   | سفارشات کاربر جاری                                   |
| GET    | `/:id`         | User   | جزئیات سفارش (ادمین می‌تواند هر سفارشی را ببیند)     |
| GET    | `/admin/all`   | Admin  | همه سفارشات + فیلتر status/paymentStatus/search      |
| POST   | `/:id/confirm` | Admin  | تأیید پرداخت + ایجاد لینک دانلود + بروزرسانی موجودی  |

---

### ⭐ نظرات `/api/reviews`

| Method | Path           | Access | توضیح                                         |
| ------ | -------------- | ------ | --------------------------------------------- |
| POST   | `/`            | User   | ارسال نظر (فقط خریداران محصول با پرداخت موفق) |
| GET    | `/:productId`  | Public | نظرات تأییدشده یک محصول                       |
| PATCH  | `/:id/approve` | Admin  | تأیید نظر + recalculate امتیاز محصول          |
| PATCH  | `/:id/reject`  | Admin  | رد نظر + recalculate امتیاز محصول             |

---

### 🏷️ کوپن `/api/coupons`

| Method | Path        | Access | توضیح                                        |
| ------ | ----------- | ------ | -------------------------------------------- |
| POST   | `/validate` | User   | بررسی کد تخفیف + محاسبه مقدار تخفیف          |
| GET    | `/`         | Admin  | لیست کوپن‌ها با صفحه‌بندی (`?isActive=true`) |
| POST   | `/`         | Admin  | ایجاد کوپن (PERCENTAGE یا FIXED)             |
| PATCH  | `/:id`      | Admin  | ویرایش کوپن                                  |
| DELETE | `/:id`      | Admin  | غیرفعال کردن کوپن (soft delete)              |

---

### ⚙️ تنظیمات `/api/settings`

| Method | Path         | Access | توضیح                                                          |
| ------ | ------------ | ------ | -------------------------------------------------------------- |
| GET    | `/public`    | Public | همه دیتای صفحه اول یکجا (stats + ticker + services + featured) |
| GET    | `/dashboard` | Admin  | آمار داشبورد (کاربران، سفارشات، درآمد این ماه و ماه قبل، رشد)  |
| GET    | `/`          | Admin  | همه تنظیمات key-value                                          |
| PUT    | `/`          | Admin  | بروزرسانی دسته‌ای تنظیمات                                      |
| PUT    | `/ticker`    | Admin  | بازنویسی کامل آیتم‌های مارکی (transaction)                     |
| PUT    | `/stats`     | Admin  | بروزرسانی آمارهای Hero                                         |

**پاسخ `/dashboard` شامل:**

```json
{
  "totalUsers": 0,
  "newUsersThisMonth": 0,
  "totalOrders": 0,
  "ordersThisMonth": 0,
  "totalRevenue": 0,
  "revenueThisMonth": 0,
  "revenueLastMonth": 0,
  "revenueGrowth": 12,
  "totalProducts": 0,
  "recentOrders": [],
  "newLeads": 0,
  "pendingReviews": 0
}
```

---

### 👑 ادمین `/api/admin`

همه endpoint های این بخش نیاز به `protect + isAdmin` دارند.  
موارد مشخص‌شده با **SuperAdmin** فقط برای نقش `ADMIN` مجاز هستند (نه `MANAGER`).

#### کاربران

| Method | Path         | Access     | توضیح                                                             |
| ------ | ------------ | ---------- | ----------------------------------------------------------------- |
| GET    | `/users`     | Admin      | لیست کاربران + فیلتر role/search + صفحه‌بندی                      |
| PATCH  | `/users/:id` | Admin      | ویرایش name/role/isActive/isVerified (نمی‌توان روی خود اعمال کرد) |
| DELETE | `/users/:id` | SuperAdmin | غیرفعال کردن کاربر (soft delete، نمی‌توان روی خود اعمال کرد)      |
| POST   | `/users`     | SuperAdmin | ایجاد ادمین یا مدیر جدید (با بررسی تکراری بودن email)             |

#### آنالیتیکس

| Method | Path         | Access | توضیح                                             |
| ------ | ------------ | ------ | ------------------------------------------------- |
| GET    | `/analytics` | Admin  | نمودار درآمد روزانه + مجموع + پرفروش‌ترین محصولات |

**پارامتر:** `?period=30` (تعداد روز، پیش‌فرض ۳۰)

#### سفارشات (ادمین)

| Method | Path          | Access | توضیح                                                        |
| ------ | ------------- | ------ | ------------------------------------------------------------ |
| GET    | `/orders`     | Admin  | لیست سفارشات + فیلتر status/paymentStatus/search + صفحه‌بندی |
| PATCH  | `/orders/:id` | Admin  | تغییر status سفارش و/یا notes                                |

#### نظرات (ادمین)

| Method | Path           | Access | توضیح                                            |
| ------ | -------------- | ------ | ------------------------------------------------ |
| GET    | `/reviews`     | Admin  | لیست نظرات + فیلتر `?approved=false` + صفحه‌بندی |
| DELETE | `/reviews/:id` | Admin  | حذف نظر + recalculate امتیاز محصول               |

#### کوپن‌ها (ادمین)

| Method | Path           | Access | توضیح       |
| ------ | -------------- | ------ | ----------- |
| PATCH  | `/coupons/:id` | Admin  | ویرایش کوپن |

> **نکته:** ایجاد، لیست و حذف کوپن از طریق `/api/coupons` انجام می‌شود.

#### دسته‌بندی‌ها

| Method | Path              | Access     | توضیح                                                     |
| ------ | ----------------- | ---------- | --------------------------------------------------------- |
| GET    | `/categories`     | Admin      | لیست همه دسته‌بندی‌ها + تعداد محصول + زیردسته             |
| POST   | `/categories`     | Admin      | ایجاد دسته‌بندی (name + slug الزامی)                      |
| PATCH  | `/categories/:id` | Admin      | ویرایش دسته‌بندی                                          |
| DELETE | `/categories/:id` | SuperAdmin | حذف دسته‌بندی (در صورت داشتن محصول یا زیردسته خطا می‌دهد) |

#### تصاویر محصول

| Method | Path                            | Access | توضیح                 |
| ------ | ------------------------------- | ------ | --------------------- |
| POST   | `/products/:id/images`          | Admin  | افزودن تصویر به محصول |
| DELETE | `/products/:id/images/:imageId` | Admin  | حذف تصویر محصول       |

---

### 📤 آپلود `/api/upload`

| Method | Path         | Access | توضیح                               |
| ------ | ------------ | ------ | ----------------------------------- |
| POST   | `/image`     | Admin  | آپلود تصویر (jpeg/png/webp/gif/svg) |
| DELETE | `/:filename` | Admin  | حذف فایل آپلودشده                   |

**محدودیت:** حداکثر ۱۰MB (قابل تغییر از طریق `MAX_FILE_SIZE` در `.env`)

---

## 🔒 سطوح دسترسی

| نقش        | توضیح                                                        |
| ---------- | ------------------------------------------------------------ |
| `CUSTOMER` | کاربر عادی — خرید، سبد، نظر، پروفایل                         |
| `MANAGER`  | مدیر — دسترسی به تمام API های Admin (به‌جز موارد SuperAdmin) |
| `ADMIN`    | سوپرادمین — دسترسی کامل شامل ایجاد کاربر ادمین، حذف‌های حساس |

---

## 🔒 نکات امنیتی

- JWT با Refresh Token Rotation (توکن قدیمی پس از refresh حذف می‌شود)
- Rate Limiting: کلی ۲۰۰۰۰ درخواست / ۱۵ دقیقه، login/register ۱۰۰۰۰ / ۱۵ دقیقه
- Helmet.js برای HTTP headers امن
- اعتبارسنجی ورودی‌ها با express-validator
- Soft delete برای محصولات، کوپن‌ها، سرویس‌ها و کاربران
- فقط خریداران با پرداخت موفق می‌توانند نظر بگذارند
- نظرات نیاز به تأیید ادمین دارند
- ادمین نمی‌تواند حساب یا نقش خودش را تغییر دهد
- stock فقط برای محصولات فیزیکی کاهش می‌یابد (stock = -1 یعنی دیجیتال/نامحدود)

---

## 🔄 اتصال به فرانت‌اند

بارگذاری دیتای صفحه اول:

```javascript
const response = await fetch(`${API_URL}/api/settings/public`);
const { stats, ticker, services, featuredProducts } = await response.json();
```

فرم ثبت پروژه:

```javascript
const response = await fetch(`${API_URL}/api/projects`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: value, source: "banner" }),
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
