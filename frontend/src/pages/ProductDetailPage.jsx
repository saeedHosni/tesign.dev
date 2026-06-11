// src/pages/ProductDetailPage.jsx
import { useState } from 'react';
import { useProductDetail } from '../hooks/useProductDetail';
import { useCart } from '../context/CartContext';
import Button from '../components/ui/Button';
import ArrowIcon from '../components/ui/ArrowIcon';
import { useScrollReveal } from '../hooks/useScrollReveal';

// ── helpers ───────────────────────────────────────────────────────────────────

function navigate(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0 });
}

// ── Star rating ───────────────────────────────────────────────────────────────

function Stars({ rating = 0, count = 0 }) {
  const full  = Math.floor(rating);
  const half  = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {Array.from({ length: full }).map((_, i)  => <span key={`f${i}`} className="text-accent-yellow text-sm">★</span>)}
        {half && <span className="text-accent-yellow text-sm opacity-60">★</span>}
        {Array.from({ length: empty }).map((_, i) => <span key={`e${i}`} className="text-text-muted text-sm">★</span>)}
      </div>
      {count > 0 && <span className="text-text-muted text-xs">{count.toLocaleString('fa-IR')} نظر</span>}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="min-h-screen pt-[72px] animate-pulse">
      <div className="w-full max-w-[1100px] mx-auto px-6 py-14 grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="aspect-[4/3] bg-bg-card rounded-xl" />
        <div className="flex flex-col gap-4">
          <div className="h-3 w-24 bg-bg-card rounded" />
          <div className="h-8 w-3/4 bg-bg-card rounded" />
          <div className="h-4 w-1/2 bg-bg-card rounded" />
          <div className="h-24 bg-bg-card rounded" />
          <div className="h-12 w-full bg-bg-card rounded mt-4" />
        </div>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function ProductDetailPage({ slug }) {
  const { product, loading, error } = useProductDetail(slug);
  const { addItem, items } = useCart();
  const [added, setAdded] = useState(false);
  const [qty, setQty]     = useState(1);
  useScrollReveal();

  if (loading) return <Skeleton />;

  if (error || !product) {
    return (
      <div className="min-h-screen pt-[72px] flex flex-col items-center justify-center text-center px-6">
        <div className="text-6xl mb-5">😕</div>
        <h2 className="text-2xl font-black text-text-primary mb-3">محصول یافت نشد</h2>
        <p className="text-text-muted mb-8">ممکن است این محصول حذف شده یا آدرس آن تغییر کرده باشد.</p>
        <Button variant="outline" onClick={() => navigate('/shop')}>← بازگشت به فروشگاه</Button>
      </div>
    );
  }

  const inCart     = items.some(i => i.id === product.id);
  const isOutStock = product.stock !== undefined && product.stock !== null && product.stock !== -1 && product.stock === 0;

  function handleAddToCart() {
    addItem(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  return (
    <div className="min-h-screen pt-[72px]" dir="rtl">

      {/* ── Breadcrumb ── */}
      <div className="border-b border-border-default bg-bg-surface">
        <div className="w-full max-w-[1100px] mx-auto px-6 py-3 flex items-center gap-2 text-[0.75rem] text-text-muted">
          <button onClick={() => navigate('/')} className="hover:text-accent-yellow transition-colors cursor-pointer">خانه</button>
          <span>/</span>
          <button onClick={() => navigate('/shop')} className="hover:text-accent-yellow transition-colors cursor-pointer">فروشگاه</button>
          <span>/</span>
          <span className="text-text-secondary">{product.name}</span>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="w-full max-w-[1100px] mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-12 items-start">

        {/* Left — visual */}
        <div className="reveal">
          <div className={`${product.thumbClass} aspect-[4/3] rounded-xl flex items-center justify-center relative overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.5)]`}>
            <div className="flex flex-col items-center gap-3">
              <div className="text-[5rem]">{product.icon}</div>
              <div className="text-sm font-semibold text-text-muted">{product.thumbLabel}</div>
            </div>
            {product.badge && (
              <div className="absolute top-4 right-4 grad-bg text-[#111] text-xs font-black px-3 py-1 rounded-full shadow-md">
                {product.badge}
              </div>
            )}
          </div>

          {/* Tags row */}
          {product.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-5">
              {product.tags.map(tag => (
                <span key={tag}
                  className="text-[0.72rem] px-3 py-1 bg-bg-card border border-border-default rounded-full text-text-secondary">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right — info */}
        <div className="reveal reveal-delay-1 flex flex-col gap-5 lg:sticky lg:top-24">

          {/* Category */}
          <div className="text-[0.7rem] font-bold text-accent-yellow tracking-[0.1em] uppercase">
            {product.category}
          </div>

          {/* Name */}
          <h1 className="text-[clamp(1.6rem,3vw,2.1rem)] font-black text-text-primary leading-[1.3]">
            {product.name}
          </h1>

          {/* Subtitle */}
          {product.sub && (
            <p className="text-text-secondary text-[0.95rem]">{product.sub}</p>
          )}

          {/* Rating */}
          {(product.rating > 0 || product.reviewCount > 0) && (
            <Stars rating={product.rating} count={product.reviewCount} />
          )}

          {/* Description */}
          {product.description && (
            <div className="bg-bg-card border border-border-default rounded-lg p-5 text-[0.88rem] text-text-secondary leading-[1.9]">
              {product.description}
            </div>
          )}

          {/* Features quick-list */}
          <ul className="flex flex-col gap-2">
            {[
              'دانلود فوری پس از خرید',
              'پشتیبانی ۳۰ روزه',
              'آپدیت رایگان',
              'مستندات کامل',
            ].map(f => (
              <li key={f} className="flex items-center gap-2.5 text-[0.83rem] text-text-secondary">
                <span className="text-accent-yellow text-xs">✓</span>
                {f}
              </li>
            ))}
          </ul>

          {/* Divider */}
          <div className="h-px bg-border-default" />

          {/* Price block */}
          <div className="flex items-end gap-3">
            <div className="grad-text text-[2rem] font-black leading-none">{product.price}</div>
            <div className="text-text-muted text-sm pb-0.5">تومان</div>
            {product.comparePrice && (
              <div className="text-text-muted text-sm pb-0.5 line-through">
                {Number(product.comparePrice).toLocaleString('fa-IR')}
              </div>
            )}
          </div>

          {isOutStock ? (
            <div className="text-center py-3 text-text-muted text-sm border border-border-default rounded-lg">
              موجودی تمام شد
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Qty selector */}
              <div className="flex items-center gap-3">
                <span className="text-text-muted text-sm">تعداد:</span>
                <div className="flex items-center gap-1 bg-bg-card border border-border-default rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="w-9 h-9 flex items-center justify-center text-text-secondary hover:text-accent-yellow hover:bg-white/5 transition-colors cursor-pointer text-lg font-bold">−</button>
                  <span className="w-8 text-center text-text-primary font-bold text-sm">{qty}</span>
                  <button
                    onClick={() => setQty(q => q + 1)}
                    className="w-9 h-9 flex items-center justify-center text-text-secondary hover:text-accent-yellow hover:bg-white/5 transition-colors cursor-pointer text-lg font-bold">+</button>
                </div>
              </div>

              {/* Add to cart */}
              <Button
                variant="primary"
                onClick={handleAddToCart}
                className="w-full justify-center py-3.5 text-base"
              >
                {added ? '✓ به سبد اضافه شد' : '🛒 افزودن به سبد خرید'}
                {!added && <ArrowIcon />}
              </Button>

              {/* Go to cart / checkout */}
              {inCart && (
                <button
                  onClick={() => navigate('/checkout')}
                  className="w-full py-3 border border-border-accent text-accent-yellow rounded-sm text-sm font-bold font-vazir hover:bg-[rgba(245,197,24,0.08)] transition-colors cursor-pointer">
                  مشاهده سبد و تسویه حساب ←
                </button>
              )}
            </div>
          )}

          {/* Trust badges */}
          <div className="grid grid-cols-2 gap-2 mt-1">
            {[
              { icon: '🔒', label: 'پرداخت امن' },
              { icon: '⚡', label: 'تحویل فوری' },
              { icon: '↩️', label: 'ضمانت بازگشت' },
              { icon: '🎧', label: 'پشتیبانی ۲۴/۷' },
            ].map(b => (
              <div key={b.label}
                className="flex items-center gap-2 bg-bg-card border border-border-default rounded-md px-3 py-2 text-[0.72rem] text-text-muted">
                <span>{b.icon}</span>
                {b.label}
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── Related / CTA ── */}
      <div className="border-t border-border-default bg-bg-surface mt-4">
        <div className="w-full max-w-[1100px] mx-auto px-6 py-14 text-center">
          <div className="text-3xl mb-4">🎯</div>
          <h3 className="text-xl font-black text-text-primary mb-2">پروژه سفارشی دارید؟</h3>
          <p className="text-text-muted max-w-[400px] mx-auto mb-6 text-sm">
            اگر محصول آماده مناسب نبود، تیم تیزاین دقیقاً آنچه نیاز دارید را می‌سازد.
          </p>
          <Button variant="outline" onClick={() => navigate('/order')}>ثبت پروژه سفارشی <ArrowIcon /></Button>
        </div>
      </div>

    </div>
  );
}
