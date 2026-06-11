// src/pages/AboutPage.jsx
import { useScrollReveal } from '../hooks/useScrollReveal';
import SectionLabel from '../components/ui/SectionLabel';
import Button from '../components/ui/Button';
import ArrowIcon from '../components/ui/ArrowIcon';

const TEAM = [
  { name: 'علی رضایی', role: 'مدیر و توسعه‌دهنده ارشد', icon: '👨‍💻', skills: ['React', 'Node.js', 'UI/UX'] },
  { name: 'سارا محمدی', role: 'طراح UI/UX', icon: '🎨', skills: ['Figma', 'طراحی برند', 'موشن'] },
  { name: 'محمد احمدی', role: 'متخصص سئو و محتوا', icon: '📈', skills: ['SEO', 'محتوا', 'آنالیتیکس'] },
];

const VALUES = [
  { icon: '🎯', title: 'کیفیت اول', desc: 'هر پروژه را مثل پروژه خودمان می‌سازیم.' },
  { icon: '⚡', title: 'تحویل به موقع', desc: 'به تعهداتمان پایبندیم و زودتر از موعد تحویل می‌دهیم.' },
  { icon: '💬', title: 'ارتباط شفاف', desc: 'در هر مرحله با شما در ارتباطیم و آپدیت می‌دهیم.' },
  { icon: '🔄', title: 'پشتیبانی واقعی', desc: 'بعد از تحویل هم کنارتان هستیم.' },
];

export default function AboutPage() {
  useScrollReveal();
  const navTo = (path) => (e) => { e.preventDefault(); window.history.pushState({}, '', path); window.dispatchEvent(new PopStateEvent('popstate')); window.scrollTo({ top: 0 }); };

  return (
    <div className="min-h-screen pt-[72px]">
      {/* Hero */}
      <div className="relative bg-bg-surface border-b border-border-default py-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-[500px] h-[500px] top-1/2 right-0 -translate-y-1/2 bg-[rgba(245,197,24,0.07)] blur-[100px]" />
          <div className="hero-grid-bg absolute inset-0" />
        </div>
        <div className="relative z-[2] w-full max-w-[1200px] mx-auto px-6 text-center">
          <SectionLabel className="justify-center">درباره ما</SectionLabel>
          <h1 className="text-[clamp(2rem,4vw,3.2rem)] font-black mb-5 leading-[1.3]">
            تیمی که برای <span className="grad-text">کسب‌وکار شما</span><br />واقعاً اهمیت می‌دهد
          </h1>
          <p className="text-text-secondary max-w-[560px] mx-auto text-[1.05rem] leading-[1.8]">
            تیزاین (Tesign) یک آژانس دیجیتال فارسی‌زبان است که تخصصش ساخت وب‌سایت‌های حرفه‌ای، طراحی UI/UX و راهکارهای دیجیتال سفارشی برای کسب‌وکارهای ایرانی است.
          </p>
        </div>
      </div>

      <div className="w-full max-w-[1200px] mx-auto px-6 py-16">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {[
            { num: '+۱۲۰', label: 'پروژه موفق' },
            { num: '+۵۰',  label: 'مشتری راضی' },
            { num: '۵ ⭐', label: 'میانگین رتبه' },
            { num: '+۳',   label: 'سال تجربه' },
          ].map(s => (
            <div key={s.label} className="reveal bg-bg-card border border-border-default rounded-xl p-6 text-center">
              <div className="grad-text text-[2rem] font-black mb-1">{s.num}</div>
              <div className="text-[0.82rem] text-text-muted">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Story */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <div className="reveal">
            <SectionLabel>داستان ما</SectionLabel>
            <h2 className="text-[clamp(1.6rem,3vw,2.2rem)] font-black mb-4 leading-[1.3]">
              از ایده تا <span className="grad-text">واقعیت</span>
            </h2>
            <p className="text-text-secondary leading-[1.9] mb-4">
              تیزاین با هدف ارائه خدمات طراحی و توسعه وب با کیفیت بین‌المللی به کسب‌وکارهای ایرانی شکل گرفت. می‌دانستیم که خیلی از صاحبان کسب‌وکار با آژانس‌هایی روبرو شده‌اند که یا کیفیت کافی ندارند یا ارتباط درستی برقرار نمی‌کنند.
            </p>
            <p className="text-text-secondary leading-[1.9] mb-6">
              ما با ترکیب تجربه فنی بالا، طراحی خلاقانه و ارتباط شفاف، این شکاف را پر می‌کنیم. هر پروژه را مثل پروژه خودمان می‌بینیم.
            </p>
            <div className="flex gap-3">
              <Button href="/order" onClick={navTo('/order')} variant="primary">شروع پروژه <ArrowIcon /></Button>
              <Button href="/services" onClick={navTo('/services')} variant="outline">خدمات ما</Button>
            </div>
          </div>
          <div className="reveal reveal-delay-1 relative">
            <div className="bg-bg-card border border-border-default rounded-xl p-8">
              <div className="text-[3rem] mb-4">🏆</div>
              <blockquote className="text-[1.05rem] text-text-secondary leading-[1.9] italic border-r-2 border-accent-yellow pr-4">
                "بهترین سرمایه‌گذاری یک کسب‌وکار، حضور دیجیتال قوی است. ما اینجاییم تا مطمئن شویم این سرمایه‌گذاری ارزش واقعی دارد."
              </blockquote>
              <div className="mt-4 text-[0.85rem] font-bold text-text-primary">— تیم تیزاین</div>
            </div>
          </div>
        </div>

        {/* Values */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <SectionLabel className="justify-center">ارزش‌های ما</SectionLabel>
            <h2 className="text-[clamp(1.6rem,3vw,2.2rem)] font-black">چرا تیزاین؟</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((v, i) => (
              <div key={i} className={`reveal reveal-delay-${i} bg-bg-card border border-border-default rounded-xl p-6`}>
                <div className="text-3xl mb-3">{v.icon}</div>
                <h4 className="font-black text-text-primary mb-2">{v.title}</h4>
                <p className="text-[0.82rem] text-text-muted leading-[1.7]">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <SectionLabel className="justify-center">تیم ما</SectionLabel>
            <h2 className="text-[clamp(1.6rem,3vw,2.2rem)] font-black">پشت پرده تیزاین</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {TEAM.map((m, i) => (
              <div key={i} className={`reveal reveal-delay-${i} bg-bg-card border border-border-default rounded-xl p-7 text-center`}>
                <div className="text-5xl mb-4">{m.icon}</div>
                <h4 className="text-[1rem] font-black text-text-primary mb-1">{m.name}</h4>
                <div className="text-[0.78rem] text-accent-yellow mb-4">{m.role}</div>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {m.skills.map(s => (
                    <span key={s} className="text-[0.68rem] px-2.5 py-1 bg-white/5 rounded-full text-text-muted border border-border-default">{s}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact CTA */}
        <div className="bg-bg-card border border-border-default rounded-xl p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,197,24,0.07)_0%,transparent_65%)] pointer-events-none" />
          <div className="relative z-[1]">
            <div className="text-4xl mb-4">👋</div>
            <h3 className="text-[1.8rem] font-black mb-3">بیاید با هم کار کنیم</h3>
            <p className="text-text-secondary max-w-[400px] mx-auto mb-8">آماده‌ایم پروژه‌تان را از ایده تا اجرا همراهی کنیم.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button href="/order" onClick={navTo('/order')} variant="primary" className="px-8">ثبت سفارش <ArrowIcon /></Button>
              <a href="https://t.me/tesign_dev" target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 px-7 py-[13px] rounded-md text-[0.95rem] font-bold bg-transparent text-text-primary border border-border-accent hover:bg-[rgba(245,197,24,0.08)] transition-all duration-300 no-underline">
                💬 تلگرام
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}