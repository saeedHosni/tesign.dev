// src/components/sections/Services.jsx
import SectionLabel from '../ui/SectionLabel';
import Button from '../ui/Button';
import ArrowIcon from '../ui/ArrowIcon';
import { useServices } from '../../hooks/useServices';

function ServiceCard({ service, delay = 0 }) {
  const navOrder = (e) => { e.preventDefault(); window.history.pushState({}, '', '/order'); window.dispatchEvent(new PopStateEvent('popstate')); window.scrollTo({ top: 0 }); };
  return (
    <div className={`reveal${delay ? ` reveal-delay-${delay}` : ''} bg-bg-card border border-border-default rounded-lg p-7 relative overflow-hidden transition-all duration-300 ease-[cubic-bezier(.4,0,.2,1)] cursor-default hover:border-border-accent hover:-translate-y-1.5 hover:shadow-[0_16px_48px_rgba(0,0,0,0.4),0_0_40px_rgba(245,197,24,0.15)]`}>
      <div className="w-[60px] h-[60px] rounded-[14px] bg-[rgba(245,197,24,0.1)] border border-[rgba(245,197,24,0.2)] grid place-items-center text-[1.6rem] mb-6">{service.icon}</div>
      <div className="text-[0.72rem] font-bold tracking-[0.1em] text-accent-yellow uppercase mb-2.5">{service.cat}</div>
      <h3 className="text-[1.25rem] font-black text-text-primary mb-3">{service.title}</h3>
      <p className="text-[0.88rem] text-text-secondary leading-[1.8]">{service.desc}</p>
      <ul className="mt-5 flex flex-col gap-2 p-0 list-none">
        {service.items.map(item => (
          <li key={item} className="service-item-check text-[0.82rem] text-text-secondary">{item}</li>
        ))}
      </ul>
      <a href="/order" onClick={navOrder}
        className="inline-flex items-center gap-1.5 mt-6 text-[0.85rem] font-bold text-accent-yellow no-underline transition-all duration-300 hover:gap-2.5">
        {service.linkLabel} <ArrowIcon size={14} />
      </a>
    </div>
  );
}

export default function Services() {
  const { services, loading } = useServices();
  const navServices = (e) => { e.preventDefault(); window.history.pushState({}, '', '/services'); window.dispatchEvent(new PopStateEvent('popstate')); window.scrollTo({ top: 0 }); };

  return (
    <section id="services" className="py-24 bg-bg-base">
      <div className="w-full max-w-[1200px] mx-auto px-6">
        <div className="flex justify-between items-end mb-14 flex-wrap gap-6">
          <div>
            <SectionLabel>خدمات ما</SectionLabel>
            <h2 className="text-[clamp(1.9rem,4vw,2.8rem)] font-black leading-[1.3] text-text-primary">
              راهکار دیجیتال<br /><span className="grad-text">کامل برای کسب‌وکار شما</span>
            </h2>
            <p className="mt-3.5 text-[1rem] text-text-secondary max-w-[520px]">از ایده تا اجرا، هر آنچه برای حضور قدرتمند در فضای دیجیتال نیاز دارید.</p>
          </div>
          <Button href="/services" onClick={navServices} variant="outline" className="hidden md:inline-flex">مشاهده همه خدمات</Button>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({length:3}).map((_,i) => (
              <div key={i} className="bg-bg-card border border-border-default rounded-lg p-7 animate-pulse">
                <div className="w-15 h-15 bg-white/5 rounded-[14px] mb-6 w-[60px] h-[60px]" />
                <div className="h-3 w-16 bg-white/5 rounded mb-3" />
                <div className="h-5 w-3/4 bg-white/5 rounded mb-3" />
                <div className="h-14 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, i) => <ServiceCard key={service.id || service.title} service={service} delay={i} />)}
          </div>
        )}
      </div>
    </section>
  );
}