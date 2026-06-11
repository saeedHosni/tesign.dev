// src/components/layout/Navbar.jsx
import { useState, useEffect, useRef } from 'react';
import Logo from '../ui/Logo';
import Button from '../ui/Button';
import ArrowIcon from '../ui/ArrowIcon';
import AuthModal from '../auth/AuthModal';
import { NAV_LINKS } from '../../data/siteData';
import { useAuth } from '../../context/AuthContext';

function isActive(href) {
  if (typeof window === 'undefined') return false;
  if (href === '/') return window.location.pathname === '/';
  return window.location.pathname.startsWith(href);
}

// ── User Dropdown ─────────────────────────────────────────────────────────────

function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNav = (path) => {
    setOpen(false);
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(p => !p)}
        className="
          flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5
          border border-border-default hover:border-accent-yellow/30
          hover:bg-white/8 transition-all duration-200 cursor-pointer
          bg-transparent text-text-primary
        "
      >
        <div className="w-7 h-7 rounded-full bg-accent-yellow/15 border border-accent-yellow/30 flex items-center justify-center text-sm font-bold text-accent-yellow">
          {user.name?.charAt(0) || '؟'}
        </div>
        <span className="text-sm font-medium hidden sm:block max-w-[90px] truncate">{user.name}</span>
        <svg className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 16 16" fill="none">
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="
          absolute left-0 top-[calc(100%+8px)] w-48
          bg-bg-surface border border-border-default rounded-xl
          shadow-[0_12px_40px_rgba(0,0,0,0.5)] overflow-hidden z-[110]
          animate-fade-in
        ">
          <div className="px-4 py-3 border-b border-border-default">
            <p className="text-sm font-bold text-text-primary truncate">{user.name}</p>
            <p className="text-xs text-text-muted truncate">{user.email}</p>
          </div>

          <button
            onClick={() => handleNav('/dashboard')}
            className="w-full text-right px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 flex items-center gap-2.5 bg-transparent border-none cursor-pointer transition-colors"
          >
            <span>📦</span> پنل کاربری
          </button>

          {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
            <button
              onClick={() => handleNav('/admin')}
              className="w-full text-right px-4 py-2.5 text-sm text-accent-yellow hover:bg-accent-yellow/5 flex items-center gap-2.5 bg-transparent border-none cursor-pointer transition-colors"
            >
              <span>⚙️</span> پنل مدیریت
            </button>
          )}

          <div className="border-t border-border-default">
            <button
              onClick={onLogout}
              className="w-full text-right px-4 py-2.5 text-sm text-red-400 hover:bg-red-400/5 flex items-center gap-2.5 bg-transparent border-none cursor-pointer transition-colors"
            >
              <span>🚪</span> خروج از حساب
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Navbar ────────────────────────────────────────────────────────────────────

export default function Navbar() {
  const { user, isLoggedIn, logout } = useAuth();
  const [scrolled,   setScrolled]   = useState(false);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [path,       setPath]       = useState('/');
  const [authModal,  setAuthModal]  = useState(null); // null | 'login' | 'register'

  useEffect(() => {
    setPath(window.location.pathname);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMobile = () => setMenuOpen(false);
  const toggleMenu  = () => setMenuOpen(p => !p);

  const handleNav = (e, href) => {
    e.preventDefault();
    closeMobile();
    window.history.pushState({}, '', href);
    window.dispatchEvent(new PopStateEvent('popstate'));
    setPath(href);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    await logout();
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
    setPath('/');
  };

  return (
    <>
      <header>
        <nav className={`fixed top-0 left-0 right-0 z-[100] h-18 flex items-center transition-all duration-300
          ${scrolled ? 'bg-bg-base/85 backdrop-blur-[20px] shadow-[0_1px_0_rgba(255,255,255,0.07)]' : 'bg-transparent'}`}>
          <div className="w-full max-w-[1200px] mx-auto px-6 flex items-center justify-between">
            <Logo href="/" />

            <ul className="hidden md:flex items-center gap-1 list-none m-0 p-0">
              {NAV_LINKS.map((link) => {
                const active = isActive(link.href);
                return (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      onClick={(e) => handleNav(e, link.href)}
                      className={`nav-link-active-wrapper relative inline-block px-4 py-2 rounded-sm text-[0.9rem] font-medium no-underline transition-all duration-300 hover:text-text-primary hover:bg-white/5
                        ${active ? 'nav-link-active text-text-primary bg-white/5' : 'text-text-secondary'}`}
                    >
                      {link.label}
                    </a>
                  </li>
                );
              })}
            </ul>

            {/* Right actions */}
            <div className="flex items-center gap-3">
              <Button href="/order" onClick={(e) => handleNav(e, '/order')} variant="primary" className="hidden sm:inline-flex">
                ثبت سفارش <ArrowIcon />
              </Button>

              {isLoggedIn ? (
                <UserMenu user={user} onLogout={handleLogout} />
              ) : (
                <button
                  onClick={() => setAuthModal('login')}
                  className="
                    px-4 py-2 rounded-lg text-sm font-medium text-text-secondary
                    border border-border-default hover:text-text-primary hover:border-accent-yellow/30
                    hover:bg-white/5 bg-transparent cursor-pointer transition-all duration-200
                  "
                >
                  ورود / ثبت‌نام
                </button>
              )}

              <button onClick={toggleMenu} aria-label="منو"
                className="md:hidden flex flex-col gap-[5px] bg-transparent border-none cursor-pointer p-1.5">
                <span className={`block w-6 h-0.5 bg-text-primary rounded-sm transition-all duration-300 ${menuOpen ? 'translate-y-[7px] rotate-45' : ''}`} />
                <span className={`block w-6 h-0.5 bg-text-primary rounded-sm transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
                <span className={`block w-6 h-0.5 bg-text-primary rounded-sm transition-all duration-300 ${menuOpen ? '-translate-y-[7px] -rotate-45' : ''}`} />
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="fixed top-[72px] left-0 right-0 bottom-0 bg-[rgba(20,20,20,0.97)] backdrop-blur-[20px] z-[99] flex flex-col items-center justify-center gap-3 px-10 animate-fade-in">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} onClick={(e) => handleNav(e, link.href)}
                className="text-[1.4rem] font-bold text-text-secondary px-6 py-2.5 rounded-md transition-all duration-300 w-full text-center no-underline block hover:text-text-primary hover:bg-white/5">
                {link.label}
              </a>
            ))}

            <Button href="/order" onClick={(e) => handleNav(e, '/order')} variant="primary" className="w-full justify-center mt-2">
              ثبت سفارش
            </Button>

            {isLoggedIn ? (
              <div className="flex flex-col gap-2 w-full">
                <button
                  onClick={(e) => handleNav(e, '/dashboard')}
                  className="w-full text-center py-3 text-text-secondary hover:text-text-primary text-lg font-bold bg-transparent border-none cursor-pointer"
                >
                  📦 پنل کاربری
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-center py-2.5 text-red-400 hover:text-red-300 text-base bg-transparent border-none cursor-pointer"
                >
                  خروج از حساب
                </button>
              </div>
            ) : (
              <button
                onClick={() => { closeMobile(); setAuthModal('login'); }}
                className="w-full text-center py-3 text-text-secondary hover:text-text-primary text-lg font-bold bg-transparent border-none cursor-pointer"
              >
                ورود / ثبت‌نام
              </button>
            )}
          </div>
        )}
      </header>

      {/* Auth Modal */}
      {authModal && (
        <AuthModal
          initialMode={authModal}
          onClose={() => setAuthModal(null)}
        />
      )}
    </>
  );
}
