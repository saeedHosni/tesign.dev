// src/components/auth/AuthModal.jsx
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';

function navigate(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0 });
}

// ── Input ─────────────────────────────────────────────────────────────────────

function Field({ label, type = 'text', value, onChange, placeholder, autoComplete }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[0.82rem] font-medium text-text-secondary">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="
          w-full px-4 py-3 rounded-lg bg-bg-base border border-border-default
          text-text-primary text-sm placeholder:text-text-muted
          focus:outline-none focus:border-accent-yellow/60 focus:bg-bg-base
          transition-colors duration-200
        "
      />
    </div>
  );
}

// ── Login Form ────────────────────────────────────────────────────────────────

function LoginForm({ onSuccess, onSwitch }) {
  const { login, setError } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [err,      setErr]      = useState('');

  const handleSubmit = async () => {
    if (!email || !password) { setErr('لطفاً همه فیلدها را پر کنید'); return; }
    setErr('');
    setLoading(true);
    try {
      const user = await login({ email, password });
      onSuccess(user);
    } catch (e) {
      setErr(e.message || 'ایمیل یا رمز عبور اشتباه است');
    } finally {
      setLoading(false);
    }
  };

  const handleKey = e => { if (e.key === 'Enter') handleSubmit(); };

  return (
    <div className="flex flex-col gap-5" onKeyDown={handleKey}>
      <Field
        label="ایمیل"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="example@mail.com"
        autoComplete="email"
      />
      <Field
        label="رمز عبور"
        type="password"
        value={password}
        onChange={setPassword}
        placeholder="رمز عبور خود را وارد کنید"
        autoComplete="current-password"
      />

      {err && (
        <p className="text-[0.82rem] text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2 text-center">
          {err}
        </p>
      )}

      <Button
        variant="primary"
        onClick={handleSubmit}
        disabled={loading}
        className="w-full justify-center mt-1"
      >
        {loading ? 'در حال ورود…' : 'ورود به حساب'}
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
    if (!name || !email || !password || !confirm) {
      setErr('لطفاً همه فیلدها را پر کنید'); return;
    }
    if (password.length < 6) {
      setErr('رمز عبور باید حداقل ۶ کاراکتر باشد'); return;
    }
    if (password !== confirm) {
      setErr('رمز عبور و تکرار آن یکسان نیستند'); return;
    }
    setErr('');
    setLoading(true);
    try {
      const user = await register({ name, email, password });
      onSuccess(user);
    } catch (e) {
      setErr(e.message || 'خطا در ثبت‌نام، دوباره تلاش کنید');
    } finally {
      setLoading(false);
    }
  };

  const handleKey = e => { if (e.key === 'Enter') handleSubmit(); };

  return (
    <div className="flex flex-col gap-4" onKeyDown={handleKey}>
      <Field
        label="نام و نام‌خانوادگی"
        value={name}
        onChange={setName}
        placeholder="علی محمدی"
        autoComplete="name"
      />
      <Field
        label="ایمیل"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="example@mail.com"
        autoComplete="email"
      />
      <Field
        label="رمز عبور"
        type="password"
        value={password}
        onChange={setPassword}
        placeholder="حداقل ۶ کاراکتر"
        autoComplete="new-password"
      />
      <Field
        label="تکرار رمز عبور"
        type="password"
        value={confirm}
        onChange={setConfirm}
        placeholder="رمز عبور را دوباره وارد کنید"
        autoComplete="new-password"
      />

      {err && (
        <p className="text-[0.82rem] text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2 text-center">
          {err}
        </p>
      )}

      <Button
        variant="primary"
        onClick={handleSubmit}
        disabled={loading}
        className="w-full justify-center mt-1"
      >
        {loading ? 'در حال ثبت‌نام…' : 'ایجاد حساب کاربری'}
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

// ── Modal Shell ───────────────────────────────────────────────────────────────

export default function AuthModal({ initialMode = 'login', onClose }) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'

  const handleSuccess = (user) => {
    onClose();
    // redirect to dashboard
    navigate('/dashboard');
  };

  // Close on backdrop click
  const handleBackdrop = e => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdrop}
    >
      <div className="
        relative w-full max-w-[420px] bg-bg-surface border border-border-default
        rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.6)] p-8
      ">
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="بستن"
          className="
            absolute top-4 left-4 w-8 h-8 flex items-center justify-center
            rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5
            bg-transparent border-none cursor-pointer transition-colors text-lg
          "
        >
          ✕
        </button>

        {/* Header */}
        <div className="text-center mb-7">
          {/* Accent dot */}
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent-yellow/10 border border-accent-yellow/25 mb-4">
            <span className="text-xl">{mode === 'login' ? '🔑' : '✨'}</span>
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-1">
            {mode === 'login' ? 'خوش برگشتی!' : 'به دیجی‌تیم بپیوندید'}
          </h2>
          <p className="text-text-muted text-sm">
            {mode === 'login'
              ? 'برای دسترسی به پنل کاربری وارد شوید'
              : 'ثبت‌نام رایگان — در کمتر از یک دقیقه'}
          </p>
        </div>

        {/* Form */}
        {mode === 'login'
          ? <LoginForm    onSuccess={handleSuccess} onSwitch={() => setMode('register')} />
          : <RegisterForm onSuccess={handleSuccess} onSwitch={() => setMode('login')} />
        }
      </div>
    </div>
  );
}
