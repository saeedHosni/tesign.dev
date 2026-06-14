# API مدیریت خدمات (Services)

مستندات کامل بخش خدمات سایت تیزاین — شامل تمام endpoint های عمومی و ادمین.

---

## فهرست مطالب

- [ساختار داده](#ساختار-داده)
- [نصب و راه‌اندازی](#نصب-و-راه‌اندازی)
- [Endpointها](#endpointها)
  - [عمومی](#endpointهای-عمومی)
  - [ادمین — CRUD](#endpointهای-ادمین--crud)
  - [ادمین — ترتیب‌بندی](#endpointهای-ادمین--ترتیب‌بندی)
- [نمونه درخواست‌ها](#نمونه-درخواست‌ها)
- [تغییرات نسبت به نسخه قبل](#تغییرات-نسبت-به-نسخه-قبل)

---

## ساختار داده

### مدل `Service`

| فیلد        | نوع      | الزامی | توضیح |
|-------------|----------|--------|-------|
| `id`        | string   | —      | UUID، توسط دیتابیس تولید می‌شود |
| `slug`      | string   | —      | یکتا، اگر ارسال نشود از `title` تولید می‌شود |
| `title`     | string   | ✅     | عنوان سرویس |
| `category`  | string   | ✅     | برچسب دسته‌بندی نمایشی («دسته ۱» و...) |
| `icon`      | string?  | —      | emoji یا URL تصویر (مثال: `🌐` یا `/uploads/icon.png`) |
| `description` | string? | —    | توضیحات کوتاه |
| `linkText`  | string?  | —      | متن دکمه لینک («مشاوره رایگان ←») |
| `price`     | string?  | —      | قیمت نمایشی («از ۵ میلیون تومان») |
| `isActive`  | boolean  | —      | پیش‌فرض: `true` |
| `sortOrder` | number   | —      | ترتیب نمایش — پیش‌فرض: `0` |
| `createdAt` | datetime | —      | خودکار |
| `updatedAt` | datetime | —      | خودکار |
| `features`  | Feature[] | —     | آیتم‌های سرویس (رابطه) |

### مدل `ServiceFeature`

| فیلد        | نوع    | توضیح |
|-------------|--------|-------|
| `id`        | string | UUID |
| `serviceId` | string | کلید خارجی به `Service` |
| `label`     | string | متن آیتم («طراحی رابط کاربری (UI)» و...) |
| `sortOrder` | number | ترتیب نمایش |

---

## نصب و راه‌اندازی

### ۱. اعمال Migration

فیلدهای `linkText` و `price` به جدول `services` اضافه شده‌اند:

```bash
# اجرای migration جدید
npx prisma migrate dev --name services_extend

# یا در محیط production
npx prisma migrate deploy
```

اگر از migration دستی استفاده می‌کنید، فایل SQL زیر را اجرا کنید:

```sql
ALTER TABLE "services"
  ADD COLUMN IF NOT EXISTS "linkText" TEXT,
  ADD COLUMN IF NOT EXISTS "price"    TEXT;

CREATE INDEX IF NOT EXISTS "services_sortOrder_idx" ON "services"("sortOrder");
CREATE INDEX IF NOT EXISTS "services_isActive_idx"  ON "services"("isActive");
```

### ۲. جایگزینی فایل‌ها

```
prisma/schema.prisma                  ← schema آپدیت‌شده
src/controllers/service.controller.js ← کنترلر جدید
src/routes/service.routes.js          ← روت جدید
```

---

## Endpointها

### احراز هویت

| نوع        | توضیح |
|-----------|-------|
| بدون token | endpoint های عمومی |
| `Authorization: Bearer <token>` | endpoint های ادمین |

---

### Endpointهای عمومی

#### `GET /api/services`

دریافت لیست خدمات فعال (برای صفحه اصلی سایت).

**Query string اختیاری:**

| پارامتر | مقدار | توضیح |
|---------|-------|-------|
| `admin` | `1`   | بازگرداندن همه خدمات (فعال و غیرفعال) — برای پنل ادمین |

**مثال پاسخ:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "slug": "web-development",
      "title": "توسعه وب‌سایت",
      "category": "دسته ۱",
      "icon": "🌐",
      "description": "ساخت وب‌سایت‌های سریع، امن و حرفه‌ای...",
      "linkText": "مشاوره رایگان ←",
      "price": "از ۵ میلیون تومان",
      "isActive": true,
      "sortOrder": 0,
      "features": [
        { "id": "uuid", "label": "وب‌سایت شرکتی و سازمانی", "sortOrder": 0 },
        { "id": "uuid", "label": "فروشگاه اینترنتی (ووکامرس)", "sortOrder": 1 }
      ],
      "_count": { "projectLeads": 12 }
    }
  ]
}
```

---

#### `GET /api/services/:slug`

دریافت یک سرویس با slug (فقط خدمات فعال).

**مثال:** `GET /api/services/web-development`

---

### Endpointهای ادمین — CRUD

همه این endpoint ها نیاز به token ادمین دارند.

---

#### `POST /api/services`

ایجاد سرویس جدید.

**Body:**

```json
{
  "title": "توسعه وب‌سایت",
  "category": "دسته ۱",
  "slug": "web-development",
  "icon": "🌐",
  "description": "ساخت وب‌سایت‌های سریع، امن و حرفه‌ای...",
  "linkText": "مشاوره رایگان ←",
  "price": "از ۵ میلیون تومان",
  "sortOrder": 0,
  "isActive": true,
  "features": [
    "وب‌سایت شرکتی و سازمانی",
    "وب‌سایت شخص و پورتفولیو",
    "فروشگاه اینترنتی (ووکامرس)",
    "لندینگ‌پیج تبلیغاتی"
  ]
}
```

**نکات:**
- `title` و `category` الزامی هستند
- اگر `slug` ارسال نشود، از `title` تولید می‌شود
- اگر slug تکراری باشد، پسوند عددی اضافه می‌شود (`web-development-1`)
- آرایه `features` به طور خودکار با `sortOrder` ذخیره می‌شود

---

#### `PUT /api/services/:id`

ویرایش سرویس موجود. همه فیلدها اختیاری هستند.

**مثال — تغییر وضعیت و لیست آیتم‌ها:**

```json
{
  "isActive": false,
  "features": ["آیتم جدید ۱", "آیتم جدید ۲"]
}
```

**نکات:**
- اگر `features` ارسال شود، **لیست قبلی کاملاً جایگزین می‌شود**
- اگر `slug` ارسال شود، slug سرویس تغییر می‌کند
- اگر `title` تغییر کند و `slug` ارسال نشود، slug جدید از title تولید می‌شود

---

#### `PATCH /api/services/:id/toggle`

تغییر سریع وضعیت فعال/غیرفعال بدون نیاز به body.

**پاسخ:**

```json
{
  "success": true,
  "message": "سرویس فعال شد.",
  "data": { "id": "...", "isActive": true, "..." }
}
```

---

#### `DELETE /api/services/:id`

حذف سرویس.

| حالت | رفتار |
|------|-------|
| `DELETE /api/services/:id` | حذف نرم — سرویس غیرفعال می‌شود |
| `DELETE /api/services/:id?hard=1` | حذف کامل — سرویس و تمام آیتم‌هایش از دیتابیس پاک می‌شوند |

> **هشدار:** حذف کامل (`hard=1`) برگشت‌پذیر نیست.

---

### Endpointهای ادمین — ترتیب‌بندی

#### `PATCH /api/services/reorder`

تغییر ترتیب نمایش چند سرویس به صورت همزمان.

**Body:**

```json
{
  "items": [
    { "id": "uuid-service-1", "sortOrder": 0 },
    { "id": "uuid-service-2", "sortOrder": 1 },
    { "id": "uuid-service-3", "sortOrder": 2 }
  ]
}
```

**پاسخ:** لیست کامل سرویس‌ها با ترتیب جدید.

**نکات:**
- اگر یکی از `id` ها وجود نداشته باشد، عملیات کاملاً کنسل می‌شود
- عملیات در یک transaction انجام می‌شود (همه یا هیچ)

---

## نمونه درخواست‌ها

### افزودن سرویس جدید

```js
const response = await fetch('/api/services', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    title: 'بازاریابی دیجیتال',
    category: 'دسته ۴',
    icon: '📣',
    description: 'رشد کسب‌وکار شما در فضای آنلاین...',
    linkText: 'مشاوره رایگان ←',
    price: 'از ۳ میلیون تومان',
    sortOrder: 3,
    features: ['تبلیغات گوگل', 'اینستاگرام مارکتینگ', 'ایمیل مارکتینگ'],
  }),
});
```

### آپلود آیکون تصویری

برای استفاده از تصویر به جای emoji:

```js
// ۱. ابتدا تصویر را آپلود کنید
const formData = new FormData();
formData.append('image', file);

const upload = await fetch('/api/upload/image', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData,
});
const { data: { url } } = await upload.json();

// ۲. سپس URL را به عنوان icon ذخیره کنید
await fetch(`/api/services/${id}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({ icon: url }),
});
```

### تغییر ترتیب با drag-and-drop

```js
// پس از جابجایی آیتم‌ها در UI
const reordered = services.map((service, index) => ({
  id: service.id,
  sortOrder: index,
}));

await fetch('/api/services/reorder', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({ items: reordered }),
});
```

---

## تغییرات نسبت به نسخه قبل

| تغییر | توضیح |
|-------|-------|
| ✅ فیلد `linkText` اضافه شد | متن دکمه لینک هر سرویس («مشاوره رایگان ←») |
| ✅ فیلد `price` اضافه شد | قیمت نمایشی («از ۵ میلیون تومان») |
| ✅ فیلد `slug` قابل سفارشی‌سازی | در create/update می‌توان slug دلخواه داد |
| ✅ `PATCH /:id/toggle` اضافه شد | تغییر سریع وضعیت بدون PUT کامل |
| ✅ `PATCH /reorder` اضافه شد | تغییر ترتیب خدمات برای drag-and-drop |
| ✅ `DELETE ?hard=1` اضافه شد | گزینه حذف کامل در کنار حذف نرم |
| ✅ ایندکس‌های `isActive` و `sortOrder` اضافه شد | بهبود کارایی query ها |