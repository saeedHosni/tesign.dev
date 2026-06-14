// src/pages/ProductDetailPage.jsx
import { useState, useEffect } from 'react';
import { useProductDetail } from '../hooks/useProductDetail';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { reviewApi } from '../services/api';
import Button from '../components/ui/Button';
import ArrowIcon from '../components/ui/ArrowIcon';
import { useScrollReveal } from '../hooks/useScrollReveal';

function navigate(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0 });
}

// ── Stars ─────────────────────────────────────────────────────────────────────
function Stars({ rating = 0, count = 0, size = 'sm' }) {
  const full  = Math.floor(rating);
  const half  = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  const sz = size === 'lg' ? 'text-xl' : 'text-sm';
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {Array.from({ length: full  }).map((_, i) => <span key={`f${i}`} className={`text-accent-yellow ${sz}`}>★</span>)}
        {half && <span className={`text-accent-yellow opacity-60 ${sz}`}>★</span>}
        {Array.from({ length: empty }).map((_, i) => <span key={`e${i}`} className={`text-text-muted ${sz}`}>★</span>)}
      </div>
      {count > 0 && <span className="text-text-muted text-xs">{count.toLocaleString('fa-IR')} نظر</span>}
    </div>
  );
}

// ── Star picker ───────────────────────────────────────────────────────────────
function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button"
          onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          className="text-2xl cursor-pointer bg-transparent border-none p-0 transition-transform hover:scale-110">
          <span className={(hovered || value) >= n ? 'text-accent-yellow' : 'text-text-muted'}>★</span>
        </button>
      ))}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="min-h-screen pt-[72px] animate-pulse">
      <div className="w-full max-w-[1160px] mx-auto px-6 py-14 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12">
        <div className="aspect-[16/10] bg-bg-card rounded-2xl" />
        <div className="flex flex-col gap-4">
          <div className="h-3 w-24 bg-bg-card rounded" />
          <div className="h-9 w-3/4 bg-bg-card rounded" />
          <div className="h-4 w-1/2 bg-bg-card rounded" />
          <div className="h-28 bg-bg-card rounded" />
          <div className="h-14 w-full bg-bg-card rounded mt-4" />
        </div>
      </div>
    </div>
  );
}

// ── Features list ─────────────────────────────────────────────────────────────
function FeaturesList({ features }) {
  if (!features?.length) return (
    <div className="text-center py-16 text-text-muted text-sm">امکاناتی ثبت نشده است.</div>
  );
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {features.map(f => (
        <div key={f.id} className="flex items-center gap-3 bg-bg-card border border-border-default rounded-xl p-4 hover:border-border-accent transition-colors group">
          {f.icon && (
            <span className="w-9 h-9 rounded-lg bg-accent-yellow/10 flex items-center justify-center text-lg flex-shrink-0 group-hover:bg-accent-yellow/20 transition-colors">
              {f.icon}
            </span>
          )}
          <span className="text-text-secondary text-sm flex-1">{f.title}</span>
          {f.value && <span className="grad-text font-bold text-sm whitespace-nowrap">{f.value}</span>}
        </div>
      ))}
    </div>
  );
}

// ── FAQ accordion ─────────────────────────────────────────────────────────────
function FaqAccordion({ faqs }) {
  const [openId, setOpenId] = useState(null);
  if (!faqs?.length) return (
    <div className="text-center py-16 text-text-muted text-sm">سوالی ثبت نشده است.</div>
  );
  return (
    <div className="flex flex-col gap-2 max-w-[760px]">
      {faqs.map(faq => {
        const open = openId === faq.id;
        return (
          <div key={faq.id} className={`border rounded-xl overflow-hidden transition-all duration-200 ${open ? 'border-border-accent' : 'border-border-default'} bg-bg-card`}>
            <button onClick={() => setOpenId(open ? null : faq.id)}
              className="w-full flex items-center justify-between gap-4 p-4 text-right bg-transparent border-none cursor-pointer">
              <span className="text-text-primary font-bold text-sm">{faq.question}</span>
              <span className={`text-xl leading-none flex-shrink-0 transition-all duration-300 ${open ? 'text-accent-yellow rotate-45' : 'text-text-muted'}`}>+</span>
            </button>
            {open && (
              <div className="px-4 pb-4 text-text-muted text-sm leading-relaxed border-t border-border-default pt-3">
                {faq.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Changelog list ────────────────────────────────────────────────────────────
function ChangelogList({ changelogs }) {
  if (!changelogs?.length) return (
    <div className="text-center py-16 text-text-muted text-sm">تغییراتی ثبت نشده است.</div>
  );
  return (
    <div className="flex flex-col gap-4 max-w-[760px]">
      {changelogs.map(log => (
        <div key={log.id} className="bg-bg-card border border-border-default rounded-xl p-5 hover:border-border-accent transition-colors">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="grad-bg text-[#111] text-xs font-black px-3 py-1.5 rounded-full">نسخه {log.version}</span>
            {log.title && <span className="text-text-secondary text-sm font-bold">{log.title}</span>}
            {log.releasedAt && (
              <span className="mr-auto text-text-muted text-xs bg-white/5 px-2 py-0.5 rounded-md">
                {new Date(log.releasedAt).toLocaleDateString('fa-IR')}
              </span>
            )}
          </div>
          {log.changes?.length > 0 && (
            <ul className="flex flex-col gap-2">
              {log.changes.map((change, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-text-muted">
                  <span className="text-accent-yellow mt-0.5 flex-shrink-0">✓</span>
                  {change}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Review card ───────────────────────────────────────────────────────────────
function ReviewCard({ review }) {
  const date = review.createdAt ? new Date(review.createdAt).toLocaleDateString('fa-IR') : '';
  return (
    <div className="bg-bg-card border border-border-default rounded-xl p-5 hover:border-border-accent transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full grad-bg flex items-center justify-center text-[#111] font-black text-sm flex-shrink-0">
            {review.user?.name?.charAt(0) || '؟'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-text-primary font-bold text-sm">{review.user?.name || 'کاربر'}</span>
              {(review.user?.role === 'ADMIN' || review.user?.role === 'MANAGER') ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-accent-yellow bg-accent-yellow/10 border border-accent-yellow/30 rounded-full px-2 py-0.5">
                  ادمین
                </span>
              ) : review.verifiedPurchase && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-2 py-0.5">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                  خریدار
                </span>
              )}
            </div>
            {date && <div className="text-text-muted text-xs mt-0.5">{date}</div>}
          </div>
        </div>
        <Stars rating={review.rating} />
      </div>
      {(review.comment || review.body) && (
        <p className="text-text-secondary text-sm leading-relaxed">{review.comment || review.body}</p>
      )}
    </div>
  );
}

// ── Review form ───────────────────────────────────────────────────────────────
function ReviewForm({ productId, onSuccess }) {
  const { user } = useAuth();
  const [rating, setRating]       = useState(0);
  const [comment, setComment]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState(false);

  if (!user) {
    return (
      <div className="bg-bg-card border border-border-default rounded-xl p-6 text-center">
        <div className="text-3xl mb-3">💬</div>
        <p className="text-text-secondary text-sm mb-4">برای ثبت نظر ابتدا وارد حساب کاربری شوید.</p>
        <Button variant="outline" onClick={() => navigate('/auth')}>ورود / ثبت‌نام <ArrowIcon /></Button>
      </div>
    );
  }
  if (success) {
    return (
      <div className="bg-bg-card border border-border-accent rounded-xl p-6 text-center flex flex-col items-center gap-3">
        <div className="text-3xl">✅</div>
        <p className="text-text-primary font-bold">نظر شما ثبت شد</p>
        <p className="text-text-muted text-sm">پس از تأیید مدیر سایت در لیست نظرات نمایش داده می‌شود.</p>
        <Button variant="outline" onClick={() => { setSuccess(false); setComment(''); setRating(0); }}>
          ثبت نظر دیگر
        </Button>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!rating)        { setError('لطفاً امتیاز بدهید'); return; }
    if (!comment.trim()) { setError('لطفاً متن نظر را وارد کنید'); return; }
    setError(''); setSubmitting(true);
    try {
      await reviewApi.create({ productId, rating, body: comment.trim() });
      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(err?.message || 'خطایی رخ داد. دوباره تلاش کنید.');
    } finally { setSubmitting(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-bg-card border border-border-default rounded-xl p-5 flex flex-col gap-4">
      <h4 className="text-text-primary font-bold text-sm">نظر خود را بنویسید</h4>
      <div>
        <label className="text-text-muted text-xs mb-2 block">امتیاز شما</label>
        <StarPicker value={rating} onChange={setRating} />
      </div>
      <div>
        <label className="text-text-muted text-xs mb-2 block">متن نظر</label>
        <textarea value={comment} onChange={e => setComment(e.target.value)} rows={4}
          placeholder="تجربه خود را بنویسید..."
          className="w-full bg-bg-base border border-border-default rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-border-accent transition-colors font-vazir" />
      </div>
      {error && <div className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</div>}
      <Button variant="primary" type="submit" disabled={submitting} className="self-start">
        {submitting ? 'در حال ارسال...' : 'ثبت نظر'}
        {!submitting && <ArrowIcon />}
      </Button>
    </form>
  );
}

// ── Reviews tab content ───────────────────────────────────────────────────────
function ReviewsTabContent({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      const res = await reviewApi.getByProduct(productId);
      if (res?.success && Array.isArray(res.data)) setReviews(res.data);
    } catch { /* نظرات اختیاری هستند */ }
    finally { setLoading(false); }
  };

  useEffect(() => { if (productId) fetchReviews(); }, [productId]);

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <div className="flex flex-col gap-6 max-w-[760px]">
      {/* Rating summary bar */}
      {reviews.length > 0 && (
        <div className="flex items-center gap-4 bg-bg-card border border-border-default rounded-xl px-5 py-4">
          <div className="text-center">
            <div className="grad-text text-4xl font-black leading-none">{avg}</div>
            <div className="text-text-muted text-xs mt-1">از ۵</div>
          </div>
          <div className="w-px h-10 bg-border-default" />
          <div>
            <Stars rating={parseFloat(avg)} size="lg" />
            <p className="text-text-muted text-xs mt-1.5">بر اساس {reviews.length.toLocaleString('fa-IR')} نظر</p>
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex flex-col gap-3">
        {loading && [1,2].map(i => <div key={i} className="h-24 bg-bg-card rounded-xl animate-pulse" />)}
        {!loading && reviews.length === 0 && (
          <div className="text-center py-14 bg-bg-card border border-dashed border-border-default rounded-xl">
            <div className="text-4xl mb-3">⭐</div>
            <p className="text-text-secondary text-sm">هنوز نظری ثبت نشده. اولین نفر باشید!</p>
          </div>
        )}
        {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
      </div>

      {/* Form — زیر کامنت‌ها */}
      <ReviewForm productId={productId} onSuccess={fetchReviews} />
    </div>
  );
}

// ── Tabs section ──────────────────────────────────────────────────────────────
function ProductTabs({ product }) {
  const tabs = [
    { id: 'description', label: 'توضیحات',       always: true },
    { id: 'features',    label: 'امکانات',        show: product.features?.length > 0 },
    { id: 'faq',         label: 'سوالات متداول', show: product.faqs?.length > 0 },
    { id: 'changelog',   label: 'تغییرات نسخه',  show: product.changelogs?.length > 0 },
    { id: 'reviews',     label: 'نظرات',          always: true },
  ].filter(t => t.always || t.show);

  const [active, setActive] = useState('description');

  return (
    <div className="border-t border-border-default">
      {/* Tab bar */}
      <div className="sticky top-[72px] z-10 bg-bg-surface/95 backdrop-blur-sm border-b border-border-default">
        <div className="w-full max-w-[1160px] mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto scrollbar-none py-1">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActive(tab.id)}
                className={`px-5 py-3 text-sm font-bold whitespace-nowrap cursor-pointer border-none bg-transparent transition-all duration-200 relative ${
                  active === tab.id
                    ? 'text-accent-yellow'
                    : 'text-text-muted hover:text-text-secondary'
                }`}>
                {tab.label}
                {active === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 grad-bg rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="w-full max-w-[1160px] mx-auto px-6 py-10">
        {active === 'description' && (
          <div className="max-w-[760px]">
            {product.description ? (
                <div
                    className="text-text-secondary leading-[2] text-[0.9rem] prose-description"
                    dangerouslySetInnerHTML={{__html: product.description}}
                />
            ) : (
                <div className="text-center py-16 text-text-muted text-sm">توضیحاتی ثبت نشده است.</div>
            )}
          </div>
        )}
        {active === 'features'    && <FeaturesList  features={product.features} />}
        {active === 'faq'         && <FaqAccordion  faqs={product.faqs} />}
        {active === 'changelog'   && <ChangelogList changelogs={product.changelogs} />}
        {active === 'reviews'     && <ReviewsTabContent productId={product.id} />}
      </div>
    </div>
  );
}

// ── Stats strip (پایین صفحه) ──────────────────────────────────────────────────
function StatsStrip({ stats }) {
  if (!stats?.length) return null;
  return (
    <div className="border-t border-border-default bg-bg-surface">
      <div className="w-full max-w-[1160px] mx-auto px-6 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map(stat => (
            <div key={stat.id}
              className="text-center bg-bg-card border border-border-default rounded-2xl p-6 hover:border-border-accent transition-all duration-300 group">
              {stat.icon && <div className="text-3xl mb-3 group-hover:scale-110 transition-transform inline-block">{stat.icon}</div>}
              <div className="grad-text text-3xl font-black leading-none mb-2">{stat.value}</div>
              <div className="text-text-muted text-xs font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
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
        <div className="w-full max-w-[1160px] mx-auto px-6 py-3 flex items-center gap-2 text-[0.73rem] text-text-muted">
          <button onClick={() => navigate('/')}      className="hover:text-accent-yellow transition-colors cursor-pointer">خانه</button>
          <span className="opacity-40">/</span>
          <button onClick={() => navigate('/shop')}  className="hover:text-accent-yellow transition-colors cursor-pointer">فروشگاه</button>
          <span className="opacity-40">/</span>
          <span className="text-text-secondary font-medium">{product.name}</span>
        </div>
      </div>

      {/* ── Hero: image + buy panel ── */}
      <div className="w-full max-w-[1160px] mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 items-start">

        {/* Left — product visual */}
        <div className="reveal flex flex-col gap-4">
          <div className={`${product.thumbClass} aspect-[16/10] rounded-2xl flex items-center justify-center relative overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.55)]`}>
            <div className="absolute inset-0 hero-grid-bg opacity-25" />
            <div className="flex flex-col items-center gap-4 relative z-10">
              <div className="text-[7rem] drop-shadow-lg leading-none">{product.icon}</div>
              <div className="text-sm font-semibold text-white/50 tracking-widest uppercase">{product.thumbLabel}</div>
            </div>
            {product.badge && (
              <div className="absolute top-4 right-4 grad-bg text-[#111] text-xs font-black px-3 py-1.5 rounded-full shadow-lg">
                {product.badge}
              </div>
            )}
          </div>

          {/* Tags */}
          {product.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map(tag => (
                <span key={tag}
                  className="text-[0.72rem] px-3 py-1.5 bg-bg-card border border-border-default rounded-full text-text-secondary hover:border-border-accent hover:text-accent-yellow transition-colors cursor-default">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Quick features grid */}
          <div className="grid grid-cols-2 gap-2 mt-1">
            {[
              { icon: '⚡', label: 'دانلود فوری پس از خرید' },
              { icon: '🛡️', label: 'پشتیبانی ۳۰ روزه' },
              { icon: '🔄', label: 'آپدیت رایگان' },
              { icon: '📖', label: 'مستندات کامل' },
            ].map(f => (
              <div key={f.label}
                className="flex items-center gap-2.5 bg-bg-card border border-border-default rounded-xl px-3 py-3 text-[0.78rem] text-text-secondary">
                <span>{f.icon}</span>
                {f.label}
              </div>
            ))}
          </div>
        </div>

        {/* Right — sticky buy panel */}
        <div className="reveal reveal-delay-1 lg:sticky lg:top-[90px] flex flex-col gap-0 bg-bg-card border border-border-accent/30 rounded-2xl overflow-hidden shadow-[0_12px_48px_rgba(0,0,0,0.45),0_0_0_1px_rgba(245,197,24,0.08)]">

          {/* Accent top bar */}
          <div className="h-1 w-full grad-bg" />

          {/* Panel header */}
          <div className="px-6 pt-5 pb-5 border-b border-border-default">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[0.65rem] font-bold text-accent-yellow tracking-[0.12em] uppercase bg-accent-yellow/10 px-2.5 py-1 rounded-full">
                {product.category}
              </span>
            </div>
            <h1 className="text-[1.35rem] font-black text-text-primary leading-[1.3] mb-2">
              {product.name}
            </h1>
            {product.sub && (
              <p className="text-text-muted text-[0.83rem] leading-relaxed">{product.sub}</p>
            )}
            {(product.rating > 0 || product.reviewCount > 0) && (
              <div className="mt-3">
                <Stars rating={product.rating} count={product.reviewCount} />
              </div>
            )}
          </div>

          {/* Price + actions */}
          <div className="px-6 py-5 flex flex-col gap-4">
            {/* Price */}
            <div className="flex items-end gap-2 bg-bg-base rounded-xl px-4 py-3 border border-border-default">
              <div className="grad-text text-[2.1rem] font-black leading-none">{product.price}</div>
              <div className="text-text-muted text-sm pb-0.5">تومان</div>
              {product.comparePrice && (
                <div className="text-text-muted text-sm pb-0.5 line-through mr-auto">
                  {Number(product.comparePrice).toLocaleString('fa-IR')}
                </div>
              )}
            </div>

            {isOutStock ? (
              <div className="text-center py-3.5 text-text-muted text-sm border border-border-default rounded-xl bg-bg-base">
                موجودی تمام شد
              </div>
            ) : (
              <>
                {/* Qty */}
                <div className="flex items-center justify-between">
                  <span className="text-text-muted text-sm">تعداد:</span>
                  <div className="flex items-center gap-0 bg-bg-base border border-border-default rounded-xl overflow-hidden">
                    <button onClick={() => setQty(q => Math.max(1, q - 1))}
                      className="w-10 h-10 flex items-center justify-center text-text-secondary hover:text-accent-yellow hover:bg-white/5 transition-colors cursor-pointer text-xl font-bold border-l border-border-default">−</button>
                    <span className="w-12 text-center text-text-primary font-black text-sm">{qty.toLocaleString('fa-IR')}</span>
                    <button onClick={() => setQty(q => q + 1)}
                      className="w-10 h-10 flex items-center justify-center text-text-secondary hover:text-accent-yellow hover:bg-white/5 transition-colors cursor-pointer text-xl font-bold border-r border-border-default">+</button>
                  </div>
                </div>

                {/* Add to cart */}
                <Button variant="primary" onClick={handleAddToCart} className="w-full justify-center py-4 text-base shadow-[0_4px_20px_rgba(245,197,24,0.25)]">
                  {added ? '✓ به سبد اضافه شد' : '🛒 افزودن به سبد خرید'}
                  {!added && <ArrowIcon />}
                </Button>

                {inCart && (
                  <button onClick={() => navigate('/checkout')}
                    className="w-full py-3.5 border border-border-accent text-accent-yellow rounded-xl text-sm font-bold font-vazir hover:bg-[rgba(245,197,24,0.08)] transition-colors cursor-pointer">
                    مشاهده سبد و تسویه حساب ←
                  </button>
                )}
              </>
            )}
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-2 gap-px bg-border-default border-t border-border-default">
            {[
              { icon: '🔒', label: 'پرداخت امن' },
              { icon: '⚡', label: 'تحویل فوری' },
              { icon: '↩️', label: 'ضمانت بازگشت' },
              { icon: '🎧', label: 'پشتیبانی ۲۴/۷' },
            ].map(b => (
              <div key={b.label}
                className="flex items-center gap-2 bg-bg-card px-4 py-3.5 text-[0.73rem] text-text-muted hover:bg-white/[0.02] transition-colors">
                <span className="text-base">{b.icon}</span>{b.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs: توضیحات / امکانات / سوالات / تغییرات / نظرات ── */}
      <ProductTabs product={product} />

      {/* ── Stats (4 کارت پایین صفحه) ── */}
      <StatsStrip stats={product.stats} />

      {/* ── CTA ── */}
      <div className="border-t border-border-default">
        <div className="w-full max-w-[1160px] mx-auto px-6 py-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl grad-bg text-3xl mb-5 shadow-lg">🎯</div>
          <h3 className="text-xl font-black text-text-primary mb-2">پروژه سفارشی دارید؟</h3>
          <p className="text-text-muted max-w-[400px] mx-auto mb-7 text-sm leading-relaxed">
            اگر محصول آماده مناسب نبود، تیم تیزاین دقیقاً آنچه نیاز دارید را می‌سازد.
          </p>
          <Button variant="outline" onClick={() => navigate('/order')}>ثبت پروژه سفارشی <ArrowIcon /></Button>
        </div>
      </div>

    </div>
  );
}