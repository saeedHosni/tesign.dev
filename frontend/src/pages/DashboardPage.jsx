// src/pages/DashboardPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import SectionLabel from '../components/ui/SectionLabel';

const BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:5000/api';

function goTo(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0 });
}

function token() { return localStorage.getItem('tesign_token'); }

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
    },
    ...opts,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'خطا در ارتباط با سرور');
  return data;
}

// ── Status Badge ──────────────────────────────────────────────────────────────

const STATUS_MAP = {
  PENDING:    { label: 'در انتظار تأیید', cls: 'text-yellow-400  bg-yellow-400/10  border-yellow-400/20'  },
  CONFIRMED:  { label: 'تأیید شده',       cls: 'text-green-400   bg-green-400/10   border-green-400/20'   },
  PROCESSING: { label: 'در حال پردازش',   cls: 'text-blue-400    bg-blue-400/10    border-blue-400/20'    },
  COMPLETED:  { label: 'تکمیل شده',       cls: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  CANCELLED:  { label: 'لغو شده',         cls: 'text-red-400     bg-red-400/10     border-red-400/20'     },
};

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, cls: 'text-text-muted bg-white/5 border-border-default' };
  return (
    <span className={`text-[0.75rem] font-medium px-2.5 py-1 rounded-full border ${s.cls}`}>
      {s.label}
    </span>
  );
}

// ── Card shell ────────────────────────────────────────────────────────────────

function Card({ children, className = '' }) {
  return (
    <div className={`bg-bg-surface border border-border-default rounded-2xl p-6 ${className}`}>
      {children}
    </div>
  );
}

// ── Sidebar Tab Button ────────────────────────────────────────────────────────

function Tab({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2.5 px-4 py-2.5 rounded-xl
        text-sm font-medium w-full text-right
        bg-transparent border cursor-pointer transition-all duration-200
        ${active
          ? 'bg-accent-yellow/10 text-accent-yellow border-accent-yellow/25'
          : 'text-text-secondary hover:text-text-primary hover:bg-white/5 border-transparent'}
      `}
    >
      <span className="text-base">{icon}</span>
      {label}
    </button>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────

function Spinner({ size = 5 }) {
  return (
    <span className={`w-${size} h-${size} border-2 border-text-muted/30 border-t-accent-yellow rounded-full animate-spin`} />
  );
}

// ── Orders Tab ────────────────────────────────────────────────────────────────

function OrdersTab() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState('');

  useEffect(() => {
    apiFetch('/orders/my')
      .then(res => setOrders(res.orders || res))
      .catch(e  => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center gap-3 h-32 text-text-muted text-sm">
      <Spinner /> در حال بارگذاری…
    </div>
  );

  if (err) return (
    <p className="text-center text-red-400 py-8 text-sm">{err}</p>
  );

  if (!orders.length) return (
    <div className="text-center py-12">
      <div className="text-4xl mb-3">🛒</div>
      <p className="text-text-muted text-sm mb-5">هنوز سفارشی ثبت نکرده‌اید</p>
      <Button variant="outline" onClick={() => goTo('/shop')}>
        رفتن به فروشگاه
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {orders.map(order => (
        <div
          key={order.id}
          className="border border-border-default rounded-xl p-4 hover:border-accent-yellow/20 transition-colors"
        >
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="font-bold text-text-primary text-sm">{order.orderNumber}</p>
              <p className="text-text-muted text-xs mt-0.5">
                {new Date(order.createdAt).toLocaleDateString('fa-IR', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </p>
            </div>
            <StatusBadge status={order.status} />
          </div>

          {order.items?.length > 0 && (
            <div className="mt-3 flex flex-col gap-1.5">
              {order.items.map(item => (
                <div key={item.id} className="flex items-center justify-between text-xs text-text-secondary">
                  <span>{item.product?.name || item.name}</span>
                  <span className="text-text-muted">× {item.quantity}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-border-default flex items-center justify-between">
            <span className="text-xs text-text-muted">مجموع سفارش</span>
            <span className="font-bold text-accent-yellow text-sm">
              {Number(order.totalAmount).toLocaleString('fa-IR')} تومان
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Profile Tab ───────────────────────────────────────────────────────────────

function ProfileTab() {
  const { user, refreshProfile } = useAuth();
  const [name,    setName]    = useState(user?.name    || '');
  const [phone,   setPhone]   = useState(user?.phone   || '');
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState('');
  const [err,     setErr]     = useState('');

  const handleSave = async () => {
    if (!name.trim()) { setErr('نام نمی‌تواند خالی باشد'); return; }
    setErr(''); setMsg('');
    setLoading(true);
    try {
      await apiFetch('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({ name: name.trim(), phone }),
      });
      await refreshProfile();
      setMsg('پروفایل با موفقیت به‌روز شد ✓');
    } catch (e) {
      setErr(e.message || 'خطا در ذخیره تغییرات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 max-w-md">
      {/* نام */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[0.82rem] font-medium text-text-secondary">نام و نام‌خانوادگی</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-bg-base border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-yellow/60 transition-colors"
        />
      </div>

      {/* ایمیل (غیرقابل ویرایش) */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[0.82rem] font-medium text-text-secondary">ایمیل</label>
        <input
          value={user?.email || ''}
          disabled
          className="w-full px-4 py-3 rounded-lg bg-bg-base border border-border-default text-text-muted text-sm cursor-not-allowed opacity-60"
        />
        <p className="text-[0.74rem] text-text-muted">ایمیل قابل تغییر نیست</p>
      </div>

      {/* تلفن */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[0.82rem] font-medium text-text-secondary">شماره تلفن <span className="text-text-muted font-normal">(اختیاری)</span></label>
        <input
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="09xxxxxxxxx"
          className="w-full px-4 py-3 rounded-lg bg-bg-base border border-border-default text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-yellow/60 transition-colors"
        />
      </div>

      {err && <p className="text-[0.82rem] text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{err}</p>}
      {msg && <p className="text-[0.82rem] text-green-400 bg-green-400/10 border border-green-400/20 rounded-lg px-3 py-2">{msg}</p>}

      <Button variant="primary" onClick={handleSave} disabled={loading} className="w-fit">
        {loading ? <span className="flex items-center gap-2"><Spinner size={4} /> ذخیره…</span> : 'ذخیره تغییرات'}
      </Button>
    </div>
  );
}

// ── Password Tab ──────────────────────────────────────────────────────────────

function PasswordTab() {
  const [current, setCurrent] = useState('');
  const [next,    setNext]    = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState('');
  const [err,     setErr]     = useState('');

  const handleChange = async () => {
    if (!current || !next || !confirm) { setErr('همه فیلدها الزامی هستند'); return; }
    if (next.length < 6)               { setErr('رمز جدید باید حداقل ۶ کاراکتر باشد'); return; }
    if (next !== confirm)              { setErr('رمز جدید و تکرار آن یکسان نیستند'); return; }
    setErr(''); setMsg('');
    setLoading(true);
    try {
      await apiFetch('/auth/change-password', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      setMsg('رمز عبور با موفقیت تغییر کرد ✓');
      setCurrent(''); setNext(''); setConfirm('');
    } catch (e) {
      setErr(e.message || 'خطا در تغییر رمز عبور');
    } finally {
      setLoading(false);
    }
  };

  const PwField = ({ label, value, onChange, placeholder }) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-[0.82rem] font-medium text-text-secondary">{label}</label>
      <input
        type="password"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-lg bg-bg-base border border-border-default text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-yellow/60 transition-colors"
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-5 max-w-md">
      <PwField label="رمز عبور فعلی"  value={current} onChange={setCurrent} placeholder="رمز عبور فعلی" />
      <PwField label="رمز عبور جدید"  value={next}    onChange={setNext}    placeholder="حداقل ۶ کاراکتر" />
      <PwField label="تکرار رمز جدید" value={confirm} onChange={setConfirm} placeholder="رمز جدید را تکرار کنید" />

      {err && <p className="text-[0.82rem] text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{err}</p>}
      {msg && <p className="text-[0.82rem] text-green-400 bg-green-400/10 border border-green-400/20 rounded-lg px-3 py-2">{msg}</p>}

      <Button variant="primary" onClick={handleChange} disabled={loading} className="w-fit">
        {loading ? <span className="flex items-center gap-2"><Spinner size={4} /> تغییر…</span> : 'تغییر رمز عبور'}
      </Button>
    </div>
  );
}

// ── Redirect Guard — نمایش می‌دن که وارد بشی ────────────────────────────────

function LoginPrompt() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-bold text-text-primary mb-2">دسترسی محدود</h2>
        <p className="text-text-muted text-sm mb-6">
          برای مشاهده پنل کاربری ابتدا وارد حساب خود شوید.
        </p>
        <Button variant="primary" onClick={() => goTo('/')} className="justify-center">
          رفتن به صفحه اصلی
        </Button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'orders',   icon: '📦', label: 'سفارشات من' },
  { id: 'profile',  icon: '👤', label: 'اطلاعات پروفایل' },
  { id: 'password', icon: '🔒', label: 'تغییر رمز عبور' },
];

export default function DashboardPage() {
  const { user, loading, isLoggedIn, logout } = useAuth();
  const [tab, setTab] = useState('orders');

  const handleLogout = async () => {
    await logout();
    goTo('/');
  };

  // ── در حال بررسی session ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gap-3 text-text-muted">
        <Spinner size={6} />
        <span className="text-sm">در حال بارگذاری…</span>
      </div>
    );
  }

  // ── لاگین نشده → نمایش پیام به جای redirect ──────────────────────────────
  // (redirect واقعی در AuthContext انجام می‌شه اگه token معتبر نبود)
  if (!isLoggedIn) {
    return <LoginPrompt />;
  }

  // ── داشبورد اصلی ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pt-28 pb-20 px-4">
      <div className="max-w-[1100px] mx-auto">

        {/* Page header */}
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <SectionLabel>پنل کاربری</SectionLabel>
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary mt-1">
              سلام، {user.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-text-muted text-sm mt-1">{user.email}</p>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="text-sm self-start">
            خروج از حساب
          </Button>
        </div>

        {/* Layout */}
        <div className="flex flex-col md:flex-row gap-6">

          {/* Sidebar */}
          <aside className="md:w-56 flex-shrink-0">
            <Card className="p-3 flex flex-col gap-1">
              {/* Avatar block */}
              <div className="flex flex-col items-center py-4 mb-2 border-b border-border-default">
                <div className="
                  w-14 h-14 rounded-full
                  bg-accent-yellow/15 border-2 border-accent-yellow/30
                  flex items-center justify-center
                  text-2xl font-bold text-accent-yellow mb-2 select-none
                ">
                  {user.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <p className="font-bold text-text-primary text-sm text-center truncate max-w-[160px]">{user.name}</p>
                <span className={`
                  text-[0.7rem] mt-1.5 px-2.5 py-0.5 rounded-full border
                  ${user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'
                    ? 'text-accent-yellow bg-accent-yellow/10 border-accent-yellow/25'
                    : 'text-text-muted bg-white/5 border-border-default'}
                `}>
                  {user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? 'ادمین' : 'کاربر'}
                </span>
              </div>

              {TABS.map(t => (
                <Tab
                  key={t.id}
                  active={tab === t.id}
                  onClick={() => setTab(t.id)}
                  icon={t.icon}
                  label={t.label}
                />
              ))}
            </Card>
          </aside>

          {/* Content panel */}
          <main className="flex-1 min-w-0">
            <Card>
              <h2 className="font-bold text-text-primary mb-6 pb-4 border-b border-border-default flex items-center gap-2">
                <span>{TABS.find(t => t.id === tab)?.icon}</span>
                {TABS.find(t => t.id === tab)?.label}
              </h2>

              {tab === 'orders'   && <OrdersTab />}
              {tab === 'profile'  && <ProfileTab />}
              {tab === 'password' && <PasswordTab />}
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}
