// src/pages/CheckoutPage.jsx  ← ShoppingPage (سبد خرید)
// این صفحه فقط سبد خرید است — بعد از تأیید، کاربر به /payment می‌رود
import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import ArrowIcon from '../components/ui/ArrowIcon';
import SectionLabel from '../components/ui/SectionLabel';
import AuthModal from '../components/auth/AuthModal';

function navigate(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0 });
}

// ── Cart Item Row ─────────────────────────────────────────────────────────────

function CartItemRow({ item, onUpdate, onRemove }) {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-border-default last:border-0">
      <div className="w-12 h-12 bg-bg-surface border border-border-default rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
        {item.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-text-primary text-sm truncate">{item.name}</div>
        <div className="text-text-muted text-xs mt-0.5">
          {Number(item.price).toLocaleString('fa-IR')} تومان
        </div>
      </div>
      <div className="flex items-center gap-1 bg-bg-surface border border-border-default rounded-lg overflow-hidden flex-shrink-0">
        <button
          onClick={() => item.quantity > 1 ? onUpdate(item.itemId, item.quantity - 1) : onRemove(item.itemId)}
          className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-accent-yellow hover:bg-white/5 transition-colors cursor-pointer font-bold">−</button>
        <span className="w-7 text-center text-text-primary text-sm font-bold">{item.quantity}</span>
        <button
          onClick={() => onUpdate(item.itemId, item.quantity + 1)}
          className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-accent-yellow hover:bg-white/5 transition-colors cursor-pointer font-bold">+</button>
      </div>
      <div className="text-right flex-shrink-0 min-w-[80px]">
        <div className="grad-text font-black text-sm">
          {(Number(item.price) * item.quantity).toLocaleString('fa-IR')}
        </div>
        <div className="text-text-muted text-[0.65rem]">تومان</div>
      </div>
      <button
        onClick={() => onRemove(item.itemId)}
        className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-red-400 transition-colors cursor-pointer flex-shrink-0">✕</button>
    </div>
  );
}

// ── Login prompt ──────────────────────────────────────────────────────────────

function LoginPrompt({ onLoginClick }) {
  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
        <span>⚠️</span>
        <span>برای ادامه باید وارد حساب کاربری شوید</span>
      </div>
      <p className="text-text-muted text-xs leading-relaxed">
        پس از ورود، به صفحه پرداخت هدایت خواهید شد.
      </p>
      <button
        onClick={onLoginClick}
        className="w-full py-2.5 grad-bg text-[#111] font-black text-sm rounded-lg hover:opacity-90 transition-opacity cursor-pointer">
        ورود / ثبت‌نام
      </button>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const { items, updateItem, removeItem, totalPrice } = useCart();
  const { isLoggedIn } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // ── Empty cart ────────────────────────────────────────────────────────────
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
    <>
      {showAuthModal && (
        <AuthModal
          initialMode="login"
          onClose={() => setShowAuthModal(false)}
        />
      )}

      <div className="min-h-screen pt-[72px]" dir="rtl">

        {/* Header */}
        <div className="border-b border-border-default bg-bg-surface py-10">
          <div className="w-full max-w-[1100px] mx-auto px-6">
            <SectionLabel>خرید</SectionLabel>
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

            {/* Order summary */}
            <div className="bg-bg-card border border-border-default rounded-xl p-5">
              <h3 className="font-bold text-text-primary mb-4">خلاصه سفارش</h3>

              <div className="flex flex-col gap-2.5 text-sm">
                <div className="flex justify-between text-text-secondary">
                  <span>جمع محصولات</span>
                  <span>{totalPrice.toLocaleString('fa-IR')} تومان</span>
                </div>
                <div className="h-px bg-border-default my-1" />
                <div className="flex justify-between font-black text-base">
                  <span className="text-text-primary">مبلغ کل</span>
                  <div className="text-right">
                    <div className="grad-text">{totalPrice.toLocaleString('fa-IR')}</div>
                    <div className="text-text-muted text-xs font-normal">تومان</div>
                  </div>
                </div>
              </div>

              {/* اگه لاگین نیست → prompt لاگین، وگرنه → دکمه ادامه */}
              {!isLoggedIn ? (
                <div className="mt-4">
                  <LoginPrompt onLoginClick={() => setShowAuthModal(true)} />
                </div>
              ) : (
                <button
                  onClick={() => navigate('/payment')}
                  className="w-full mt-5 py-3.5 rounded-sm font-black font-vazir text-sm transition-all duration-300 cursor-pointer grad-bg text-[#111] hover:shadow-[0_0_28px_rgba(245,197,24,0.4)] hover:scale-[1.01]">
                  ادامه و تکمیل سفارش ←
                </button>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}