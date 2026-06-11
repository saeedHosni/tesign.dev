// src/pages/CheckoutPage.jsx
import { useState } from 'react';
import { useCart } from '../context/CartContext';
import Button from '../components/ui/Button';
import ArrowIcon from '../components/ui/ArrowIcon';
import SectionLabel from '../components/ui/SectionLabel';

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:5000/api';

function navigate(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0 });
}

// ── Cart Item Row ─────────────────────────────────────────────────────────────

function CartItemRow({ item, onUpdate, onRemove }) {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-border-default last:border-0">
      {/* Icon */}
      <div className="w-12 h-12 bg-bg-surface border border-border-default rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
        {item.icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="font-bold text-text-primary text-sm truncate">{item.name}</div>
        <div className="text-text-muted text-xs mt-0.5">
          {Number(item.price).toLocaleString('fa-IR')} تومان
        </div>
      </div>

      {/* Qty */}
      <div className="flex items-center gap-1 bg-bg-surface border border-border-default rounded-lg overflow-hidden flex-shrink-0">
        <button
          onClick={() => item.quantity > 1 ? onUpdate(item.itemId, item.quantity - 1) : onRemove(item.itemId)}
          className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-accent-yellow hover:bg-white/5 transition-colors cursor-pointer font-bold">−</button>
        <span className="w-7 text-center text-text-primary text-sm font-bold">{item.quantity}</span>
        <button
          onClick={() => onUpdate(item.itemId, item.quantity + 1)}
          className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-accent-yellow hover:bg-white/5 transition-colors cursor-pointer font-bold">+</button>
      </div>

      {/* Subtotal */}
      <div className="text-right flex-shrink-0 min-w-[80px]">
        <div className="grad-text font-black text-sm">
          {(Number(item.price) * item.quantity).toLocaleString('fa-IR')}
        </div>
        <div className="text-text-muted text-[0.65rem]">تومان</div>
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(item.itemId)}
        className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-red-400 transition-colors cursor-pointer flex-shrink-0">✕</button>
    </div>
  );
}

// ── Coupon field ──────────────────────────────────────────────────────────────

function CouponField({ onApply }) {
  const [code, setCode]       = useState('');
  const [status, setStatus]   = useState(null); // null | 'ok' | 'err'
  const [message, setMessage] = useState('');

  async function apply() {
    if (!code.trim()) return;
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
      }
    } catch {
      setStatus('err');
      setMessage('خطا در اتصال به سرور');
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
          className="flex-1 bg-bg-surface border border-border-default rounded-lg px-3 py-2.5 text-[0.85rem] font-vazir text-text-primary outline-none focus:border-accent-yellow transition-colors placeholder:text-text-muted text-left"
        />
        <button
          onClick={apply}
          className="px-4 py-2.5 bg-white/5 border border-border-default text-text-secondary hover:text-accent-yellow hover:border-border-accent rounded-lg text-sm font-bold font-vazir transition-all cursor-pointer">
          اعمال
        </button>
      </div>
      {status && (
        <p className={`text-xs px-1 ${status === 'ok' ? 'text-green-400' : 'text-red-400'}`}>{message}</p>
      )}
    </div>
  );
}

// ── Order success ─────────────────────────────────────────────────────────────

function OrderSuccess({ orderNumber }) {
  return (
    <div className="min-h-screen pt-[72px] flex items-center justify-center px-6">
      <div className="text-center max-w-[440px]">
        <div className="w-20 h-20 grad-bg rounded-full flex items-center justify-center text-[2.5rem] mx-auto mb-6 shadow-[0_0_40px_rgba(245,197,24,0.3)]">
          ✓
        </div>
        <h2 className="text-2xl font-black text-text-primary mb-2">سفارش ثبت شد!</h2>
        {orderNumber && (
          <p className="text-accent-yellow font-bold text-sm mb-3">شماره سفارش: {orderNumber}</p>
        )}
        <p className="text-text-muted text-sm mb-8">
          سفارش شما با موفقیت ثبت شد. پس از تأیید پرداخت، لینک دانلود برای شما ارسال خواهد شد.
        </p>
        <div className="flex flex-col gap-3">
          <Button variant="primary" onClick={() => navigate('/shop')} className="w-full justify-center">
            ادامه خرید <ArrowIcon />
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

export default function CheckoutPage() {
  const { items, updateItem, removeItem, clearCart, totalPrice } = useCart();
  const [coupon, setCoupon]         = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderDone, setOrderDone]   = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [formErr, setFormErr]       = useState('');

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

  // ── Place order ────────────────────────────────────────────────────────────
  async function placeOrder() {
    if (items.length === 0) return;
    setSubmitting(true);
    setFormErr('');
    try {
      const token = localStorage.getItem('tesign_token');
      const body  = { couponCode: coupon?.code };

      if (token) {
        // Authenticated: POST /orders (creates from server-side cart)
        const res = await fetch(`${API_BASE}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (res.ok && data.order) {
          setOrderNumber(data.order.orderNumber || data.order.id);
          await clearCart();
          setOrderDone(true);
          return;
        }
        setFormErr(data.message || 'خطا در ثبت سفارش');
      } else {
        // Guest: simulate local order
        const fakeNum = `DT-LOCAL-${Math.random().toString(36).slice(2,8).toUpperCase()}`;
        await clearCart();
        setOrderNumber(fakeNum);
        setOrderDone(true);
      }
    } catch {
      setFormErr('خطا در اتصال به سرور. لطفاً دوباره تلاش کنید.');
    } finally {
      setSubmitting(false);
    }
  }

  if (orderDone) return <OrderSuccess orderNumber={orderNumber} />;

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-[72px] flex flex-col items-center justify-center text-center px-6">
        <div className="text-6xl mb-5">🛒</div>
        <h2 className="text-2xl font-black text-text-primary mb-3">سبد خرید خالی است</h2>
        <p className="text-text-muted mb-8 text-sm">هنوز چیزی به سبد اضافه نکردید.</p>
        <Button variant="primary" onClick={() => navigate('/shop')}>رفتن به فروشگاه <ArrowIcon /></Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-[72px]" dir="rtl">

      {/* Header */}
      <div className="border-b border-border-default bg-bg-surface py-10">
        <div className="w-full max-w-[1100px] mx-auto px-6">
          <SectionLabel>تسویه حساب</SectionLabel>
          <h1 className="text-[clamp(1.8rem,3.5vw,2.4rem)] font-black leading-[1.3]">
            سبد خرید <span className="grad-text">شما</span>
          </h1>
        </div>
      </div>

      <div className="w-full max-w-[1100px] mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10 items-start">

        {/* Cart items */}
        <div className="bg-bg-card border border-border-default rounded-xl p-6">
          <h2 className="font-black text-text-primary mb-4 text-lg">
            محصولات ({items.length.toLocaleString('fa-IR')})
          </h2>
          <div>
            {items.map(item => (
              <CartItemRow
                key={item.itemId}
                item={item}
                onUpdate={updateItem}
                onRemove={removeItem}
              />
            ))}
          </div>
          <button
            onClick={() => navigate('/shop')}
            className="mt-5 text-text-muted hover:text-accent-yellow text-sm transition-colors cursor-pointer">
            ← ادامه خرید
          </button>
        </div>

        {/* Summary sidebar */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-24">

          {/* Coupon */}
          <div className="bg-bg-card border border-border-default rounded-xl p-5">
            <h3 className="font-bold text-text-primary text-sm mb-3">کد تخفیف</h3>
            <CouponField onApply={c => setCoupon(c)} />
          </div>

          {/* Order summary */}
          <div className="bg-bg-card border border-border-default rounded-xl p-5">
            <h3 className="font-bold text-text-primary mb-4">خلاصه سفارش</h3>

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
              onClick={placeOrder}
              disabled={submitting}
              className={`w-full mt-5 py-3.5 rounded-sm font-black font-vazir text-sm transition-all duration-300 cursor-pointer
                ${submitting
                  ? 'bg-white/10 text-text-muted cursor-wait'
                  : 'grad-bg text-[#111] hover:shadow-[0_0_28px_rgba(245,197,24,0.4)] hover:scale-[1.01]'
                }`}>
              {submitting ? 'در حال ثبت سفارش...' : '✓ ثبت سفارش و پرداخت'}
            </button>

            {/* Trust */}
            <div className="flex items-center justify-center gap-1.5 mt-3 text-text-muted text-xs">
              <span>🔒</span>
              <span>پرداخت امن و رمزنگاری‌شده</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
