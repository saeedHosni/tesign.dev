// src/components/admin/AdminLayout.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/ui/Logo';

// ── Navigation helper ──────────────────────────────────────────────────────────

export function goToAdmin(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0 });
}

// ── Sidebar nav config ───────────────────────────────────────────────────────

export const ADMIN_NAV = [
  { id: 'overview',  href: '/admin',           icon: '📊', label: 'نمای کلی' },
  { id: 'products',  href: '/admin/products',  icon: '📦', label: 'محصولات' },
  { id: 'categories',href: '/admin/categories',icon: '🗂️', label: 'دسته‌بندی‌ها' },
  { id: 'services',  href: '/admin/services',  icon: '🛠️', label: 'خدمات' },
  { id: 'orders',    href: '/admin/orders',    icon: '💳', label: 'سفارشات' },
  { id: 'order-form-config', href: '/admin/order-form-config', icon: '📝', label: 'تنظیمات فرم سفارش' },
  { id: 'projects',  href: '/admin/projects',  icon: '📋', label: 'درخواست‌های پروژه' },
  { id: 'reviews',   href: '/admin/reviews',   icon: '⭐', label: 'نظرات' },
  { id: 'coupons',   href: '/admin/coupons',   icon: '🏷️', label: 'کدهای تخفیف' },
  { id: 'users',     href: '/admin/users',     icon: '👥', label: 'کاربران', superOnly: false },
  { id: 'settings',  href: '/admin/settings',  icon: '⚙️', label: 'تنظیمات سایت' },
];

// ── Icons ─────────────────────────────────────────────────────────────────────

function MenuIcon({ open }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {open
        ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
        : <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>
      }
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5 12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z" />
    </svg>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function SidebarLink({ item, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-3 px-3.5 py-2.5 rounded-xl w-full text-right
        text-sm font-medium border transition-all duration-200 cursor-pointer
        ${active
          ? 'bg-accent-yellow/10 text-accent-yellow border-accent-yellow/25'
          : 'text-text-secondary border-transparent hover:text-text-primary hover:bg-white/5'}
      `}
    >
      <span className="text-base leading-none">{item.icon}</span>
      <span className="truncate">{item.label}</span>
    </button>
  );
}

function SidebarContent({ path, navigate, user, onLogout }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo / brand */}
      <div className="px-4 pt-5 pb-4 border-b border-border-default flex items-center justify-between">
        <Logo href="/" />
        <span className="text-[0.65rem] font-bold text-accent-yellow bg-accent-yellow/10 border border-accent-yellow/25 rounded-full px-2 py-0.5">
          پنل مدیریت
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
        {ADMIN_NAV.map(item => {
          const active = item.href === '/admin'
            ? path === '/admin'
            : path.startsWith(item.href);
          return (
            <SidebarLink
              key={item.id}
              item={item}
              active={active}
              onClick={() => navigate(item.href)}
            />
          );
        })}
      </nav>

      {/* Footer: user + back-to-site + logout */}
      <div className="border-t border-border-default p-3 flex flex-col gap-1">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl w-full text-right text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-white/5 border border-transparent transition-all duration-200 cursor-pointer"
        >
          <HomeIcon />
          بازگشت به سایت
        </button>

        <div className="flex items-center gap-3 px-3.5 py-2.5 mt-1">
          <div className="w-8 h-8 rounded-full bg-accent-yellow/15 border border-accent-yellow/30 flex items-center justify-center text-sm font-bold text-accent-yellow flex-shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || '؟'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-text-primary truncate">{user?.name}</p>
            <p className="text-[0.7rem] text-text-muted truncate">
              {user?.role === 'ADMIN' ? 'مدیر ارشد' : 'مدیر'}
            </p>
          </div>
          <button
            onClick={onLogout}
            title="خروج از حساب"
            className="text-red-400 hover:text-red-300 bg-transparent border-none cursor-pointer p-1.5 rounded-lg hover:bg-red-400/10 transition-colors flex-shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page Header ───────────────────────────────────────────────────────────────

export function AdminPageHeader({ title, description, actions }) {
  return (
    <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-text-primary">{title}</h1>
        {description && <p className="text-text-muted text-sm mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

// ── Layout shell ──────────────────────────────────────────────────────────────

export default function AdminLayout({ children }) {
  const { user, isAdmin, loading, logout } = useAuth();
  const [path, setPath] = useState(typeof window !== 'undefined' ? window.location.pathname : '/admin');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => { setSidebarOpen(false); }, [path]);

  const navigate = (href) => {
    goToAdmin(href);
    setPath(href);
  };

  const handleLogout = async () => {
    await logout();
    goToAdmin('/');
  };

  // ── Auth gating ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gap-3 text-text-muted">
        <span className="w-5 h-5 border-2 border-text-muted/30 border-t-accent-yellow rounded-full animate-spin" />
        <span className="text-sm">در حال بررسی دسترسی…</span>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">⛔️</div>
          <h2 className="text-xl font-bold text-text-primary mb-2">دسترسی غیرمجاز</h2>
          <p className="text-text-muted text-sm mb-6">
            این بخش مخصوص مدیران سایت است. حساب شما دسترسی لازم را ندارد.
          </p>
          <button
            onClick={() => goToAdmin('/')}
            className="grad-bg text-[#111] font-bold px-6 py-3 rounded-md text-sm cursor-pointer border-none"
          >
            بازگشت به صفحه اصلی
          </button>
        </div>
      </div>
    );
  }

  // ── Authorized layout ────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex bg-bg-base" dir="rtl">

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 flex-shrink-0 border-l border-border-default bg-bg-surface sticky top-0 h-screen">
        <SidebarContent path={path} navigate={navigate} user={user} onLogout={handleLogout} />
      </aside>

      {/* Mobile sidebar (drawer) */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-[200]">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute top-0 right-0 h-full w-72 max-w-[85%] bg-bg-surface border-l border-border-default animate-fade-in">
            <SidebarContent path={path} navigate={navigate} user={user} onLogout={handleLogout} />
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Topbar (mobile) */}
        <header className="lg:hidden sticky top-0 z-[100] h-16 flex items-center justify-between px-4 bg-bg-base/90 backdrop-blur-md border-b border-border-default">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-text-primary bg-transparent border-none cursor-pointer p-1.5"
            aria-label="باز کردن منو"
          >
            <MenuIcon open={false} />
          </button>
          <Logo href="/" />
          <span className="text-[0.65rem] font-bold text-accent-yellow bg-accent-yellow/10 border border-accent-yellow/25 rounded-full px-2 py-0.5">
            ادمین
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-8 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}