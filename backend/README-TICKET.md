# 🎫 سیستم تیکت پشتیبانی

مستندات کامل اندپوینت‌های سیستم تیکت — بخش کاربری و ادمین

---

## ساختار فایل‌های جدید

```
ticket_files/
├── prisma/
│   ├── migrations/
│   │   └── 20260614200000_add_ticket_system/
│   │       └── migration.sql          ← اجرا روی دیتابیس
│   └── schema_ticket_addition.prisma  ← اضافه به schema.prisma
│
├── src/
│   ├── controllers/
│   │   └── ticket.controller.js       ← همه توابع (کاربر + ادمین)
│   └── routes/
│       ├── ticket.routes.js           ← مسیرهای کاربری
│       └── adminTicket.routes.js      ← مسیرهای ادمین
│
└── CHANGES_TO_EXISTING_FILES.js       ← چه چیزی به فایل‌های موجود اضافه شود
```

---

## مراحل نصب

### گام ۱ — Migration دیتابیس

```bash
# اجرای migration
npx prisma migrate dev --name add_ticket_system

# یا اجرای مستقیم SQL:
psql $DATABASE_URL -f prisma/migrations/20260614200000_add_ticket_system/migration.sql
```

### گام ۲ — بروزرسانی schema.prisma

محتوای `schema_ticket_addition.prisma` را به انتهای `prisma/schema.prisma` اضافه کنید.

همچنین به مدل **User** این دو relation اضافه کنید:
```prisma
tickets        Ticket[]
ticketMessages TicketMessage[]
```

و به مدل **Order**:
```prisma
tickets        Ticket[]
```

### گام ۳ — کپی فایل‌های جدید

```bash
cp ticket_files/src/controllers/ticket.controller.js  src/controllers/
cp ticket_files/src/routes/ticket.routes.js           src/routes/
cp ticket_files/src/routes/adminTicket.routes.js      src/routes/
```

### گام ۴ — تغییر در فایل‌های موجود

**در `src/server.js`** (بعد از import dashboardRoutes):
```js
import ticketRoutes from './routes/ticket.routes.js';
// ...
app.use('/api/dashboard/tickets', ticketRoutes);
```

**در `src/routes/admin.routes.js`** (بعد از import‌های موجود):
```js
import adminTicketRoutes from './adminTicket.routes.js';
// ...
router.use('/tickets', adminTicketRoutes);
```

### گام ۵ — Prisma Client را regenerate کنید

```bash
npx prisma generate
```

---

## مدل داده‌ها

### وضعیت تیکت (`TicketStatus`)

| کد | نام فارسی | توضیح |
|----|----------|-------|
| `OPEN` | باز | جدید یا پاسخ کاربر — منتظر ادمین |
| `ANSWERED` | پاسخ داده شده | ادمین پاسخ داده |
| `PENDING` | در انتظار کاربر | ادمین منتظر اطلاعات بیشتر از کاربر |
| `CLOSED` | بسته شده | تیکت خاتمه یافته |

### دپارتمان (`TicketDepartment`)

| کد | توضیح |
|----|-------|
| `SUPPORT` | پشتیبانی عمومی |
| `TECHNICAL` | بخش فنی |
| `SALES` | بخش فروش |
| `ORDER` | مرتبط با سفارش خاص |

### اولویت (`TicketPriority`)

| کد | نام |
|----|-----|
| `LOW` | کم |
| `MEDIUM` | متوسط |
| `HIGH` | زیاد |

---

## اندپوینت‌های کاربری

همه مسیرها زیر `/api/dashboard/tickets` — نیاز به **Bearer Token**

---

### ▸ ثبت تیکت جدید

```
POST /api/dashboard/tickets
Authorization: Bearer <token>
Content-Type: application/json

{
  "subject": "مشکل در دانلود محصول",
  "body": "پس از پرداخت، لینک دانلود کار نمی‌کند...",
  "department": "SUPPORT",       // اختیاری — پیش‌فرض: SUPPORT
  "priority": "HIGH",            // اختیاری — پیش‌فرض: MEDIUM
  "orderId": "uuid-سفارش",       // اختیاری — فقط برای تیکت مرتبط با سفارش
  "attachments": [               // اختیاری — حداکثر ۵ فایل
    {
      "filename": "screenshot.jpg",
      "originalName": "اسکرین‌شات خطا.jpg",
      "url": "https://...",
      "mimetype": "image/jpeg",
      "size": 102400
    }
  ]
}
```

**پاسخ `201`:**
```json
{
  "success": true,
  "message": "تیکت شما با موفقیت ثبت شد.",
  "data": {
    "id": "uuid",
    "ticketNumber": "TK-202606-0001",
    "department": "SUPPORT",
    "priority": "HIGH",
    "status": "OPEN",
    "subject": "مشکل در دانلود محصول",
    "createdAt": "2026-06-14T..."
  }
}
```

---

### ▸ لیست تیکت‌های کاربر

```
GET /api/dashboard/tickets?page=1&limit=10&status=OPEN&department=SUPPORT
Authorization: Bearer <token>
```

**Query params:**
| پارامتر | مقادیر مجاز | پیش‌فرض |
|---------|------------|---------|
| `page` | عدد صحیح | 1 |
| `limit` | 1–50 | 10 |
| `status` | OPEN, ANSWERED, PENDING, CLOSED | — |
| `department` | SUPPORT, TECHNICAL, SALES, ORDER | — |

---

### ▸ جزئیات تیکت + تمام پیام‌ها

```
GET /api/dashboard/tickets/:id
Authorization: Bearer <token>
```

---

### ▸ ارسال پیام جدید در تیکت

```
POST /api/dashboard/tickets/:id/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "body": "اطلاعات بیشتر: ...",
  "attachments": []   // اختیاری
}
```

> پس از ارسال پیام کاربر، وضعیت تیکت به `OPEN` برمی‌گردد.

---

### ▸ بستن تیکت توسط کاربر

```
PATCH /api/dashboard/tickets/:id/close
Authorization: Bearer <token>
```

---

## اندپوینت‌های ادمین

همه مسیرها زیر `/api/admin/tickets` — نیاز به **Bearer Token + نقش ADMIN/MANAGER**

---

### ▸ آمار تیکت‌ها

```
GET /api/admin/tickets/stats
```

**پاسخ:**
```json
{
  "success": true,
  "data": {
    "byStatus": { "OPEN": 12, "ANSWERED": 5, "CLOSED": 30 },
    "byDepartment": { "SUPPORT": 20, "TECHNICAL": 15, "SALES": 5 },
    "byPriority": { "HIGH": 3, "MEDIUM": 10, "LOW": 4 },
    "unansweredOver24h": 2
  }
}
```

---

### ▸ لیست همه تیکت‌ها

```
GET /api/admin/tickets?page=1&limit=20&status=OPEN&priority=HIGH&search=کلمه&assignedTo=me
```

**Query params اضافی:**
| پارامتر | توضیح |
|---------|-------|
| `priority` | LOW, MEDIUM, HIGH |
| `search` | جستجو در موضوع، شماره تیکت، نام/ایمیل کاربر |
| `assignedTo` | `me` = تیکت‌های خودم / `none` = بدون ادمین / `<uuid>` = ادمین خاص |

---

### ▸ جزئیات تیکت (شامل یادداشت‌های داخلی)

```
GET /api/admin/tickets/:id
```

---

### ▸ پاسخ به تیکت

```
POST /api/admin/tickets/:id/messages
Content-Type: application/json

{
  "body": "سلام، مشکل شما بررسی شد...",
  "isInternal": false,    // true = یادداشت داخلی که کاربر نمی‌بینه
  "attachments": []
}
```

> اگر `isInternal: false` باشد، وضعیت تیکت به `ANSWERED` تغییر می‌کند.
> اگر ادمین برای اولین بار پاسخ دهد، تیکت به او **assign** می‌شود.

---

### ▸ تغییر وضعیت / اولویت / assign

```
PATCH /api/admin/tickets/:id
Content-Type: application/json

{
  "status": "CLOSED",          // اختیاری
  "priority": "HIGH",          // اختیاری
  "assignedTo": "uuid-admin"   // اختیاری — null برای آزاد کردن
}
```

---

## منطق کسب‌وکار

| رویداد | تغییر وضعیت |
|--------|------------|
| کاربر تیکت ثبت کرد | `OPEN` |
| ادمین پاسخ عمومی داد | `ANSWERED` |
| کاربر پاسخ داد | `OPEN` (دوباره منتظر ادمین) |
| ادمین یادداشت internal گذاشت | بدون تغییر |
| ادمین وضعیت را `PENDING` کرد | `PENDING` (منتظر کاربر) |
| کاربر یا ادمین تیکت را بست | `CLOSED` + `closedAt` ثبت می‌شود |

---

## مثال اتصال فرانت

```js
// ثبت تیکت جدید
const res = await fetch('/api/dashboard/tickets', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    subject: 'مشکل در پرداخت',
    body: 'بعد از کلیک روی پرداخت، صفحه سفید می‌شه...',
    department: 'TECHNICAL',
    priority: 'HIGH',
  }),
});

// لیست تیکت‌ها
const tickets = await fetch('/api/dashboard/tickets?status=OPEN', {
  headers: { Authorization: `Bearer ${accessToken}` },
});

// ارسال پیام در تیکت
const msg = await fetch(`/api/dashboard/tickets/${ticketId}/messages`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ body: 'تصویر خطا را پیوست کردم.' }),
});
```
