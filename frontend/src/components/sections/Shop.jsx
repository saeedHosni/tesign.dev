// src/components/sections/Shop.jsx
// کارت محصول → navigate به /product/:slug
import SectionLabel from '../ui/SectionLabel';
import Button from '../ui/Button';
import { useProducts } from '../../hooks/useProducts';

function navigate(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0 });
}

function ProductCard({ product }) {
  const handleClick = () => {
    if (product.slug) navigate(`/product/${product.slug}`);
  };

  return (
    <div
      onClick={handleClick}
      className={`reveal${product.delay ? ` ${product.delay}` : ''} bg-bg-card border border-border-default rounded-lg overflow-hidden transition-all duration-300 ease-[cubic-bezier(.4,0,.2,1)] hover:border-border-accent hover:-translate-y-1.5 hover:shadow-[0_16px_48px_rgba(0,0,0,0.4)] cursor-pointer group`}
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
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
          <span className="text-[0.8rem] font-bold text-white bg-white/10 backdrop-blur-sm px-4 py-2 rounded-md border border-white/20">
            مشاهده محصول
          </span>
        </div>
      </div>
      <div className="p-5">
        <div className="text-[0.7rem] font-bold text-accent-yellow tracking-[0.08em] uppercase mb-1.5">
          {product.category}
        </div>
        <div className="text-[1rem] font-black text-text-primary mb-1.5">{product.name}</div>
        <div className="text-[0.8rem] text-text-muted mb-4">{product.sub}</div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="grad-text text-[1.1rem] font-black">{product.price}</div>
            <div className="text-[0.65rem] text-text-muted">تومان</div>
          </div>
          <button
            onClick={e => { e.stopPropagation(); handleClick(); }}
            className="flex items-center gap-1.5 bg-[rgba(245,197,24,0.1)] border border-border-accent text-accent-yellow px-4 py-2 rounded-sm text-[0.8rem] font-bold font-vazir cursor-pointer transition-all duration-300 hover:grad-bg hover:border-transparent hover:text-[#111] hover:scale-[1.03]">
            🛒 خرید
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductCardSkeleton() {
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

export default function Shop() {
  const { products, loading } = useProducts({ limit: 4 });
  const navToShop = (e) => {
    e.preventDefault();
    navigate('/shop');
  };

  return (
    <section id="shop" className="shop-section py-24 bg-bg-surface relative overflow-hidden">
      <div className="w-full max-w-[1200px] mx-auto px-6">
        <div className="flex justify-between items-end mb-14 flex-wrap gap-6">
          <div>
            <SectionLabel>فروشگاه دیجیتال</SectionLabel>
            <h2 className="text-[clamp(1.9rem,4vw,2.8rem)] font-black leading-[1.3] text-text-primary">
              محصولات آماده<br /><span className="grad-text">تحویل فوری</span>
            </h2>
            <p className="mt-3.5 text-[1rem] text-text-secondary max-w-[520px]">
              قالب‌ها و طرح‌های آماده‌ای که بلافاصله پس از خرید دریافت می‌کنید.
            </p>
          </div>
          <Button href="/shop" onClick={navToShop} variant="outline" className="hidden sm:inline-flex">
            مشاهده همه محصولات
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : products.slice(0, 4).map((product) => (
                <ProductCard key={product.id || product.name} product={product} />
              ))
          }
        </div>
      </div>
    </section>
  );
}
