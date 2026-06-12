# 📋 پنل کاربری (Dashboard API)

مستندات کامل اندپوینت‌های جدید پنل کاربری — بخش `dashboard.controller.js`

---

## معرفی

این ماژول پنل کاربری را از یک صفحه ساده به یک داشبورد کامل تبدیل می‌کند.
تمام مسیرها زیر `/api/dashboard` قرار دارند و نیاز به **احراز هویت (Bearer Token)** دارند.

---

## نصب و راه‌اندازی

فایل‌های جدید / تغییریافته:

```
src/controllers/dashboard.controller.js   ← جدید
src/routes/dashboard.routes.js            ← جدید
src/server.js                             ← اضافه شدن import و mount
```

تنها تغییر در `server.js`:

```js
import dashboardRoutes from './routes/dashboard.routes.js';
// ...
app.use('/api/dashboard', dashboardRoutes);
```

هیچ migration جدیدی لازم نیست — از جداول موجود استفاده می‌شود.

---

## اندپوینت‌ها

### ▸ خلاصه داشبورد

```
GET /api/dashboard/summary
Authorization: Bearer <token>
```

پاسخ شامل: اطلاعات کاربر، آمار سفارشات (تعداد کل، پرداخت‌شده، مجموع هزینه)،
آمار پروژه‌ها (تعداد به تفکیک وضعیت)، تعداد دانلودهای فعال،
آخرین ۳ سفارش و ۲ پروژه اخیر.

---

### ▸ پروفایل

#### دریافت اطلاعات کامل پروفایل

```
GET /api/dashboard/profile
Authorization: Bearer <token>
```

پاسخ شامل: اطلاعات کاربر + آمار (تعداد سفارشات، پروژه‌ها، مجموع خرید)

---

#### بروزرسانی نام و شماره تلفن

```
PATCH /api/dashboard/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "علی احمدی",
  "phone": "09123456789"     // اختیاری — ارسال null برای حذف
}
```

---

#### تغییر رمز عبور

```
PATCH /api/dashboard/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "رمز_فعلی",
  "newPassword": "رمز_جدید_حداقل_۸_کاراکتر"
}
```

> پس از تغییر رمز، **تمام توکن‌های refresh بی‌اعتبار می‌شوند** — کاربر باید مجدداً login کند.

---

#### تغییر ایمیل

```
PATCH /api/dashboard/change-email
Authorization: Bearer <token>
Content-Type: application/json

{
  "newEmail": "new@example.com",
  "password": "رمز_عبور_برای_تأیید"
}
```

> پس از تغییر ایمیل، `isVerified` روی `false` تنظیم می‌شود.

---

### ▸ سفارشات فروشگاه

#### لیست سفارشات

```
GET /api/dashboard/orders?page=1&limit=10&paymentStatus=UNPAID
Authorization: Bearer <token>
```

**Query params:**
| پارامتر | مقادیر مجاز | پیش‌فرض |
|---------|------------|---------|
| `page` | عدد صحیح | 1 |
| `limit` | 1–50 | 10 |
| `status` | PENDING, PROCESSING, COMPLETED, CANCELLED, REFUNDED | — |
| `paymentStatus` | UNPAID, PAID, FAILED, REFUNDED | — |

هر سفارش شامل آیتم‌ها (با عکس و آیکن) و لینک‌های دانلود است.

---

#### جزئیات یک سفارش

```
GET /api/dashboard/orders/:orderId
Authorization: Bearer <token>
```

---

### ▸ دانلودها

```
GET /api/dashboard/downloads
Authorization: Bearer <token>
```

لیست تمام فایل‌های قابل دانلود از سفارشات **پرداخت‌شده**.
هر آیتم شامل `token` دانلود، تعداد دانلود باقی‌مانده، و تاریخ انقضاست.

---

### ▸ پروژه‌ها

#### لیست پروژه‌های کاربر

```
GET /api/dashboard/projects?page=1&limit=10&status=NEW
Authorization: Bearer <token>
```

**Query params:**
| پارامتر | مقادیر مجاز |
|---------|------------|
| `status` | NEW, CONTACTED, IN_PROGRESS, CONVERTED, CLOSED |

---

#### جزئیات یک پروژه

```
GET /api/dashboard/projects/:projectId
Authorization: Bearer <token>
```

---

#### ثبت پروژه جدید

```
POST /api/dashboard/projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "serviceId": "uuid-سرویس",           // اختیاری
  "projectType": "فروشگاهی",
  "subcategories": ["لندینگ پیج", "پنل ادمین"],
  "budget": "۵۰ تا ۱۰۰ میلیون",
  "timeline": "۱ تا ۲ ماه",
  "description": "توضیحات پروژه...",
  "attachments": [                      // اختیاری، حداکثر ۵ فایل
    {
      "filename": "wireframe.pdf",
      "originalName": "وایرفریم اولیه.pdf",
      "url": "https://...",
      "mimetype": "application/pdf",
      "size": 204800
    }
  ]
}
```

> نام، ایمیل و شماره کاربر **به‌طور خودکار** از توکن گرفته می‌شود.

---

## وضعیت‌های پروژه

| کد | نام فارسی | توضیح |
|----|----------|-------|
| `NEW` | جدید | تازه ثبت شده، در انتظار بررسی |
| `CONTACTED` | تماس گرفته شده | تیم با کاربر تماس گرفته |
| `IN_PROGRESS` | در حال انجام | پروژه شروع شده |
| `CONVERTED` | تبدیل به سفارش | به سفارش رسمی تبدیل شده |
| `CLOSED` | بسته شده | پروژه تکمیل یا لغو شده |

---

## مثال کامل: اتصال فرانت به داشبورد

```js
// دریافت خلاصه داشبورد
const res = await fetch('/api/dashboard/summary', {
  headers: { Authorization: `Bearer ${accessToken}` }
});
const { data } = await res.json();
// data.user, data.orders.summary, data.projects.summary, data.downloads.activeCount

// ثبت پروژه جدید
const res2 = await fetch('/api/dashboard/projects', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    projectType: 'فروشگاهی',
    budget: '۵۰ تا ۱۰۰ میلیون',
    description: 'نیاز به طراحی سایت فروشگاهی دارم',
  }),
});
```
