# راهنمای اعمال تغییرات — Order Form Config

## مشکل چه بود؟
کنترلر (`orderFormConfig.controller.js`) و روت‌های ادمین (`admin.routes.js`) درست نوشته شده بودند،
اما **۵ مدل Prisma در schema.prisma وجود نداشتند**، به همین دلیل سرور crash می‌کرد.
همچنین فایل `orderFormConfig.routes.js` (عمومی) و ثبت آن در `server.js` وجود نداشت.

---

## چه فایل‌هایی تحویل داده شد؟

| فایل | کجا قرار بگیرد |
|------|---------------|
| `20260612120000_order_form_config/migration.sql` | `prisma/migrations/20260612120000_order_form_config/` |
| `schema_addition.prisma` | **مطالب آن را به انتهای** `prisma/schema.prisma` اضافه کنید |
| `orderFormConfig.routes.js` | `src/routes/orderFormConfig.routes.js` |
| `server.js` | جایگزین `src/server.js` |

---

## مراحل اعمال (به ترتیب)

### ۱. اضافه کردن مدل‌ها به schema.prisma
محتوای `schema_addition.prisma` را **کپی و به انتهای** `prisma/schema.prisma` اضافه کنید.

### ۲. اجرای migration
```bash
# گزینه الف — اجرای مستقیم SQL (توصیه‌شده اگر دیتابیس در production است)
psql $DATABASE_URL -f prisma/migrations/20260612120000_order_form_config/migration.sql

# گزینه ب — ثبت در Prisma migrate (برای dev)
npx prisma migrate dev --name order_form_config
# یا اگر می‌خواهید migration موجود را اعمال کنید:
npx prisma migrate resolve --applied 20260612120000_order_form_config
npx prisma migrate deploy
```

### ۳. رجنریت کردن Prisma Client
```bash
npx prisma generate
```

### ۴. کپی فایل‌های route و server
```bash
cp orderFormConfig.routes.js src/routes/
cp server.js src/
```

### ۵. ری‌استارت سرور
```bash
npm run dev
# یا
node src/server.js
```

---

## API Endpoints — ادمین (نیاز به JWT + role: ADMIN)

### دسته‌بندی‌های اصلی
| Method | URL | توضیح |
|--------|-----|-------|
| GET | `/api/admin/order-config/main-categories` | لیست همه |
| POST | `/api/admin/order-config/main-categories` | ایجاد جدید |
| PATCH | `/api/admin/order-config/main-categories/reorder` | تغییر ترتیب |
| PATCH | `/api/admin/order-config/main-categories/:id` | ویرایش |
| DELETE | `/api/admin/order-config/main-categories/:id` | حذف |

**Body ایجاد:**
```json
{ "key": "web_design", "title": "طراحی وب‌سایت", "description": "...", "icon": "🌐", "sortOrder": 0, "isActive": true }
```

### زیردسته‌ها
| Method | URL |
|--------|-----|
| GET | `/api/admin/order-config/subcategories?mainCategoryId=<id>` |
| POST | `/api/admin/order-config/subcategories` |
| PATCH | `/api/admin/order-config/subcategories/reorder` |
| PATCH | `/api/admin/order-config/subcategories/:id` |
| DELETE | `/api/admin/order-config/subcategories/:id` |

**Body ایجاد:**
```json
{ "label": "فروشگاه اینترنتی", "mainCategoryId": "uuid-here", "sortOrder": 1, "isActive": true }
```

### بازه‌های بودجه
| Method | URL |
|--------|-----|
| GET | `/api/admin/order-config/budget-options` |
| POST | `/api/admin/order-config/budget-options` |
| PATCH | `/api/admin/order-config/budget-options/reorder` |
| PATCH | `/api/admin/order-config/budget-options/:id` |
| DELETE | `/api/admin/order-config/budget-options/:id` |

**Body ایجاد:**
```json
{ "label": "۲ تا ۵ میلیون تومان", "value": "2m_5m", "icon": "💰", "sortOrder": 1, "isActive": true }
```

### بازه‌های زمانبندی
| Method | URL |
|--------|-----|
| GET | `/api/admin/order-config/timeline-options` |
| POST | `/api/admin/order-config/timeline-options` |
| PATCH | `/api/admin/order-config/timeline-options/reorder` |
| PATCH | `/api/admin/order-config/timeline-options/:id` |
| DELETE | `/api/admin/order-config/timeline-options/:id` |

**Body ایجاد:**
```json
{ "label": "۲ تا ۳ ماه", "value": "2m_3m", "sortOrder": 3, "isActive": true }
```

### قوانین تخمین قیمت
| Method | URL |
|--------|-----|
| GET | `/api/admin/order-config/price-estimates` |
| POST | `/api/admin/order-config/price-estimates` |
| PATCH | `/api/admin/order-config/price-estimates/:id` |
| DELETE | `/api/admin/order-config/price-estimates/:id` |

**Body ایجاد:**
```json
{
  "budgetOptionId": "uuid-budget",
  "timelineOptionId": "uuid-timeline",
  "minAmount": 8,
  "maxAmount": 30,
  "unit": "میلیون تومان",
  "isActive": true
}
```
> اگر هر دو `null` باشند → قانون پیش‌فرض کلی (fallback)

**reorder body:**
```json
{ "items": [{ "id": "uuid", "sortOrder": 0 }, { "id": "uuid2", "sortOrder": 1 }] }
```

---

## API Endpoints — عمومی (بدون نیاز به لاگین)

| Method | URL | توضیح |
|--------|-----|-------|
| GET | `/api/order-config` | همه گزینه‌های فعال برای رندر فرم |
| GET | `/api/order-config/estimate?budgetValue=2m_5m&timelineValue=2m_3m` | تخمین قیمت |

**پاسخ `/api/order-config`:**
```json
{
  "success": true,
  "data": {
    "mainCategories": [...],
    "subcategories": [...],
    "budgetOptions": [...],
    "timelineOptions": [...]
  }
}
```

**پاسخ `/api/order-config/estimate`:**
```json
{
  "success": true,
  "data": {
    "minAmount": 8,
    "maxAmount": 30,
    "unit": "میلیون تومان",
    "label": "8 تا 30 میلیون تومان"
  }
}
```

---

## منطق تخمین قیمت (اولویت‌بندی)
۱. تطبیق دقیق هر دو (بودجه + زمانبندی)
۲. فقط بودجه تطبیق دارد
۳. فقط زمانبندی تطبیق دارد
۴. قانون پیش‌فرض کلی (هر دو null)
