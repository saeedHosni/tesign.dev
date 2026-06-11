// src/pages/ShopPage.jsx
import { useState } from 'react';
import SectionLabel from '../components/ui/SectionLabel';
import Button from '../components/ui/Button';
import ArrowIcon from '../components/ui/ArrowIcon';
import { useProducts } from '../hooks/useProducts';
import { useCart } from '../context/CartContext';
import { PRODUCT_CATEGORIES } from '../data/siteData';
import { useScrollReveal } from '../hooks/useScrollReveal';

function navigate(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0 });
}

// ── Product Card ──────────────────────────────────────────────────────────────

function ProductCard({ product }) {
  const { addItem, items } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const inCart = items.some(i => i.id === product.id);

  function handleAdd(e) {
    e.stopPropagation();
    addItem(product, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  }

  return (
    <div
      onClick={() => product.slug && navigate(`/product/${product.slug}`)}
      className="reveal bg-bg-card border border-border-default rounded-lg overflow-hidden transition-all duration-300 hover:border-border-accent hover:-translate-y-1.5 hover:shadow-[0_16px_48px_rgba(0,0,0,0.4)] group cursor-pointer"
    >
      <div className={`${product.thumbClass} aspect-[16/10] relative flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-2">
          <div className="text-[2.5rem]">{product.icon}</div>
          <div className="text-[0.7rem] text-text-muted font-semibold">{product.thumbLabel}</div>
        </div>
        {product.badge && (
          <div className="absolute top-3 right-3 grad-bg text-[#111] text-[0.65rem] font-black px-2.5 py-[3px] rounded-full">
            {product.badge}
          </div>
        )}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
          <span className="text-[0.8rem] font-bold text-white bg-white/10 backdrop-blur-sm px-4 py-2 rounded-md border border-white/20">
            مشاهده جزئیات
          </span>
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="text-[0.68rem] font-bold text-accent-yellow tracking-[0.08em] uppercase">
            {product.category}
          </div>
        </div>
        {product.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {product.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[0.62rem] px-2 py-0.5 bg-white/5 rounded-full text-text-muted">
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="text-[1rem] font-black text-text-primary mb-1.5">{product.name}</div>
        <div className="text-[0.8rem] text-text-muted mb-4">{product.sub}</div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="grad-text text-[1.1rem] font-black">{product.price}</div>
            <div className="text-[0.65rem] text-text-muted">تومان</div>
          </div>
          <button
            onClick={handleAdd}
            className={`flex items-center gap-1.5 border px-4 py-2 rounded-sm text-[0.8rem] font-bold font-vazir cursor-pointer transition-all duration-300 hover:scale-[1.03]
              ${justAdded || inCart
                ? 'bg-green-500/10 border-green-500/40 text-green-400'
                : 'bg-[rgba(245,197,24,0.1)] border-border-accent text-accent-yellow hover:grad-bg hover:border-transparent hover:text-[#111]'
              }`}
          >
            {justAdded ? '✓ اضافه شد' : inCart ? '✓ در سبد' : '🛒 خرید'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-bg-card border border-border-default rounded-lg overflow-hidden animate-pulse">
      <div className="aspect-[16/10] bg-white/5" />
      <div className="p-5 flex flex-col gap-3">
        <div className="h-2.5 w-20 bg-white/5 rounded" />
        <div className="h-4 w-3/4 bg-white/5 rounded" />
        <div className="h-2.5 w-full bg-white/5 rounded" />
        <div className="flex justify-between items-center mt-1">
          <div className="h-5 w-16 bg-white/5 rounded" />
          <div className="h-8 w-16 bg-white/5 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const { products, loading } = useProducts({ limit: 20 });
  const { totalItems } = useCart();
  useScrollReveal();

  const filtered = products.filter(p => {
    const matchCat    = activeCategory === 'all' || p.category === activeCategory;
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sub?.toLowerCase().includes(search.toLowerCase()) ||
      p.tags?.some(t => t.includes(search));
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen pt-[72px]">

      {/* Header */}
      <div className="relative bg-bg-surface border-b border-border-default py-14 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-[500px] h-[500px] -top-[100px] -left-[80px] bg-[rgba(245,197,24,0.07)] blur-[80px]" />
          <div className="hero-grid-bg absolute inset-0" />
        </div>
        <div className="relative z-[2] w-full max-w-[1200px] mx-auto px-6 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <SectionLabel>فروشگاه دیجیتال</SectionLabel>
            <h1 className="text-[clamp(2rem,4vw,3rem)] font-black mb-3 leading-[1.3]">
              محصولات <span className="grad-text">آماده تحویل</span>
            </h1>
            <p className="text-text-secondary max-w-[500px]">
              قالب‌های وردپرس، طرح‌های فیگما و کیت‌های UI که بلافاصله پس از خرید دریافت می‌کنید.
            </p>
          </div>
          {/* Cart badge */}
          {totalItems > 0 && (
            <button
              onClick={() => navigate('/checkout')}
              className="flex items-center gap-2 grad-bg text-[#111] px-5 py-2.5 rounded-sm font-black text-sm cursor-pointer hover:shadow-[0_0_24px_rgba(245,197,24,0.4)] transition-all">
              🛒 سبد خرید ({totalItems.toLocaleString('fa-IR')}) <ArrowIcon />
            </button>
          )}
        </div>
      </div>

      <div className="w-full max-w-[1200px] mx-auto px-6 py-12">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div className="flex flex-wrap gap-2">
            {PRODUCT_CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-[0.82rem] font-semibold border transition-all duration-200 cursor-pointer
                  ${activeCategory === cat.id
                    ? 'grad-bg text-[#111] border-transparent'
                    : 'bg-white/5 border-border-default text-text-secondary hover:border-border-accent'}`}>
                {cat.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="جستجو در محصولات..." dir="rtl"
              className="bg-bg-surface border border-border-default rounded-lg px-4 py-2.5 text-[0.85rem] font-vazir text-text-primary outline-none w-[220px] transition-all duration-300 focus:border-accent-yellow focus:w-[260px]" />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[0.85rem]">🔍</span>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
            : filtered.map(product => (
              <ProductCard key={product.id || product.name} product={product} />
            ))
          }
        </div>

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-[1.2rem] font-black text-text-primary mb-2">نتیجه‌ای یافت نشد</h3>
            <p className="text-text-muted">جستجوی دیگری را امتحان کنید یا فیلتر را بردارید.</p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 bg-bg-card border border-border-default rounded-xl p-10 text-center relative overflow-hidden">
          <div className="absolute w-[400px] h-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle,rgba(245,197,24,0.07)_0%,transparent_70%)] pointer-events-none" />
          <div className="relative z-[1]">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-[1.5rem] font-black text-text-primary mb-3">محصول مناسب پیدا نکردید؟</h3>
            <p className="text-text-secondary max-w-[420px] mx-auto mb-6">
              پروژه سفارشی خود را ثبت کنید. تیم دیجی‌تیم دقیقاً آنچه نیاز دارید را می‌سازد.
            </p>
            <Button
              href="/order"
              onClick={(e) => { e.preventDefault(); navigate('/order'); }}
              variant="primary">
              ثبت سفارش سفارشی <ArrowIcon />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
