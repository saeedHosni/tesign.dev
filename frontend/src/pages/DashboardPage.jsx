// src/pages/DashboardPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import SectionLabel from '../components/ui/SectionLabel';

const BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:5000/api';

function navigate(path) {
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
  PENDING:   { label: 'در انتظار تأیید', cls: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  CONFIRMED: { label: 'تأیید شده',       cls: 'text-green-400  bg-green-400/10  border-green-400/20'  },
  PROCESSING:{ label: 'در حال پردازش',   cls: 'text-blue-400   bg-blue-400/10   border-blue-400/20'   },
  COMPLETED: { label: 'تکمیل شده',       cls: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  CANCELLED: { label: 'لغو شده',         cls: 'text-red-400    bg-red-400/10    border-red-400/20'    },
};

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, cls: 'text-text-muted bg-white/5 border-border-default' };
  return (
    <span className={`text-[0.75rem] font-medium px-2.5 py-1 rounded-full border ${s.cls}`}>
      {s.label}
    </span>
  );
}

// ── Section Card ──────────────────────────────────────────────────────────────

function Card({ children, className = '' }) {
  return (
    <div className={`bg-bg-surface border border-border-default rounded-2xl p-6 ${className}`}>
      {children}
    </div>
  );
}

// ── Tab Button ────────────────────────────────────────────────────────────────

function Tab({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium
        bg-transparent border-none cursor-pointer transition-all duration-200 w-full text-right
        ${active
          ? 'bg-accent-yellow/10 text-accent-yellow border border-accent-yellow/25'
          : 'text-text-secondary hover:text-text-primary hover:bg-white/5 border border-transparent'}
      `}
    >
      <span className="text-base">{icon}</span>
      {label}
    </button>
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
    <div className="flex items-center justify-center h-32 text-text-muted gap-3">
      <span className="w-5 h-5 border-2 border-text-muted/30 border-t-accent-yellow rounded-full animate-spin" />
      در حال بارگذاری…
    </div>
  );

  if (err) return (
    <p className="text-center text-red-400 py-8">{err}</p>
  );

  if (!orders.length) return (
    <div className="text-center py-12">
      <div className="text-4xl mb-3">🛒</div>
      <p className="text-text-muted text-sm mb-4">هنوز سفارشی ثبت نکرده‌اید</p>
      <Button variant="outline" onClick={() => navigate('/shop')}>
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
                {new Date(order.createdAt).toLocaleDateString('fa-IR')}
              </p>
            </div>
            <StatusBadge status={order.status} />
          </div>

          {/* Items */}
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
            <span className="text-xs text-text-muted">مجموع</span>
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
        body: JSON.stringify({ name, phone }),
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
      <div className="flex flex-col gap-1.5">
        <label className="text-[0.82rem] font-medium text-text-secondary">نام و نام‌خانوادگی</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-bg-base border border-border-default text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-yellow/60 transition-colors"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[0.82rem] font-medium text-text-secondary">ایمیل</label>
        <input
          value={user?.email || ''}
          disabled
          className="w-full px-4 py-3 rounded-lg bg-bg-base border border-border-default text-text-muted text-sm cursor-not-allowed opacity-60"
        />
        <p className="text-[0.75rem] text-text-muted">ایمیل قابل تغییر نیست</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[0.82rem] font-medium text-text-secondary">شماره تلفن (اختیاری)</label>
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
        {loading ? 'در حال ذخیره…' : 'ذخیره تغییرات'}
      </Button>
    </div>
  );
}

// ── Password Tab ──────────────────────────────────────────────────────────────

function PasswordTab() {
  const [current,  setCurrent]  = useState('');
  const [next,     setNext]     = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [msg,      setMsg]      = useState('');
  const [err,      setErr]      = useState('');

  const handleChange = async () => {
    if (!current || !next || !confirm) { setErr('همه فیلدها الزامی هستند'); return; }
    if (next.length < 6) { setErr('رمز جدید باید حداقل ۶ کاراکتر باشد'); return; }
    if (next !== confirm) { setErr('رمز جدید و تکرار آن یکسان نیستند'); return; }
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

  const Field = ({ label, value, onChange, placeholder }) => (
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
      <Field label="رمز عبور فعلی"  value={current} onChange={setCurrent} placeholder="رمز عبور فعلی" />
      <Field label="رمز عبور جدید"  value={next}    onChange={setNext}    placeholder="حداقل ۶ کاراکتر" />
      <Field label="تکرار رمز جدید" value={confirm} onChange={setConfirm} placeholder="رمز جدید را تکرار کنید" />

      {err && <p className="text-[0.82rem] text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{err}</p>}
      {msg && <p className="text-[0.82rem] text-green-400 bg-green-400/10 border border-green-400/20 rounded-lg px-3 py-2">{msg}</p>}

      <Button variant="primary" onClick={handleChange} disabled={loading} className="w-fit">
        {loading ? 'در حال تغییر…' : 'تغییر رمز عبور'}
      </Button>
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

  // redirect to home if not logged in (after auth check done)
  useEffect(() => {
    if (!loading && !isLoggedIn) {
      navigate('/');
    }
  }, [loading, isLoggedIn]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-muted gap-3">
        <span className="w-6 h-6 border-2 border-text-muted/30 border-t-accent-yellow rounded-full animate-spin" />
        در حال بارگذاری…
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-20 px-4">
      <div className="max-w-[1100px] mx-auto">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <SectionLabel>پنل کاربری</SectionLabel>
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary mt-1">
              سلام، {user.name} 👋
            </h1>
            <p className="text-text-muted text-sm mt-1">{user.email}</p>
          </div>

          <Button variant="ghost" onClick={handleLogout} className="text-sm">
            خروج از حساب
          </Button>
        </div>

        {/* Layout */}
        <div className="flex flex-col md:flex-row gap-6">

          {/* Sidebar */}
          <aside className="md:w-56 flex-shrink-0">
            <Card className="p-3 flex flex-col gap-1">
              {/* Avatar */}
              <div className="flex flex-col items-center py-4 mb-2 border-b border-border-default">
                <div className="w-14 h-14 rounded-full bg-accent-yellow/15 border-2 border-accent-yellow/30 flex items-center justify-center text-2xl mb-2">
                  {user.name?.charAt(0) || '?'}
                </div>
                <p className="font-bold text-text-primary text-sm">{user.name}</p>
                <span className={`text-[0.7rem] mt-1 px-2 py-0.5 rounded-full border
                  ${user.role === 'ADMIN' || user.role === 'SUPER_ADMIN'
                    ? 'text-accent-yellow bg-accent-yellow/10 border-accent-yellow/25'
                    : 'text-text-muted bg-white/5 border-border-default'}`}>
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

          {/* Content */}
          <main className="flex-1 min-w-0">
            <Card>
              <h2 className="font-bold text-text-primary mb-6 pb-4 border-b border-border-default">
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
