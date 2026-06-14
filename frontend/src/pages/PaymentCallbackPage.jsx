// src/pages/PaymentCallbackPage.jsx
// کاربر از زرین‌پال برمی‌گرده اینجا — verify می‌کنیم و نتیجه نشون می‌دیم

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Button from '../components/ui/Button';
import ArrowIcon from '../components/ui/ArrowIcon';

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:5000/api';

function navigate(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0 });
}

// ── States ────────────────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="min-h-screen pt-[72px] flex items-center justify-center px-6">
      <div className="text-center">
        <div className="w-20 h-20 border-4 border-accent-yellow/30 border-t-accent-yellow rounded-full animate-spin mx-auto mb-6" />
        <h2 className="text-xl font-black text-text-primary mb-2">در حال تأیید پرداخت</h2>
        <p className="text-text-muted text-sm">لطفاً صفحه را نبندید...</p>
      </div>
    </div>
  );
}

function SuccessScreen({ orderNumber, refId }) {
  return (
    <div className="min-h-screen pt-[72px] flex items-center justify-center px-6">
      <div className="text-center max-w-[440px]">
        <div className="w-20 h-20 grad-bg rounded-full flex items-center justify-center text-[2.5rem] mx-auto mb-6 shadow-[0_0_40px_rgba(245,197,24,0.3)]">
          ✓
        </div>
        <h2 className="text-2xl font-black text-text-primary mb-2">پرداخت موفق!</h2>
        {orderNumber && (
          <p className="text-accent-yellow font-bold text-sm mb-1">شماره سفارش: {orderNumber}</p>
        )}
        {refId && (
          <p className="text-text-muted text-xs mb-4" dir="ltr">کد پیگیری: {refId}</p>
        )}
        <p className="text-text-muted text-sm mb-8 leading-relaxed">
          سفارش شما با موفقیت ثبت و پرداخت شد. لینک دانلود محصولات در داشبورد شما موجود است.
        </p>
        <div className="flex flex-col gap-3">
          <Button variant="primary" onClick={() => navigate('/dashboard')} className="w-full justify-center">
            مشاهده سفارش‌ها <ArrowIcon />
          </Button>
          <button
            onClick={() => navigate('/shop')}
            className="text-text-muted hover:text-text-secondary text-sm transition-colors cursor-pointer">
            ادامه خرید
          </button>
        </div>
      </div>
    </div>
  );
}

function FailScreen({ message }) {
  return (
    <div className="min-h-screen pt-[72px] flex items-center justify-center px-6">
      <div className="text-center max-w-[440px]">
        <div className="w-20 h-20 bg-red-500/10 border-2 border-red-500/30 rounded-full flex items-center justify-center text-[2.5rem] mx-auto mb-6">
          ✕
        </div>
        <h2 className="text-2xl font-black text-text-primary mb-2">پرداخت ناموفق</h2>
        <p className="text-text-muted text-sm mb-8 leading-relaxed">
          {message || 'پرداخت با موفقیت انجام نشد. مبلغی از حساب شما کسر نشده است.'}
        </p>
        <div className="flex flex-col gap-3">
          <Button variant="primary" onClick={() => navigate('/checkout')} className="w-full justify-center">
            بازگشت به سبد خرید <ArrowIcon />
          </Button>
          <button
            onClick={() => navigate('/')}
            className="text-text-muted hover:text-text-secondary text-sm transition-colors cursor-pointer">
            بازگشت به صفحه اصلی
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function PaymentCallbackPage() {
  const { isLoggedIn } = useAuth();
  const { clearCart } = useCart();
  const [state, setState] = useState('loading'); // loading | success | fail
  const [result, setResult] = useState(null);

  useEffect(() => {
    const params    = new URLSearchParams(window.location.search);
    const authority = params.get('Authority');
    const status    = params.get('Status');

    if (!authority) {
      setState('fail');
      setResult({ message: 'اطلاعات تراکنش ناقص است.' });
      return;
    }

    // اگه Status=NOK بود، verify نمی‌کنیم — مستقیم fail نشون می‌دیم
    if (status === 'NOK') {
      setState('fail');
      setResult({ message: 'پرداخت توسط شما لغو شد.' });
      return;
    }

    const token = localStorage.getItem('tesign_token');
    if (!token) {
      setState('fail');
      setResult({ message: 'برای تأیید پرداخت باید وارد حساب کاربری خود باشید.' });
      return;
    }

    fetch(`${API_BASE}/payment/verify`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:  `Bearer ${token}`,
      },
      body: JSON.stringify({ authority, status }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          clearCart();
          setState('success');
          setResult(data);
        } else {
          setState('fail');
          setResult({ message: data.message });
        }
      })
      .catch(() => {
        setState('fail');
        setResult({ message: 'خطا در اتصال به سرور.' });
      });
  }, []);

  if (state === 'loading') return <LoadingScreen />;
  if (state === 'success') return <SuccessScreen orderNumber={result?.orderNumber} refId={result?.refId} />;
  return <FailScreen message={result?.message} />;
}