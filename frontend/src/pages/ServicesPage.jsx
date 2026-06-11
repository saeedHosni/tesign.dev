// src/pages/ServicesPage.jsx
import SectionLabel from '../components/ui/SectionLabel';
import Button from '../components/ui/Button';
import ArrowIcon from '../components/ui/ArrowIcon';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useServices } from '../hooks/useServices';

function ServiceCard({ service, index }) {
  const nav = (e) => { e.preventDefault(); window.history.pushState({}, '', '/order'); window.dispatchEvent(new PopStateEvent('popstate')); window.scrollTo({ top: 0 }); };
  return (
    <div className={`reveal reveal-delay-${index % 3} bg-bg-card border border-border-default rounded-xl p-8 relative overflow-hidden transition-all duration-300 hover:border-border-accent hover:-translate-y-1.5 hover:shadow-[0_16px_48px_rgba(0,0,0,0.4),0_0_40px_rgba(245,197,24,0.15)]`}>
      <div className="w-[64px] h-[64px] rounded-[14px] bg-[rgba(245,197,24,0.1)] border border-[rgba(245,197,24,0.2)] grid place-items-center text-[1.8rem] mb-6">{service.icon}</div>
      <div className="text-[0.72rem] font-bold tracking-[0.1em] text-accent-yellow uppercase mb-2">{service.cat}</div>
      <h3 className="text-[1.3rem] font-black text-text-primary mb-3">{service.title}</h3>
      <p className="text-[0.88rem] text-text-secondary leading-[1.8] mb-5">{service.desc}</p>
      <ul className="flex flex-col gap-2 list-none p-0 m-0 mb-5">
        {service.items.map((item) => (
          <li key={item} className="service-item-check text-[0.82rem] text-text-secondary">{item}</li>
        ))}
      </ul>
      {service.price && (
        <div className="flex items-center gap-2 mb-5 py-3 px-4 bg-[rgba(245,197,24,0.06)] rounded-lg border border-border-accent/50">
          <span className="text-[0.72rem] text-text-muted">قیمت:</span>
          <span className="grad-text text-[0.9rem] font-black">{service.price}</span>
        </div>
      )}
      <a href="/order" onClick={nav}
        className="inline-flex items-center gap-1.5 text-[0.85rem] font-bold text-accent-yellow no-underline transition-all duration-300 hover:gap-2.5">
        {service.linkLabel} <ArrowIcon size={14} />
      </a>
    </div>
  );
}

export default function ServicesPage() {
  useScrollReveal();
  const { services, loading } = useServices();

  const nav = (e) => { e.preventDefault(); window.history.pushState({}, '', '/order'); window.dispatchEvent(new PopStateEvent('popstate')); window.scrollTo({ top: 0 }); };

  return (
    <div className="min-h-screen pt-[72px]">
      {/* Header */}
      <div className="relative bg-bg-surface border-b border-border-default py-14 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-[400px] h-[400px] -top-[80px] -right-[60px] bg-[rgba(245,197,24,0.07)] blur-[80px]" />
          <div className="hero-grid-bg absolute inset-0" />
        </div>
        <div className="relative z-[2] w-full max-w-[1200px] mx-auto px-6">
          <SectionLabel>خدمات ما</SectionLabel>
          <h1 className="text-[clamp(2rem,4vw,3rem)] font-black mb-3 leading-[1.3]">
            راهکار دیجیتال <span className="grad-text">کامل</span>
          </h1>
          <p className="text-text-secondary max-w-[500px]">از ایده تا اجرا، هر آنچه برای حضور قدرتمند در فضای دیجیتال نیاز دارید.</p>
        </div>
      </div>

      {/* Services grid */}
      <div className="w-full max-w-[1200px] mx-auto px-6 py-16">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-bg-card border border-border-default rounded-xl p-8 animate-pulse">
                <div className="w-16 h-16 bg-white/5 rounded-[14px] mb-6" />
                <div className="h-4 w-24 bg-white/5 rounded mb-3" />
                <div className="h-6 w-3/4 bg-white/5 rounded mb-3" />
                <div className="h-16 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, i) => <ServiceCard key={service.id || service.title} service={service} index={i} />)}
          </div>
        )}

        {/* Process steps */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <SectionLabel className="justify-center">فرآیند کار</SectionLabel>
            <h2 className="text-[clamp(1.6rem,3vw,2.4rem)] font-black">چطور کار می‌کنیم؟</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '۱', icon: '💬', title: 'مشاوره رایگان', desc: 'جزئیات پروژه را با ما در میان بگذارید.' },
              { step: '۲', icon: '📋', title: 'پروپوزال', desc: 'پیشنهاد قیمت و زمانبندی مشخص دریافت می‌کنید.' },
              { step: '۳', icon: '🛠️', title: 'اجرا', desc: 'تیم ما با شفافیت کامل پروژه را پیش می‌برد.' },
              { step: '۴', icon: '🚀', title: 'تحویل', desc: 'پروژه آماده، آموزش‌دیده و با پشتیبانی تحویل می‌گیرید.' },
            ].map((item, i) => (
              <div key={i} className="reveal bg-bg-card border border-border-default rounded-xl p-6 text-center">
                <div className="w-10 h-10 rounded-full grad-bg text-[#111] text-[0.85rem] font-black grid place-items-center mx-auto mb-4">{item.step}</div>
                <div className="text-2xl mb-3">{item.icon}</div>
                <h4 className="font-black text-text-primary mb-2">{item.title}</h4>
                <p className="text-[0.82rem] text-text-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Button href="/order" onClick={nav} variant="primary" className="text-base px-10 py-4">
            همین حالا سفارش بده <ArrowIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}