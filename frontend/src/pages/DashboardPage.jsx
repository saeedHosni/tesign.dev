// src/pages/DashboardPage.jsx — پنل کاربری کامل
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import SectionLabel from '../components/ui/SectionLabel';
import { ORDER_CATEGORIES, BUDGET_OPTIONS, TIMELINE_OPTIONS } from '../data/siteData';
import { dashboardApi, uploadApi } from '../services/api';

const BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:5000/api';
function goTo(path) { window.history.pushState({}, '', path); window.dispatchEvent(new PopStateEvent('popstate')); window.scrollTo({ top: 0 }); }

// ── Shared UI primitives ──────────────────────────────────────────────────────

function Spinner({ size = 5 }) {
  return <span className={`inline-block w-${size} h-${size} border-2 border-text-muted/30 border-t-accent-yellow rounded-full animate-spin`} />;
}

function Card({ children, className = '' }) {
  return <div className={`bg-bg-surface border border-border-default rounded-2xl p-6 ${className}`}>{children}</div>;
}

function SideTab({ active, onClick, icon, label, badge }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium w-full text-right bg-transparent border cursor-pointer transition-all duration-200 ${active ? 'bg-accent-yellow/10 text-accent-yellow border-accent-yellow/25' : 'text-text-secondary hover:text-text-primary hover:bg-white/5 border-transparent'}`}>
      <span className="text-base">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge > 0 && <span className="text-[0.65rem] font-bold px-1.5 py-0.5 rounded-full bg-accent-yellow/15 text-accent-yellow border border-accent-yellow/25">{badge}</span>}
    </button>
  );
}

function Alert({ type = 'error', children }) {
  const cls = type === 'success'
    ? 'text-green-400 bg-green-400/10 border-green-400/20'
    : 'text-red-400 bg-red-400/10 border-red-400/20';
  return <p className={`text-[0.82rem] border rounded-lg px-3 py-2 ${cls}`}>{children}</p>;
}

const ORDER_STATUS_MAP = {
  PENDING:    { label: 'در انتظار',    cls: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  PROCESSING: { label: 'در حال پردازش', cls: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  COMPLETED:  { label: 'تکمیل شده',   cls: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  CANCELLED:  { label: 'لغو شده',     cls: 'text-red-400 bg-red-400/10 border-red-400/20' },
  REFUNDED:   { label: 'مسترد شده',   cls: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
  PAID:       { label: 'پرداخت شده',  cls: 'text-green-400 bg-green-400/10 border-green-400/20' },
  UNPAID:     { label: 'پرداخت نشده', cls: 'text-orange-400 bg-orange-400/10 border-orange-400/20' },
  FAILED:     { label: 'ناموفق',      cls: 'text-red-400 bg-red-400/10 border-red-400/20' },
};

const PROJECT_STATUS_MAP = {
  NEW:         { label: 'جدید',          cls: 'text-blue-400 bg-blue-400/10 border-blue-400/20',        icon: '🆕' },
  CONTACTED:   { label: 'تماس گرفته شد', cls: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',  icon: '📞' },
  IN_PROGRESS: { label: 'در حال انجام',  cls: 'text-purple-400 bg-purple-400/10 border-purple-400/20',  icon: '⚙️' },
  CONVERTED:   { label: 'تبدیل به سفارش', cls: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', icon: '✅' },
  CLOSED:      { label: 'بسته شده',      cls: 'text-text-muted bg-white/5 border-border-default',        icon: '🔒' },
};

function StatusBadge({ status, map }) {
  const s = (map || ORDER_STATUS_MAP)[status] || { label: status, cls: 'text-text-muted bg-white/5 border-border-default' };
  return <span className={`text-[0.73rem] font-semibold px-2.5 py-1 rounded-full border ${s.cls}`}>{s.label}</span>;
}

function EmptyState({ emoji, title, subtitle, btnLabel, btnTo }) {
  return (
    <div className="text-center py-14">
      <div className="text-5xl mb-3">{emoji}</div>
      <p className="text-text-primary font-bold mb-1">{title}</p>
      <p className="text-text-muted text-sm mb-6">{subtitle}</p>
      {btnLabel && <Button variant="outline" onClick={() => goTo(btnTo)}>{btnLabel}</Button>}
    </div>
  );
}

// ── Summary Tab ───────────────────────────────────────────────────────────────

function SummaryTab({ user, onTabChange }) {
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.getSummary()
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center gap-3 h-40 text-text-muted text-sm"><Spinner />در حال بارگذاری…</div>;

  const orders   = data?.orders   || {};
  const projects = data?.projects || {};
  const dl       = data?.downloads || {};

  const stats = [
    { icon: '📦', label: 'کل سفارشات',   value: orders.summary?.total     ?? user?._count?.orders ?? 0,       color: 'text-blue-400',    onClick: () => onTabChange('orders')    },
    { icon: '✅', label: 'پرداخت شده',    value: orders.summary?.paid      ?? 0,                               color: 'text-emerald-400', onClick: () => onTabChange('orders')    },
    { icon: '📋', label: 'پروژه‌های من',  value: projects.summary?.total   ?? user?._count?.projectLeads ?? 0, color: 'text-purple-400',  onClick: () => onTabChange('projects')  },
    { icon: '📥', label: 'دانلود فعال',   value: dl.activeCount            ?? 0,                               color: 'text-accent-yellow', onClick: () => onTabChange('downloads')},
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <button key={i} onClick={s.onClick}
            className="bg-bg-base border border-border-default rounded-xl p-4 text-right hover:border-accent-yellow/20 transition-all duration-200 cursor-pointer group">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className={`text-2xl font-black ${s.color}`}>{String(s.value).toLocaleString('fa-IR')}</div>
            <div className="text-text-muted text-xs mt-1">{s.label}</div>
          </button>
        ))}
      </div>

      {/* Total spent */}
      {(orders.summary?.totalSpent || 0) > 0 && (
        <div className="bg-[rgba(245,197,24,0.05)] border border-accent-yellow/15 rounded-xl p-4 flex items-center gap-4">
          <span className="text-3xl">💳</span>
          <div>
            <p className="text-text-muted text-xs mb-0.5">مجموع خرید</p>
            <p className="font-black text-accent-yellow text-xl">
              {Math.round((orders.summary.totalSpent || 0) / 10).toLocaleString('fa-IR')} تومان
            </p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        {/* Recent orders */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-text-primary">آخرین سفارشات</p>
            <button onClick={() => onTabChange('orders')} className="text-xs text-accent-yellow hover:underline bg-transparent border-none cursor-pointer">مشاهده همه</button>
          </div>
          {(orders.recent?.length || 0) === 0 ? (
            <p className="text-text-muted text-sm text-center py-6 bg-bg-base rounded-xl border border-border-default">سفارشی وجود ندارد</p>
          ) : (
            <div className="flex flex-col gap-2">
              {orders.recent.map(o => (
                <div key={o.id} className="flex items-center gap-3 bg-bg-base rounded-xl px-4 py-3 border border-border-default">
                  <span className="text-lg">{o.items?.[0]?.product?.icon || '📦'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary font-medium truncate">{o.orderNumber}</p>
                    <p className="text-xs text-text-muted">{new Date(o.createdAt).toLocaleDateString('fa-IR')}</p>
                  </div>
                  <StatusBadge status={o.paymentStatus} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent projects */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-text-primary">آخرین پروژه‌ها</p>
            <button onClick={() => onTabChange('projects')} className="text-xs text-accent-yellow hover:underline bg-transparent border-none cursor-pointer">مشاهده همه</button>
          </div>
          {(projects.recent?.length || 0) === 0 ? (
            <p className="text-text-muted text-sm text-center py-6 bg-bg-base rounded-xl border border-border-default">پروژه‌ای ثبت نشده</p>
          ) : (
            <div className="flex flex-col gap-2">
              {projects.recent.map(p => (
                <div key={p.id} className="flex items-center gap-3 bg-bg-base rounded-xl px-4 py-3 border border-border-default">
                  <span className="text-lg">{p.service?.icon || '🚀'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary font-medium truncate">{p.projectType || p.service?.title || 'پروژه'}</p>
                    <p className="text-xs text-text-muted">{new Date(p.createdAt).toLocaleDateString('fa-IR')}</p>
                  </div>
                  <StatusBadge status={p.status} map={PROJECT_STATUS_MAP} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3 pt-2 border-t border-border-default">
        <Button variant="primary" onClick={() => onTabChange('new-project')}>➕ ثبت پروژه جدید</Button>
        <Button variant="ghost" onClick={() => goTo('/shop')}>🛒 فروشگاه</Button>
        <Button variant="ghost" onClick={() => goTo('/order')}>📋 صفحه ثبت سفارش</Button>
      </div>
    </div>
  );
}

// ── Orders Tab ────────────────────────────────────────────────────────────────

function OrderDetailModal({ orderId, onClose }) {
  const [order, setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState('');
  useEffect(() => {
    dashboardApi.getOrderById(orderId)
      .then(res => setOrder(res.data))
      .catch(e  => setErr(e.message))
      .finally(() => setLoading(false));
  }, [orderId]);

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-bg-surface border border-border-default rounded-2xl shadow-[0_16px_64px_rgba(0,0,0,0.5)] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-default sticky top-0 bg-bg-surface z-10">
          <h3 className="font-bold text-text-primary">جزئیات سفارش</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary bg-transparent border-none cursor-pointer text-xl">×</button>
        </div>
        <div className="p-6">
          {loading && <div className="flex items-center justify-center gap-3 h-32 text-text-muted text-sm"><Spinner /> بارگذاری…</div>}
          {err && <p className="text-center text-red-400 py-8 text-sm">{err}</p>}
          {order && (
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <p className="font-bold text-accent-yellow">{order.orderNumber}</p>
                  <p className="text-text-muted text-xs mt-0.5">{new Date(order.createdAt).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <StatusBadge status={order.paymentStatus} />
              </div>
              <div>
                <p className="text-text-muted text-xs mb-2">آیتم‌های سفارش</p>
                <div className="flex flex-col gap-2">
                  {(order.items || []).map((item, i) => (
                    <div key={i} className="flex items-center justify-between bg-bg-base rounded-lg px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{item.product?.icon || '📦'}</span>
                        <p className="text-text-primary text-sm">{item.product?.name || '—'}</p>
                        <span className="text-text-muted text-xs">× {item.quantity}</span>
                      </div>
                      <span className="text-text-secondary text-sm">
                        {Math.round(item.totalPrice / 10).toLocaleString('fa-IR')} ت
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {order.downloads?.length > 0 && (
                <div>
                  <p className="text-text-muted text-xs mb-2">لینک‌های دانلود</p>
                  <div className="flex flex-col gap-2">
                    {order.downloads.map((dl, i) => (
                      <a key={i} href={`${BASE_URL}/orders/download/${dl.token}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-accent-yellow/5 border border-accent-yellow/20 rounded-lg px-3 py-2.5 text-accent-yellow text-sm hover:bg-accent-yellow/10 transition-colors">
                        <span>⬇</span>
                        <span className="flex-1">{dl.productName}</span>
                        <span className="text-xs opacity-60">{dl.downloadCount}/{dl.maxDownloads}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center pt-3 border-t border-border-default">
                <span className="text-text-muted text-sm">مبلغ نهایی</span>
                <span className="font-bold text-accent-yellow">
                  {Math.round((order.finalAmount || 0) / 10).toLocaleString('fa-IR')} تومان
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OrdersTab() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter]   = useState('all');

  useEffect(() => {
    dashboardApi.getOrders({ limit: 50 })
      .then(res => setOrders(res.data || []))
      .catch(e  => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? orders : orders.filter(o =>
    filter === 'paid' ? o.paymentStatus === 'PAID' : o.paymentStatus === 'UNPAID'
  );

  if (loading) return <div className="flex items-center justify-center gap-3 h-32 text-text-muted text-sm"><Spinner /> بارگذاری…</div>;
  if (err)     return <Alert>{err}</Alert>;
  if (!orders.length) return <EmptyState emoji="🛒" title="هنوز سفارشی ندارید" subtitle="محصولات دیجیتال ما را در فروشگاه ببینید" btnLabel="رفتن به فروشگاه" btnTo="/shop" />;

  return (
    <>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {[['all','همه'], ['paid','پرداخت شده'], ['unpaid','پرداخت نشده']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer bg-transparent ${filter === v ? 'border-accent-yellow/30 text-accent-yellow bg-accent-yellow/8' : 'border-border-default text-text-muted hover:text-text-primary'}`}>
            {l}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {filtered.map(order => (
          <div key={order.id} className="border border-border-default rounded-xl p-4 hover:border-accent-yellow/15 transition-colors">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <p className="font-bold text-text-primary text-sm">{order.orderNumber}</p>
                <p className="text-text-muted text-xs mt-0.5">{new Date(order.createdAt).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <StatusBadge status={order.paymentStatus} />
            </div>
            {order.items?.length > 0 && (
              <div className="mt-3 flex flex-col gap-1">
                {order.items.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-xs text-text-secondary">
                    <span className="flex items-center gap-1.5">
                      <span>{item.product?.icon || '📦'}</span>
                      <span>{item.product?.name || '—'}</span>
                    </span>
                    <span className="text-text-muted">× {item.quantity}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-border-default flex items-center justify-between">
              <span className="text-xs text-text-muted">مجموع سفارش</span>
              <div className="flex items-center gap-3">
                <span className="font-bold text-accent-yellow text-sm">
                  {Math.round((order.finalAmount || 0) / 10).toLocaleString('fa-IR')} تومان
                </span>
                <button onClick={() => setSelectedId(order.id)}
                  className="text-xs text-text-secondary border border-border-default hover:border-accent-yellow/30 hover:text-accent-yellow px-3 py-1.5 rounded-lg cursor-pointer transition-colors bg-transparent">
                  جزئیات
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {selectedId && <OrderDetailModal orderId={selectedId} onClose={() => setSelectedId(null)} />}
    </>
  );
}

// ── Downloads Tab ─────────────────────────────────────────────────────────────

function DownloadsTab() {
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [err, setErr]             = useState('');

  useEffect(() => {
    dashboardApi.getDownloads()
      .then(res => setDownloads(res.data || []))
      .catch(e  => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center gap-3 h-32 text-text-muted text-sm"><Spinner /> بارگذاری…</div>;
  if (err)     return <Alert>{err}</Alert>;
  if (!downloads.length) return (
    <EmptyState emoji="📥" title="دانلودی موجود نیست"
      subtitle="پس از پرداخت، لینک دانلود محصولات دیجیتال اینجا نمایش داده می‌شود."
      btnLabel="رفتن به فروشگاه" btnTo="/shop" />
  );

  return (
    <div className="flex flex-col gap-4">
      {downloads.map((dl, i) => {
        const isExpired = new Date(dl.expiresAt) < new Date();
        const remaining = dl.maxDownloads - dl.downloadCount;
        return (
          <div key={i} className={`border rounded-xl p-4 ${isExpired ? 'border-border-default opacity-60' : 'border-border-default hover:border-accent-yellow/20'} transition-colors`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-text-muted">سفارش {dl.order?.orderNumber}</p>
              <span className="text-xs text-text-muted">{new Date(dl.order?.paidAt || dl.createdAt).toLocaleDateString('fa-IR')}</span>
            </div>
            <a href={isExpired || remaining <= 0 ? '#' : `${BASE_URL}/orders/download/${dl.token}`}
              onClick={e => (isExpired || remaining <= 0) && e.preventDefault()}
              target="_blank" rel="noopener noreferrer"
              className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors group ${isExpired || remaining <= 0 ? 'bg-white/3 cursor-not-allowed' : 'bg-accent-yellow/5 border border-accent-yellow/20 hover:bg-accent-yellow/10 cursor-pointer'}`}>
              <span className="text-xl">⬇️</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isExpired ? 'text-text-muted' : 'text-text-primary group-hover:text-accent-yellow transition-colors'}`}>
                  {dl.productName}
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  انقضا: {new Date(dl.expiresAt).toLocaleDateString('fa-IR')} · {remaining > 0 ? `${remaining} دانلود باقی‌مانده` : 'محدودیت استفاده شد'}
                </p>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${isExpired || remaining <= 0 ? 'text-text-muted border-border-default' : 'text-accent-yellow bg-accent-yellow/15 border-accent-yellow/25'}`}>
                {isExpired ? 'منقضی' : remaining <= 0 ? 'تمام شد' : 'دانلود'}
              </span>
            </a>
          </div>
        );
      })}
    </div>
  );
}

// ── Projects Tab ──────────────────────────────────────────────────────────────

function ProjectDetailModal({ project, onClose }) {
  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-bg-surface border border-border-default rounded-2xl shadow-[0_16px_64px_rgba(0,0,0,0.5)] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-default sticky top-0 bg-bg-surface z-10">
          <h3 className="font-bold text-text-primary">جزئیات پروژه</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary bg-transparent border-none cursor-pointer text-xl">×</button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="font-bold text-text-primary">{project.projectType || 'پروژه'}</p>
              <p className="text-text-muted text-xs mt-0.5">{new Date(project.createdAt).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <StatusBadge status={project.status} map={PROJECT_STATUS_MAP} />
          </div>

          {project.service && (
            <div className="flex items-center gap-2 bg-bg-base rounded-lg px-3 py-2.5">
              <span>{project.service.icon || '🛠️'}</span>
              <span className="text-sm text-text-primary">{project.service.title}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            {project.budget && (
              <div className="bg-bg-base rounded-lg px-3 py-2">
                <p className="text-text-muted text-xs mb-0.5">بودجه</p>
                <p className="text-text-primary">{project.budget}</p>
              </div>
            )}
            {project.timeline && (
              <div className="bg-bg-base rounded-lg px-3 py-2">
                <p className="text-text-muted text-xs mb-0.5">بازه زمانی</p>
                <p className="text-text-primary">{project.timeline}</p>
              </div>
            )}
          </div>

          {project.subcategories?.length > 0 && (
            <div>
              <p className="text-text-muted text-xs mb-2">زیرخدمات</p>
              <div className="flex flex-wrap gap-2">
                {project.subcategories.map((s, i) => (
                  <span key={i} className="text-xs px-3 py-1 rounded-full border border-border-default text-text-secondary bg-bg-base">{s}</span>
                ))}
              </div>
            </div>
          )}

          {project.description && (
            <div>
              <p className="text-text-muted text-xs mb-1.5">توضیحات</p>
              <p className="text-sm text-text-secondary leading-relaxed bg-bg-base rounded-lg p-3">{project.description}</p>
            </div>
          )}

          {project.files?.length > 0 && (
            <div>
              <p className="text-text-muted text-xs mb-2">فایل‌های پیوست</p>
              <div className="flex flex-col gap-2">
                {project.files.map((f, i) => (
                  <a key={i} href={f.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-bg-base rounded-lg px-3 py-2 text-text-secondary hover:text-accent-yellow transition-colors text-sm">
                    <span>📄</span>
                    <span className="flex-1 truncate">{f.originalName || f.filename}</span>
                    <span className="text-xs text-text-muted">{f.size ? `${(f.size / 1024).toFixed(0)} KB` : ''}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Status timeline hint */}
          <div className="bg-bg-base rounded-xl p-4 border border-border-default">
            <p className="text-text-muted text-xs mb-3">وضعیت پیگیری</p>
            <div className="flex items-center gap-2 flex-wrap">
              {['NEW', 'CONTACTED', 'IN_PROGRESS', 'CONVERTED'].map((s, i) => {
                const steps = ['NEW', 'CONTACTED', 'IN_PROGRESS', 'CONVERTED'];
                const currentIdx = steps.indexOf(project.status);
                const thisIdx    = steps.indexOf(s);
                const done       = thisIdx <= currentIdx;
                const pm         = PROJECT_STATUS_MAP[s];
                return (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all ${done ? pm.cls : 'text-text-muted border-border-default bg-bg-surface'}`}>
                      <span>{pm.icon}</span>
                      <span>{pm.label}</span>
                    </div>
                    {i < 3 && <span className="text-text-muted/40 text-xs">←</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectsTab({ onNewProject }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [err, setErr]           = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    dashboardApi.getProjects({ limit: 50 })
      .then(res => setProjects(res.data || []))
      .catch(e  => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center gap-3 h-32 text-text-muted text-sm"><Spinner /> بارگذاری…</div>;
  if (err)     return <Alert>{err}</Alert>;

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        {!projects.length ? null : (
          <p className="text-text-muted text-sm">{projects.length} پروژه ثبت شده</p>
        )}
        <Button variant="primary" onClick={onNewProject} className="mr-auto text-sm py-2.5 px-4">
          ➕ ثبت پروژه جدید
        </Button>
      </div>

      {!projects.length ? (
        <EmptyState emoji="🚀" title="هنوز پروژه‌ای ثبت نکرده‌اید"
          subtitle="با ثبت پروژه، تیم ما ظرف ۲۴ ساعت با شما تماس می‌گیرد"
          btnLabel={null} />
      ) : (
        <div className="flex flex-col gap-4">
          {projects.map(p => {
            const pm = PROJECT_STATUS_MAP[p.status] || PROJECT_STATUS_MAP.NEW;
            return (
              <div key={p.id} className="border border-border-default rounded-xl p-4 hover:border-accent-yellow/15 transition-colors">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-bg-base border border-border-default flex items-center justify-center text-lg flex-shrink-0">
                      {p.service?.icon || '🚀'}
                    </div>
                    <div>
                      <p className="font-bold text-text-primary text-sm">{p.projectType || p.service?.title || 'پروژه سفارشی'}</p>
                      <p className="text-text-muted text-xs mt-0.5">{new Date(p.createdAt).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                  </div>
                  <StatusBadge status={p.status} map={PROJECT_STATUS_MAP} />
                </div>

                {(p.budget || p.timeline) && (
                  <div className="mt-3 flex items-center gap-4 text-xs text-text-muted">
                    {p.budget   && <span>💰 {p.budget}</span>}
                    {p.timeline && <span>⏱ {p.timeline}</span>}
                  </div>
                )}

                {p.subcategories?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {p.subcategories.slice(0, 3).map((s, i) => (
                      <span key={i} className="text-[0.7rem] px-2.5 py-0.5 rounded-full bg-bg-base border border-border-default text-text-muted">{s}</span>
                    ))}
                    {p.subcategories.length > 3 && <span className="text-[0.7rem] px-2.5 py-0.5 rounded-full bg-bg-base border border-border-default text-text-muted">+{p.subcategories.length - 3}</span>}
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-border-default flex items-center justify-between">
                  <div className={`flex items-center gap-1.5 text-xs ${pm.cls} px-2 py-0.5 rounded-full border`}>
                    <span>{pm.icon}</span>
                    <span>{pm.label}</span>
                  </div>
                  <button onClick={() => setSelected(p)}
                    className="text-xs text-text-secondary border border-border-default hover:border-accent-yellow/30 hover:text-accent-yellow px-3 py-1.5 rounded-lg cursor-pointer transition-colors bg-transparent">
                    جزئیات
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {selected && <ProjectDetailModal project={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

// ── New Project Tab ───────────────────────────────────────────────────────────

function NewProjectTab({ onSuccess }) {
  const [step, setStep]             = useState(0); // 0=category, 1=details, 2=confirm
  const [category, setCategory]     = useState('');
  const [subtypes, setSubtypes]     = useState([]);
  const [budget, setBudget]         = useState('');
  const [timeline, setTimeline]     = useState('');
  const [desc, setDesc]             = useState('');
  const [files, setFiles]           = useState([]);
  const [uploading, setUploading]   = useState(false);
  const [loading, setLoading]       = useState(false);
  const [err, setErr]               = useState('');
  const [success, setSuccess]       = useState(false);
  const fileRef = useRef(null);

  const selectedCat = ORDER_CATEGORIES.find(c => c.id === category);

  const toggleSubtype = (id) => setSubtypes(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  const handleFileAdd = (incoming) => {
    const arr = Array.from(incoming).filter(f => f.size < 10 * 1024 * 1024);
    setFiles(prev => [...prev, ...arr].slice(0, 5));
  };

  const handleSubmit = async () => {
    if (!category) { setErr('لطفاً نوع پروژه را انتخاب کنید'); return; }
    setErr(''); setLoading(true);
    try {
      let attachments = [];
      if (files.length > 0) {
        setUploading(true);
        const res = await uploadApi.projectFiles(files);
        attachments = res.files || res.data || [];
        setUploading(false);
      }

      await dashboardApi.createProject({
        projectType: selectedCat?.label || category,
        subcategories: subtypes.map(id => selectedCat?.subtypes?.find(s => s.id === id)?.label || id),
        budget: BUDGET_OPTIONS.find(b => b.id === budget)?.label || budget,
        timeline: TIMELINE_OPTIONS.find(t => t.id === timeline)?.label || timeline,
        description: desc,
        attachments,
      });
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onSuccess(); }, 2500);
    } catch (e) {
      setErr(e.message || 'خطا در ثبت پروژه');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-16 h-16 rounded-full bg-emerald-400/15 border-2 border-emerald-400/30 flex items-center justify-center text-3xl">✅</div>
        <p className="font-bold text-text-primary text-lg">پروژه با موفقیت ثبت شد!</p>
        <p className="text-text-muted text-sm text-center max-w-xs">تیم ما ظرف ۲۴ ساعت با شما تماس خواهد گرفت.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {['نوع پروژه', 'جزئیات', 'تأیید نهایی'].map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[0.72rem] font-black transition-all ${i < step ? 'bg-accent-yellow text-[#111]' : i === step ? 'border-2 border-accent-yellow text-accent-yellow' : 'bg-white/5 border border-border-default text-text-muted'}`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`text-xs hidden sm:block ${i === step ? 'text-text-primary font-medium' : 'text-text-muted'}`}>{label}</span>
            {i < 2 && <div className={`h-[2px] w-6 sm:w-12 rounded ${i < step ? 'bg-accent-yellow' : 'bg-white/10'}`} />}
          </div>
        ))}
      </div>

      {/* Step 0: Category */}
      {step === 0 && (
        <div>
          <p className="text-sm text-text-muted mb-4">نوع خدمت مورد نیاز خود را انتخاب کنید</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ORDER_CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => { setCategory(cat.id); setSubtypes([]); }}
                className={`text-right p-4 rounded-xl border transition-all cursor-pointer ${category === cat.id ? 'border-accent-yellow bg-accent-yellow/8 shadow-[0_0_20px_rgba(245,197,24,0.1)]' : 'border-border-default bg-bg-base hover:border-border-accent'}`}>
                <div className="text-2xl mb-1.5">{cat.icon}</div>
                <div className={`text-[0.85rem] font-bold ${category === cat.id ? 'text-accent-yellow' : 'text-text-primary'}`}>{cat.label}</div>
                <div className="text-[0.72rem] text-text-muted mt-0.5 line-clamp-2">{cat.description}</div>
              </button>
            ))}
          </div>

          {selectedCat?.subtypes?.length > 0 && (
            <div className="mt-5">
              <p className="text-sm text-text-secondary mb-3">زیرخدمات (اختیاری)</p>
              <div className="flex flex-wrap gap-2">
                {selectedCat.subtypes.map(s => (
                  <button key={s.id} onClick={() => toggleSubtype(s.id)}
                    className={`px-3 py-1.5 rounded-full border text-[0.8rem] font-medium cursor-pointer transition-all ${subtypes.includes(s.id) ? 'bg-accent-yellow text-[#111] border-transparent' : 'bg-white/5 border-border-default text-text-secondary hover:border-border-accent'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end mt-6">
            <Button variant="primary" onClick={() => category && setStep(1)} disabled={!category}>
              مرحله بعد ←
            </Button>
          </div>
        </div>
      )}

      {/* Step 1: Details */}
      {step === 1 && (
        <div className="flex flex-col gap-5">
          {/* Budget */}
          <div>
            <p className="text-sm text-text-secondary mb-3">بودجه تقریبی</p>
            <div className="flex flex-wrap gap-2">
              {BUDGET_OPTIONS.map(b => (
                <button key={b.id} onClick={() => setBudget(b.id)}
                  className={`px-3 py-2 rounded-lg border text-[0.8rem] cursor-pointer transition-all ${budget === b.id ? 'border-accent-yellow bg-accent-yellow/10 text-accent-yellow' : 'border-border-default text-text-secondary hover:border-border-accent bg-bg-base'}`}>
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div>
            <p className="text-sm text-text-secondary mb-3">بازه زمانی</p>
            <div className="flex flex-wrap gap-2">
              {TIMELINE_OPTIONS.map(t => (
                <button key={t.id} onClick={() => setTimeline(t.id)}
                  className={`px-3 py-2 rounded-lg border text-[0.8rem] cursor-pointer transition-all ${timeline === t.id ? 'border-accent-yellow bg-accent-yellow/10 text-accent-yellow' : 'border-border-default text-text-secondary hover:border-border-accent bg-bg-base'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[0.82rem] font-medium text-text-secondary block mb-2">توضیحات پروژه <span className="text-text-muted font-normal">(اختیاری)</span></label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={4} maxLength={2000}
              placeholder="جزئیات پروژه، نمونه‌کارهای مورد نظر، نکات خاص..."
              className="w-full px-4 py-3 rounded-xl bg-bg-base border border-border-default text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-yellow/50 transition-colors resize-none" />
            <p className="text-[0.72rem] text-text-muted mt-1 text-left">{desc.length}/2000</p>
          </div>

          {/* File upload */}
          <div>
            <p className="text-[0.82rem] font-medium text-text-secondary mb-2">فایل‌های مرجع <span className="text-text-muted font-normal">(اختیاری · حداکثر ۵ فایل)</span></p>
            <div onClick={() => fileRef.current?.click()} onDrop={e => { e.preventDefault(); handleFileAdd(e.dataTransfer.files); }} onDragOver={e => e.preventDefault()}
              className="border-2 border-dashed border-border-default rounded-xl p-6 text-center cursor-pointer hover:border-border-accent hover:bg-white/[0.02] transition-all">
              <div className="text-3xl mb-2">📎</div>
              <p className="text-[0.85rem] text-text-secondary">فایل‌ها را اینجا رها کنید یا کلیک کنید</p>
              <p className="text-[0.72rem] text-text-muted mt-1">PNG, JPG, PDF, ZIP, Figma · هر فایل تا ۱۰MB</p>
            </div>
            <input ref={fileRef} type="file" multiple accept="image/*,.pdf,.zip,.fig,.xd,.psd,.sketch" className="hidden" onChange={e => handleFileAdd(e.target.files)} />
            {files.length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between bg-bg-base rounded-lg px-3 py-2.5">
                    <span className="flex items-center gap-2 text-sm text-text-secondary"><span>📄</span><span className="truncate max-w-[200px]">{f.name}</span></span>
                    <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="text-text-muted hover:text-red-400 bg-transparent border-none cursor-pointer">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <button onClick={() => setStep(0)} className="text-sm text-text-muted hover:text-text-primary bg-transparent border-none cursor-pointer">← برگشت</button>
            <Button variant="primary" onClick={() => setStep(2)}>مرحله بعد ←</Button>
          </div>
        </div>
      )}

      {/* Step 2: Confirm */}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-muted">خلاصه درخواست شما — پیش از ثبت بررسی کنید</p>

          <div className="bg-bg-base rounded-xl border border-border-default divide-y divide-border-default overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-text-muted text-sm">نوع پروژه</span>
              <span className="text-text-primary text-sm font-medium">{selectedCat?.label}</span>
            </div>
            {subtypes.length > 0 && (
              <div className="flex items-start justify-between px-4 py-3 gap-4">
                <span className="text-text-muted text-sm">زیرخدمات</span>
                <span className="text-text-primary text-sm text-left">{subtypes.map(id => selectedCat?.subtypes?.find(s => s.id === id)?.label).join('، ')}</span>
              </div>
            )}
            {budget && (
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-text-muted text-sm">بودجه</span>
                <span className="text-text-primary text-sm">{BUDGET_OPTIONS.find(b => b.id === budget)?.label}</span>
              </div>
            )}
            {timeline && (
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-text-muted text-sm">بازه زمانی</span>
                <span className="text-text-primary text-sm">{TIMELINE_OPTIONS.find(t => t.id === timeline)?.label}</span>
              </div>
            )}
            {desc && (
              <div className="px-4 py-3">
                <p className="text-text-muted text-sm mb-1.5">توضیحات</p>
                <p className="text-text-secondary text-sm leading-relaxed">{desc}</p>
              </div>
            )}
            {files.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-text-muted text-sm">فایل پیوست</span>
                <span className="text-text-primary text-sm">{files.length} فایل</span>
              </div>
            )}
          </div>

          <div className="bg-accent-yellow/5 border border-accent-yellow/15 rounded-xl px-4 py-3">
            <p className="text-[0.82rem] text-text-secondary leading-relaxed">
              ✅ با ثبت این درخواست، تیم ما ظرف <strong className="text-text-primary">۲۴ ساعت</strong> با شما تماس می‌گیرد و جزئیات را بررسی می‌کنیم.
            </p>
          </div>

          {err && <Alert>{err}</Alert>}

          <div className="flex items-center justify-between gap-3">
            <button onClick={() => setStep(1)} className="text-sm text-text-muted hover:text-text-primary bg-transparent border-none cursor-pointer">← برگشت</button>
            <Button variant="primary" onClick={handleSubmit} disabled={loading || uploading}>
              {loading || uploading
                ? <span className="flex items-center gap-2"><Spinner size={4} /> {uploading ? 'آپلود فایل‌ها…' : 'در حال ثبت…'}</span>
                : '🚀 ثبت پروژه'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Profile Tab ───────────────────────────────────────────────────────────────

function ProfileTab() {
  const { user, refreshProfile } = useAuth();
  const [name,    setName]    = useState(user?.name  || '');
  const [phone,   setPhone]   = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]         = useState('');
  const [err, setErr]         = useState('');

  const handleSave = async () => {
    if (!name.trim()) { setErr('نام نمی‌تواند خالی باشد'); return; }
    setErr(''); setMsg('');
    setLoading(true);
    try {
      await dashboardApi.updateProfile({ name: name.trim(), phone: phone || null });
      await refreshProfile();
      setMsg('پروفایل با موفقیت بروز شد ✓');
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col gap-8 max-w-md">
      {/* Avatar block */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-accent-yellow/15 border-2 border-accent-yellow/30 flex items-center justify-center text-3xl font-black text-accent-yellow select-none">
          {user?.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div>
          <p className="font-bold text-text-primary">{user?.name}</p>
          <p className="text-text-muted text-sm">{user?.email}</p>
          <span className={`text-[0.7rem] mt-1 inline-block px-2.5 py-0.5 rounded-full border ${user?.role === 'ADMIN' || user?.role === 'MANAGER' ? 'text-accent-yellow bg-accent-yellow/10 border-accent-yellow/25' : 'text-text-muted bg-white/5 border-border-default'}`}>
            {user?.role === 'ADMIN' ? 'مدیر ارشد' : user?.role === 'MANAGER' ? 'مدیر' : 'کاربر'}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-4 pt-4 border-t border-border-default">
        <h3 className="text-sm font-bold text-text-primary">ویرایش اطلاعات</h3>

        <div className="flex flex-col gap-1.5">
          <label className="text-[0.82rem] font-medium text-text-secondary">نام و نام‌خانوادگی</label>
          <input value={name} onChange={e => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-bg-base border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-yellow/50 transition-colors" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[0.82rem] font-medium text-text-secondary">ایمیل <span className="text-text-muted font-normal">(برای تغییر به بخش امنیت بروید)</span></label>
          <input value={user?.email || ''} disabled
            className="w-full px-4 py-3 rounded-xl bg-bg-base border border-border-default text-text-muted text-sm cursor-not-allowed opacity-60" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[0.82rem] font-medium text-text-secondary">شماره موبایل <span className="text-text-muted font-normal">(اختیاری)</span></label>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="09xxxxxxxxx" dir="ltr"
            className="w-full px-4 py-3 rounded-xl bg-bg-base border border-border-default text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-yellow/50 transition-colors text-right" />
        </div>

        {err && <Alert>{err}</Alert>}
        {msg && <Alert type="success">{msg}</Alert>}

        <Button variant="primary" onClick={handleSave} disabled={loading} className="w-fit">
          {loading ? <span className="flex items-center gap-2"><Spinner size={4} /> ذخیره…</span> : '💾 ذخیره تغییرات'}
        </Button>
      </div>
    </div>
  );
}

// ── Security Tab ──────────────────────────────────────────────────────────────

function SecurityTab() {
  // Password change
  const [cur, setCur]         = useState('');
  const [next, setNext]       = useState('');
  const [conf, setConf]       = useState('');
  const [pwLoading, setPwLoad] = useState(false);
  const [pwMsg, setPwMsg]     = useState('');
  const [pwErr, setPwErr]     = useState('');

  // Email change
  const [newEmail, setNewEmail] = useState('');
  const [emailPw, setEmailPw]   = useState('');
  const [emLoading, setEmLoad]  = useState(false);
  const [emMsg, setEmMsg]       = useState('');
  const [emErr, setEmErr]       = useState('');

  const handlePw = async () => {
    if (!cur || !next || !conf)   { setPwErr('همه فیلدها الزامی هستند'); return; }
    if (next.length < 8)          { setPwErr('رمز جدید باید حداقل ۸ کاراکتر باشد'); return; }
    if (next !== conf)            { setPwErr('رمز جدید و تکرار آن یکسان نیستند'); return; }
    setPwErr(''); setPwMsg(''); setPwLoad(true);
    try {
      await dashboardApi.changePassword({ currentPassword: cur, newPassword: next });
      setPwMsg('رمز عبور با موفقیت تغییر کرد. لطفاً دوباره وارد شوید ✓');
      setCur(''); setNext(''); setConf('');
    } catch (e) { setPwErr(e.message); }
    finally { setPwLoad(false); }
  };

  const handleEmail = async () => {
    if (!newEmail || !emailPw) { setEmErr('همه فیلدها الزامی هستند'); return; }
    if (!newEmail.includes('@')) { setEmErr('آدرس ایمیل معتبر وارد کنید'); return; }
    setEmErr(''); setEmMsg(''); setEmLoad(true);
    try {
      await dashboardApi.changeEmail({ newEmail, password: emailPw });
      setEmMsg('ایمیل با موفقیت تغییر کرد ✓');
      setNewEmail(''); setEmailPw('');
    } catch (e) { setEmErr(e.message); }
    finally { setEmLoad(false); }
  };

  const PwField = ({ label, value, onChange, placeholder }) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-[0.82rem] font-medium text-text-secondary">{label}</label>
      <input type="password" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} dir="ltr"
        className="w-full px-4 py-3 rounded-xl bg-bg-base border border-border-default text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-yellow/50 transition-colors" />
    </div>
  );

  return (
    <div className="flex flex-col gap-8 max-w-md">
      {/* Change password */}
      <div>
        <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">🔒 تغییر رمز عبور</h3>
        <div className="flex flex-col gap-4">
          <PwField label="رمز عبور فعلی"  value={cur}  onChange={setCur}  placeholder="••••••••" />
          <PwField label="رمز عبور جدید"  value={next} onChange={setNext} placeholder="حداقل ۸ کاراکتر" />
          <PwField label="تکرار رمز جدید" value={conf} onChange={setConf} placeholder="رمز جدید را تکرار کنید" />
          {pwErr && <Alert>{pwErr}</Alert>}
          {pwMsg && <Alert type="success">{pwMsg}</Alert>}
          <Button variant="primary" onClick={handlePw} disabled={pwLoading} className="w-fit">
            {pwLoading ? <span className="flex items-center gap-2"><Spinner size={4} /> تغییر…</span> : 'تغییر رمز عبور'}
          </Button>
        </div>
      </div>

      {/* Change email */}
      <div className="pt-6 border-t border-border-default">
        <h3 className="text-sm font-bold text-text-primary mb-1 flex items-center gap-2">✉️ تغییر ایمیل</h3>
        <p className="text-text-muted text-xs mb-4">برای تأیید هویت، رمز عبور فعلی نیاز است.</p>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.82rem] font-medium text-text-secondary">ایمیل جدید</label>
            <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="new@example.com" dir="ltr"
              className="w-full px-4 py-3 rounded-xl bg-bg-base border border-border-default text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-yellow/50 transition-colors" />
          </div>
          <PwField label="رمز عبور فعلی (برای تأیید)" value={emailPw} onChange={setEmailPw} placeholder="••••••••" />
          {emErr && <Alert>{emErr}</Alert>}
          {emMsg && <Alert type="success">{emMsg}</Alert>}
          <Button variant="primary" onClick={handleEmail} disabled={emLoading} className="w-fit">
            {emLoading ? <span className="flex items-center gap-2"><Spinner size={4} /> در حال تغییر…</span> : 'تغییر ایمیل'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'summary',     icon: '🏠', label: 'خلاصه' },
  { id: 'orders',      icon: '🛒', label: 'سفارشات فروشگاه' },
  { id: 'projects',    icon: '🚀', label: 'پروژه‌های من' },
  { id: 'new-project', icon: '➕', label: 'ثبت پروژه جدید' },
  { id: 'downloads',   icon: '📥', label: 'دانلودها' },
  { id: 'profile',     icon: '👤', label: 'اطلاعات پروفایل' },
  { id: 'security',    icon: '🔒', label: 'امنیت حساب' },
];

function LoginPrompt() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-bold text-text-primary mb-2">دسترسی محدود</h2>
        <p className="text-text-muted text-sm mb-6">برای مشاهده پنل کاربری ابتدا وارد حساب خود شوید.</p>
        <Button variant="primary" onClick={() => goTo('/')} className="justify-center">رفتن به صفحه اصلی</Button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading, isLoggedIn, logout } = useAuth();
  const [tab, setTab] = useState('summary');

  const handleLogout = async () => { await logout(); goTo('/'); };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center gap-3 text-text-muted">
      <Spinner size={6} /><span className="text-sm">در حال بارگذاری…</span>
    </div>
  );

  if (!isLoggedIn) return <LoginPrompt />;

  const currentTab = TABS.find(t => t.id === tab);

  return (
    <div className="min-h-screen pt-28 pb-20 px-4">
      <div className="max-w-[1100px] mx-auto">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <SectionLabel>پنل کاربری</SectionLabel>
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary mt-1">
              سلام، {user.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-text-muted text-sm mt-0.5">{user.email}</p>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="text-sm self-start py-2.5 px-4">خروج از حساب</Button>
        </div>

        <div className="flex flex-col md:flex-row gap-6">

          {/* Sidebar */}
          <aside className="md:w-60 flex-shrink-0">
            <Card className="p-3 flex flex-col gap-1">
              {/* Avatar */}
              <div className="flex flex-col items-center py-4 mb-1 border-b border-border-default">
                <div className="w-14 h-14 rounded-full bg-accent-yellow/15 border-2 border-accent-yellow/30 flex items-center justify-center text-2xl font-black text-accent-yellow mb-2 select-none">
                  {user.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <p className="font-bold text-text-primary text-sm text-center truncate max-w-[180px]">{user.name}</p>
                <span className={`text-[0.68rem] mt-1.5 px-2.5 py-0.5 rounded-full border ${user.role === 'ADMIN' || user?.role === 'MANAGER' ? 'text-accent-yellow bg-accent-yellow/10 border-accent-yellow/25' : 'text-text-muted bg-white/5 border-border-default'}`}>
                  {user.role === 'ADMIN' ? 'مدیر ارشد' : user.role === 'MANAGER' ? 'مدیر' : 'کاربر عادی'}
                </span>
              </div>

              <p className="text-[0.68rem] font-bold text-text-muted px-4 pt-2 pb-1 uppercase tracking-widest">فروشگاه</p>
              {TABS.filter(t => ['orders', 'downloads'].includes(t.id)).map(t => (
                <SideTab key={t.id} active={tab === t.id} onClick={() => setTab(t.id)} icon={t.icon} label={t.label} />
              ))}

              <p className="text-[0.68rem] font-bold text-text-muted px-4 pt-3 pb-1 uppercase tracking-widest">پروژه‌ها</p>
              {TABS.filter(t => ['projects', 'new-project'].includes(t.id)).map(t => (
                <SideTab key={t.id} active={tab === t.id} onClick={() => setTab(t.id)} icon={t.icon} label={t.label} />
              ))}

              <p className="text-[0.68rem] font-bold text-text-muted px-4 pt-3 pb-1 uppercase tracking-widest">حساب کاربری</p>
              {TABS.filter(t => ['summary', 'profile', 'security'].includes(t.id)).map(t => (
                <SideTab key={t.id} active={tab === t.id} onClick={() => setTab(t.id)} icon={t.icon} label={t.label} />
              ))}

              {/* Admin link */}
              {(user.role === 'ADMIN' || user.role === 'MANAGER') && (
                <div className="mt-2 pt-2 border-t border-border-default">
                  <button onClick={() => goTo('/admin')}
                    className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium w-full text-right bg-transparent border border-transparent cursor-pointer transition-all duration-200 text-accent-yellow hover:bg-accent-yellow/5">
                    <span>⚙️</span><span>پنل مدیریت</span>
                  </button>
                </div>
              )}
            </Card>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            <Card>
              <h2 className="font-bold text-text-primary mb-6 pb-4 border-b border-border-default flex items-center gap-2 text-base">
                <span>{currentTab?.icon}</span>
                <span>{currentTab?.label}</span>
              </h2>

              {tab === 'summary'     && <SummaryTab user={user} onTabChange={setTab} />}
              {tab === 'orders'      && <OrdersTab />}
              {tab === 'projects'    && <ProjectsTab onNewProject={() => setTab('new-project')} />}
              {tab === 'new-project' && <NewProjectTab onSuccess={() => setTab('projects')} />}
              {tab === 'downloads'   && <DownloadsTab />}
              {tab === 'profile'     && <ProfileTab />}
              {tab === 'security'    && <SecurityTab />}
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}