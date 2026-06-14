// src/pages/PaymentPage.jsx
// صفحه پرداخت: فرم اطلاعات + کد تخفیف + ارسال به زرین‌پال

import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import ArrowIcon from '../components/ui/ArrowIcon';
import SectionLabel from '../components/ui/SectionLabel';
import AuthModal from '../components/auth/AuthModal';

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:5000/api';

function navigate(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0 });
}

// ── Redirecting ───────────────────────────────────────────────────────────────

function RedirectingScreen() {
  return (
    <div className="min-h-screen pt-[72px] flex items-center justify-center px-6">
      <div className="text-center max-w-[360px]">
        <div className="w-20 h-20 border-4 border-accent-yellow/30 border-t-accent-yellow rounded-full animate-spin mx-auto mb-6" />
        <h2 className="text-xl font-black text-text-primary mb-2">در حال انتقال به درگاه پرداخت</h2>
        <p className="text-text-muted text-sm">لطفاً صبر کنید...</p>
      </div>
    </div>
  );
}

// ── Coupon Field ──────────────────────────────────────────────────────────────

function CouponField({ onApply, applied }) {
  const [code, setCode]       = useState('');
  const [status, setStatus]   = useState(null); // null | 'ok' | 'err'
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function apply() {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('tesign_token');
      const res = await fetch(`${API_BASE}/coupons/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.coupon) {
        setStatus('ok');
        setMessage(`کد تخفیف اعمال شد: ${data.coupon.discountValue}${data.coupon.discountType === 'PERCENTAGE' ? '%' : ' تومان'} تخفیف`);
        onApply(data.coupon);
      } else {
        setStatus('err');
        setMessage(data.message || 'کد نامعتبر است');
        onApply(null);
      }
    } catch {
      setStatus('err');
      setMessage('خطا در اتصال به سرور');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        <input
          value={code}
          onChange={e => { setCode(e.target.value); setStatus(null); }}
          onKeyDown={e => e.key === 'Enter' && apply()}
          placeholder="کد تخفیف دارید؟"
          dir="ltr"
          disabled={applied && status === 'ok'}
          className="flex-1 bg-bg-surface border border-border-default rounded-lg px-3 py-2.5 text-[0.85rem] font-vazir text-text-primary outline-none focus:border-accent-yellow transition-colors placeholder:text-text-muted text-left disabled:opacity-60"
        />
        <button
          onClick={apply}
          disabled={loading || (applied && status === 'ok')}
          className="px-4 py-2.5 bg-white/5 border border-border-default text-text-secondary hover:text-accent-yellow hover:border-border-accent rounded-lg text-sm font-bold font-vazir transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? '...' : 'اعمال'}
        </button>
      </div>
      {status && (
        <p className={`text-xs px-1 ${status === 'ok' ? 'text-green-400' : 'text-red-400'}`}>{message}</p>
      )}
    </div>
  );
}

// ── Form Field ────────────────────────────────────────────────────────────────

function FormField({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-text-secondary text-xs font-bold">
        {label} {required && <span className="text-accent-yellow">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass = "w-full bg-bg-surface border border-border-default rounded-lg px-3 py-2.5 text-[0.88rem] font-vazir text-text-primary outline-none focus:border-accent-yellow transition-colors placeholder:text-text-muted";

// ── Main ─────────────────────────────────────────────────────────────────────

export default function PaymentPage() {
  const { items, totalPrice } = useCart();
  const { user, isLoggedIn } = useAuth();

  const [coupon, setCoupon]           = useState(null);
  const [submitting, setSubmitting]   = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [formErr, setFormErr]         = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);

  // فیلدهای فرم — از پروفایل پر می‌شوند
  const [form, setForm] = useState({
    fullName: '',
    phone:    '',
    email:    '',
    address:  '',
    notes:    '',
  });

  // پر کردن از پروفایل کاربر
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        fullName: user.name  || prev.fullName,
        phone:    user.phone || prev.phone,
        email:    user.email || prev.email,
      }));
    }
  }, [user]);

  // ── Coupon discount calc ───────────────────────────────────────────────────
  let discount = 0;
  if (coupon) {
    if (coupon.discountType === 'PERCENTAGE') {
      discount = Math.round(totalPrice * coupon.discountValue / 100);
    } else {
      discount = Math.min(coupon.discountValue, totalPrice);
    }
  }
  const finalPrice = totalPrice - discount;

  function setField(key, val) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  // ── Submit → go to zarinpal ───────────────────────────────────────────────
  async function handleSubmit() {
    if (items.length === 0) return;
    if (!isLoggedIn) { setShowAuthModal(true); return; }

    // validation
    if (!form.fullName.trim()) { setFormErr('لطفاً نام و نام خانوادگی را وارد کنید.'); return; }
    if (!form.phone.trim())    { setFormErr('لطفاً شماره تماس را وارد کنید.'); return; }
    if (!form.email.trim())    { setFormErr('لطفاً ایمیل را وارد کنید.'); return; }

    setSubmitting(true);
    setFormErr('');

    try {
      const token = localStorage.getItem('tesign_token');
      const res = await fetch(`${API_BASE}/payment/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          couponCode:  coupon?.code || undefined,
          notes:       form.notes  || undefined,
          // اطلاعات تکمیلی — در metadata ذخیره می‌شود
          customerInfo: {
            fullName: form.fullName,
            phone:    form.phone,
            email:    form.email,
            address:  form.address,
          },
        }),
      });

      const data = await res.json();

      if (res.ok && data.redirectUrl) {
        setRedirecting(true);
        window.location.href = data.redirectUrl;
        return;
      }

      setFormErr(data.message || 'خطا در اتصال به درگاه پرداخت');
    } catch {
      setFormErr('خطا در اتصال به سرور. لطفاً دوباره تلاش کنید.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Redirecting screen ────────────────────────────────────────────────────
  if (redirecting) return <RedirectingScreen />;

  // ── Empty cart redirect ───────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-[72px] flex flex-col items-center justify-center text-center px-6">
        <div className="text-6xl mb-5">🛒</div>
        <h2 className="text-2xl font-black text-text-primary mb-3">سبد خرید خالی است</h2>
        <p className="text-text-muted mb-8 text-sm">ابتدا محصولاتی به سبد اضافه کنید.</p>
        <Button variant="primary" onClick={() => navigate('/shop')}>رفتن به فروشگاه <ArrowIcon /></Button>
      </div>
    );
  }

  return (
    <>
      {showAuthModal && (
        <AuthModal initialMode="login" onClose={() => setShowAuthModal(false)} />
      )}

      <div className="min-h-screen pt-[72px]" dir="rtl">

        {/* Header */}
        <div className="border-b border-border-default bg-bg-surface py-10">
          <div className="w-full max-w-[1100px] mx-auto px-6">
            <SectionLabel>پرداخت</SectionLabel>
            <h1 className="text-[clamp(1.8rem,3.5vw,2.4rem)] font-black leading-[1.3]">
              تکمیل <span className="grad-text">سفارش</span>
            </h1>
            {/* breadcrumb */}
            <div className="flex items-center gap-2 mt-3 text-text-muted text-xs">
              <button onClick={() => navigate('/checkout')} className="hover:text-accent-yellow transition-colors cursor-pointer">
                سبد خرید
              </button>
              <span>←</span>
              <span className="text-accent-yellow font-bold">اطلاعات پرداخت</span>
            </div>
          </div>
        </div>

        <div className="w-full max-w-[1100px] mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10 items-start">

          {/* ── Left: Form ─────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-5">

            {/* اطلاعات گیرنده */}
            <div className="bg-bg-card border border-border-default rounded-xl p-6">
              <h2 className="font-black text-text-primary mb-5 text-lg flex items-center gap-2">
                <span>👤</span> اطلاعات گیرنده
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <FormField label="نام و نام خانوادگی" required>
                  <input
                    value={form.fullName}
                    onChange={e => setField('fullName', e.target.value)}
                    placeholder="مثال: علی محمدی"
                    className={inputClass}
                  />
                </FormField>

                <FormField label="شماره تماس" required>
                  <input
                    value={form.phone}
                    onChange={e => setField('phone', e.target.value)}
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    dir="ltr"
                    className={inputClass + " text-right"}
                  />
                </FormField>

                <FormField label="ایمیل" required>
                  <input
                    value={form.email}
                    onChange={e => setField('email', e.target.value)}
                    placeholder="example@email.com"
                    dir="ltr"
                    className={inputClass + " text-right"}
                  />
                </FormField>

                <FormField label="آدرس">
                  <input
                    value={form.address}
                    onChange={e => setField('address', e.target.value)}
                    placeholder="آدرس (اختیاری)"
                    className={inputClass}
                  />
                </FormField>

              </div>
            </div>

            {/* توضیحات سفارش */}
            <div className="bg-bg-card border border-border-default rounded-xl p-6">
              <h2 className="font-black text-text-primary mb-5 text-lg flex items-center gap-2">
                <span>📝</span> توضیحات سفارش
              </h2>
              <textarea
                value={form.notes}
                onChange={e => setField('notes', e.target.value)}
                placeholder="در صورت نیاز، توضیحات خود را اینجا بنویسید... (اختیاری)"
                rows={4}
                className={inputClass + " resize-none"}
              />
            </div>

            {/* back to cart (mobile) */}
            <button
              onClick={() => navigate('/checkout')}
              className="text-text-muted hover:text-accent-yellow text-sm transition-colors cursor-pointer text-right lg:hidden">
              ← بازگشت به سبد خرید
            </button>
          </div>

          {/* ── Right: Summary ──────────────────────────────────────────────── */}
          <div className="flex flex-col gap-4 lg:sticky lg:top-24">

            {/* خلاصه سبد */}
            <div className="bg-bg-card border border-border-default rounded-xl p-5">
              <h3 className="font-bold text-text-primary mb-3 text-sm">
                محصولات ({items.length.toLocaleString('fa-IR')})
              </h3>
              <div className="flex flex-col gap-2 mb-3">
                {items.map(item => (
                  <div key={item.itemId} className="flex justify-between items-center text-xs text-text-secondary">
                    <span className="truncate ml-2">{item.icon} {item.name}</span>
                    <span className="flex-shrink-0 font-bold">
                      {(Number(item.price) * item.quantity).toLocaleString('fa-IR')} ت
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate('/checkout')}
                className="text-text-muted hover:text-accent-yellow text-xs transition-colors cursor-pointer">
                ویرایش سبد ←
              </button>
            </div>

            {/* کد تخفیف */}
            <div className="bg-bg-card border border-border-default rounded-xl p-5">
              <h3 className="font-bold text-text-primary text-sm mb-3">کد تخفیف</h3>
              <CouponField onApply={c => setCoupon(c)} applied={!!coupon} />
            </div>

            {/* خلاصه مبلغ + دکمه */}
            <div className="bg-bg-card border border-border-default rounded-xl p-5">
              <h3 className="font-bold text-text-primary mb-4">مبلغ پرداختی</h3>

              <div className="flex flex-col gap-2.5 text-sm">
                <div className="flex justify-between text-text-secondary">
                  <span>جمع محصولات</span>
                  <span>{totalPrice.toLocaleString('fa-IR')} تومان</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>تخفیف</span>
                    <span>−{discount.toLocaleString('fa-IR')} تومان</span>
                  </div>
                )}
                <div className="h-px bg-border-default my-1" />
                <div className="flex justify-between font-black text-base">
                  <span className="text-text-primary">مبلغ نهایی</span>
                  <div className="text-right">
                    <div className="grad-text">{finalPrice.toLocaleString('fa-IR')}</div>
                    <div className="text-text-muted text-xs font-normal">تومان</div>
                  </div>
                </div>
              </div>

              {formErr && (
                <p className="text-red-400 text-xs mt-3 p-2 bg-red-400/10 rounded-md">{formErr}</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className={`w-full mt-5 py-3.5 rounded-sm font-black font-vazir text-sm transition-all duration-300 cursor-pointer
                  ${submitting
                    ? 'bg-white/10 text-text-muted cursor-wait'
                    : 'grad-bg text-[#111] hover:shadow-[0_0_28px_rgba(245,197,24,0.4)] hover:scale-[1.01]'
                  }`}>
                {submitting ? 'در حال اتصال به درگاه...' : '✓ پرداخت آنلاین'}
              </button>

              <div className="flex items-center justify-center gap-1.5 mt-3 text-text-muted text-xs">
                <span>🔒</span>
                <span>پرداخت امن از طریق زرین‌پال</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}