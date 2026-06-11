// src/components/sections/Hero.jsx
import Button from '../ui/Button';
import ArrowIcon from '../ui/ArrowIcon';
import { useCounter } from '../../hooks/useCounter';

function StatItem({ num, staticVal, label }) {
  const { count, ref } = useCounter(num);
  return (
    <div ref={ref}>
      <div className="grad-text text-[1.7rem] font-black">
        {staticVal ?? `+${count}`}
      </div>
      <div className="text-[0.78rem] text-text-muted mt-0.5">{label}</div>
    </div>
  );
}

function HeroMockup() {
  return (
    <div className="relative animate-fade-in">
      {/* Browser window */}
      <div className="bg-bg-card border border-border-default rounded-lg overflow-hidden shadow-[0_4px_32px_rgba(0,0,0,0.45),0_0_40px_rgba(245,197,24,0.15)] animate-float">
        {/* Bar */}
        <div className="bg-bg-surface px-[18px] py-3.5 flex items-center gap-2 border-b border-border-default">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
          <div dir="ltr" className="flex-1 mx-3 bg-white/5 rounded-[6px] h-[26px] flex items-center px-2.5 text-[0.7rem] text-text-muted">
            tesign.team
          </div>
        </div>
        {/* Body */}
        <div className="p-6 flex flex-col gap-3.5">
          <div className="bg-gradient-to-br from-[rgba(245,197,24,0.15)] to-[rgba(255,107,53,0.08)] rounded-md h-[140px] flex flex-col items-center justify-center gap-2 border border-border-accent">
            <div className="grad-text text-[0.9rem] font-black">وب‌سایت حرفه‌ای شما</div>
            <div className="text-[0.72rem] text-text-muted">طراحی مدرن · سرعت بالا · SEO</div>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {['🌐', '🎨', '📈'].map((icon) => (
              <div key={icon} className="bg-white/[0.04] border border-border-default rounded-[10px] h-14 grid place-items-center text-2xl">
                {icon}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            {['وردپرس', 'فیگما', 'سئو'].map((pill) => (
              <div key={pill} className="bg-white/5 rounded-full px-3 py-1 text-[0.68rem] text-text-muted font-semibold">
                {pill}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating tag 1 */}
      <div className="absolute -bottom-4 -right-4 flex items-center gap-2.5 bg-bg-card border border-border-default rounded-md px-4 py-3 shadow-[0_4px_32px_rgba(0,0,0,0.45)] animate-float-delayed whitespace-nowrap">
        <div className="w-7 h-7 rounded-[8px] grad-bg grid place-items-center text-[0.8rem] text-[#111]">✓</div>
        <div>
          <div className="text-[0.82rem] font-bold text-text-primary">پروژه تحویل داده شد</div>
          <div className="text-[0.65rem] text-text-muted">۲ روز زودتر از موعد</div>
        </div>
      </div>

      {/* Floating tag 2 */}
      <div className="absolute top-6 -left-8 flex items-center gap-2.5 bg-bg-card border border-border-default rounded-md px-4 py-3 shadow-[0_4px_32px_rgba(0,0,0,0.45)] animate-float-delayed2 whitespace-nowrap">
        <div className="w-7 h-7 rounded-[8px] grad-bg grid place-items-center text-[0.8rem] text-[#111]">🚀</div>
        <div>
          <div className="text-[0.82rem] font-bold text-text-primary">راه‌اندازی موفق</div>
          <div className="text-[0.65rem] text-text-muted">فروشگاه آنلاین</div>
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section id="hero" className="min-h-screen flex items-center relative overflow-hidden pt-[72px]">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[500px] h-[500px] -top-[100px] -right-[100px] bg-[rgba(245,197,24,0.08)] blur-[80px] animate-blob"  />
        <div className="absolute w-[400px] h-[400px] -bottom-[80px] -left-[80px] bg-[rgba(255,107,53,0.06)] blur-[80px] animate-blob-delayed"  />
        <div className="hero-grid-bg absolute inset-0" />
      </div>

      <div className="relative z-[2] w-full max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[60px] items-center">
          {/* Copy */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-[rgba(245,197,24,0.1)] border border-[rgba(245,197,24,0.25)] rounded-full py-1.5 pr-2.5 pl-4 text-[0.8rem] font-semibold text-accent-yellow mb-6 animate-fade-up">
              <div className="w-2 h-2 rounded-full bg-accent-yellow animate-pulse-glow-2" />
              آماده همکاری با شما هستیم
            </div>

            <h1 className="text-[clamp(2.2rem,5vw,3.8rem)] font-black leading-[1.25] tracking-[-0.02em] animate-fade-up-1">
              وب‌سایت و هویت بصری<br />
              <span className="grad-text-animated">که برند شما را</span><br />
              متمایز می‌کند
            </h1>

            <p className="mt-5 text-[1.05rem] text-text-secondary max-w-[460px] leading-[1.8] animate-fade-up-2">
              تیم ما با ترکیب طراحی خلاقانه و توسعه فنی پیشرفته، راهکارهای دیجیتال سفارشی برای کسب‌وکار شما می‌سازد — از صفر تا راه‌اندازی.
            </p>

            <div className="flex gap-3 flex-wrap mt-9 animate-fade-up-3">
              <Button href="#project" variant="primary">سفارش پروژه <ArrowIcon /></Button>
              <Button href="#shop" variant="outline">مشاهده فروشگاه</Button>
            </div>

            <div className="flex gap-8 mt-12 animate-fade-up-4 items-center">
              <StatItem num={120} label="پروژه موفق" />
              <div className="w-px h-10 bg-border-default" />
              <StatItem num={50} label="مشتری راضی" />
              <div className="w-px h-10 bg-border-default" />
              <StatItem staticVal="۵ ⭐" label="میانگین رتبه" />
            </div>
          </div>

          {/* Visual */}
          <div className="hidden md:block">
            <HeroMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
