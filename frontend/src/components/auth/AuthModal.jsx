// src/components/auth/AuthModal.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';

function goTo(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0 });
}

// ── Field ─────────────────────────────────────────────────────────────────────

function Field({ label, type = 'text', value, onChange, placeholder, autoComplete, autoFocus }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[0.82rem] font-medium text-text-secondary">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        className="
          w-full px-4 py-3 rounded-lg
          bg-bg-base border border-border-default
          text-text-primary text-sm placeholder:text-text-muted
          focus:outline-none focus:border-accent-yellow/60
          transition-colors duration-200
        "
      />
    </div>
  );
}

// ── Error / Success messages ──────────────────────────────────────────────────

function Alert({ type, msg }) {
  if (!msg) return null;
  const styles = type === 'error'
    ? 'text-red-400 bg-red-400/10 border-red-400/20'
    : 'text-green-400 bg-green-400/10 border-green-400/20';
  return (
    <p className={`text-[0.82rem] border rounded-lg px-3 py-2 text-center ${styles}`}>
      {msg}
    </p>
  );
}

// ── Login Form ────────────────────────────────────────────────────────────────

function LoginForm({ onSuccess, onSwitch }) {
  const { login } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [err,      setErr]      = useState('');

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      setErr('لطفاً همه فیلدها را پر کنید');
      return;
    }
    setErr('');
    setLoading(true);
    try {
      const user = await login({ email: email.trim(), password });
      onSuccess(user);
    } catch (e) {
      setErr(e.message || 'ایمیل یا رمز عبور اشتباه است');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5" onKeyDown={e => e.key === 'Enter' && handleSubmit()}>
      <Field
        label="ایمیل"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="example@mail.com"
        autoComplete="email"
        autoFocus
      />
      <Field
        label="رمز عبور"
        type="password"
        value={password}
        onChange={setPassword}
        placeholder="رمز عبور خود را وارد کنید"
        autoComplete="current-password"
      />

      <Alert type="error" msg={err} />

      <Button
        variant="primary"
        onClick={handleSubmit}
        disabled={loading}
        className="w-full justify-center mt-1"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-[#111]/30 border-t-[#111] rounded-full animate-spin" />
            در حال ورود…
          </span>
        ) : 'ورود به حساب'}
      </Button>

      <p className="text-center text-text-muted text-[0.82rem]">
        حساب ندارید؟{' '}
        <button
          onClick={onSwitch}
          className="text-accent-yellow hover:underline bg-transparent border-none cursor-pointer font-medium"
        >
          ثبت‌نام کنید
        </button>
      </p>
    </div>
  );
}

// ── Register Form ─────────────────────────────────────────────────────────────

function RegisterForm({ onSuccess, onSwitch }) {
  const { register } = useAuth();
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [err,      setErr]      = useState('');

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !password || !confirm) {
      setErr('لطفاً همه فیلدها را پر کنید');
      return;
    }
    if (password.length < 6) {
      setErr('رمز عبور باید حداقل ۶ کاراکتر باشد');
      return;
    }
    if (password !== confirm) {
      setErr('رمز عبور و تکرار آن یکسان نیستند');
      return;
    }
    setErr('');
    setLoading(true);
    try {
      const user = await register({ name: name.trim(), email: email.trim(), password });
      onSuccess(user);
    } catch (e) {
      setErr(e.message || 'خطا در ثبت‌نام، دوباره تلاش کنید');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4" onKeyDown={e => e.key === 'Enter' && handleSubmit()}>
      <Field label="نام و نام‌خانوادگی" value={name}     onChange={setName}     placeholder="علی محمدی"                    autoComplete="name"         autoFocus />
      <Field label="ایمیل"              type="email"      value={email}    onChange={setEmail}    placeholder="example@mail.com"             autoComplete="email"        />
      <Field label="رمز عبور"           type="password"   value={password} onChange={setPassword} placeholder="حداقل ۶ کاراکتر"             autoComplete="new-password" />
      <Field label="تکرار رمز عبور"     type="password"   value={confirm}  onChange={setConfirm}  placeholder="رمز عبور را دوباره وارد کنید" autoComplete="new-password" />

      <Alert type="error" msg={err} />

      <Button
        variant="primary"
        onClick={handleSubmit}
        disabled={loading}
        className="w-full justify-center mt-1"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-[#111]/30 border-t-[#111] rounded-full animate-spin" />
            در حال ثبت‌نام…
          </span>
        ) : 'ایجاد حساب کاربری'}
      </Button>

      <p className="text-center text-text-muted text-[0.82rem]">
        حساب دارید؟{' '}
        <button
          onClick={onSwitch}
          className="text-accent-yellow hover:underline bg-transparent border-none cursor-pointer font-medium"
        >
          وارد شوید
        </button>
      </p>
    </div>
  );
}

// ── Success Screen ────────────────────────────────────────────────────────────

function SuccessScreen({ user, onClose }) {
  useEffect(() => {
    // بعد از ۱.۲ ثانیه بسته و به داشبورد برو
    const t = setTimeout(() => {
      onClose();
      goTo('/dashboard');
    }, 1200);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="flex flex-col items-center gap-4 py-4 text-center">
      <div className="w-16 h-16 rounded-full bg-green-400/15 border-2 border-green-400/40 flex items-center justify-center text-3xl animate-fade-in">
        ✓
      </div>
      <div>
        <h3 className="text-lg font-bold text-text-primary">خوش اومدی، {user?.name?.split(' ')[0]}!</h3>
        <p className="text-text-muted text-sm mt-1">در حال انتقال به پنل کاربری…</p>
      </div>
      <div className="w-8 h-1 bg-border-default rounded-full overflow-hidden">
        <div className="h-full bg-accent-yellow rounded-full animate-[progress_1.2s_linear_forwards]" />
      </div>
    </div>
  );
}

// ── Modal Shell ───────────────────────────────────────────────────────────────

export default function AuthModal({ initialMode = 'login', onClose }) {
  const { isLoggedIn } = useAuth();
  const [mode,    setMode]    = useState(initialMode); // 'login' | 'register'
  const [success, setSuccess] = useState(null);        // user object بعد از موفقیت

  // اگه کاربر از قبل لاگین بوده — مودال بسته بشه و مستقیم داشبورد
  useEffect(() => {
    if (isLoggedIn && !success) {
      onClose();
      goTo('/dashboard');
    }
  }, [isLoggedIn, success, onClose]);

  // بستن با Escape
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // قفل scroll پس‌زمینه
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSuccess = (user) => {
    setSuccess(user);
    // SuccessScreen خودش timeout می‌ده و redirect می‌کنه
  };

  const handleBackdrop = e => {
    if (e.target === e.currentTarget) onClose();
  };

  const HEADER = {
    login:    { icon: '🔑', title: 'خوش برگشتی!',          sub: 'برای دسترسی به پنل کاربری وارد شوید' },
    register: { icon: '✨', title: 'به دیجی‌تیم بپیوندید', sub: 'ثبت‌نام رایگان — در کمتر از یک دقیقه'  },
  };

  const h = HEADER[mode];

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label={h.title}
    >
      <div className="
        relative w-full max-w-[420px]
        bg-bg-surface border border-border-default
        rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.65)] p-8
        animate-fade-up
      ">
        {/* دکمه بستن */}
        {!success && (
          <button
            onClick={onClose}
            aria-label="بستن"
            className="
              absolute top-4 left-4 w-8 h-8
              flex items-center justify-center rounded-lg
              text-text-muted hover:text-text-primary hover:bg-white/5
              bg-transparent border-none cursor-pointer transition-colors text-lg
            "
          >
            ✕
          </button>
        )}

        {success ? (
          <SuccessScreen user={success} onClose={onClose} />
        ) : (
          <>
            {/* Header */}
            <div className="text-center mb-7">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent-yellow/10 border border-accent-yellow/25 mb-4">
                <span className="text-xl">{h.icon}</span>
              </div>
              <h2 className="text-xl font-bold text-text-primary mb-1">{h.title}</h2>
              <p className="text-text-muted text-sm">{h.sub}</p>
            </div>

            {/* فرم */}
            {mode === 'login'
              ? <LoginForm    onSuccess={handleSuccess} onSwitch={() => setMode('register')} />
              : <RegisterForm onSuccess={handleSuccess} onSwitch={() => setMode('login')} />
            }
          </>
        )}
      </div>
    </div>
  );
}
