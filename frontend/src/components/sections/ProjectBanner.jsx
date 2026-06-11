// src/components/sections/ProjectBanner.jsx
import { useState } from 'react';
import SectionLabel from '../ui/SectionLabel';
import Button from '../ui/Button';
import ArrowIcon from '../ui/ArrowIcon';
import { BANNER_FEATURES } from '../../data/siteData';
import { projectApi } from '../../services/api';

export default function ProjectBanner() {
  const [value, setValue]       = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(false);
  const [apiError, setApiError] = useState('');

  const handleSubmit = async () => {
    setApiError('');
    if (!value.trim()) { setError(true); setTimeout(() => setError(false), 1500); return; }
    const isEmail = value.includes('@');
    const payload = { source: 'banner', ...(isEmail ? { email: value.trim() } : { phone: value.trim() }) };
    setLoading(true);
    try {
      await projectApi.submitSimple(payload);
      setSubmitted(true); setValue('');
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      setApiError(err.message || 'خطا در ارسال. دوباره تلاش کنید.');
    } finally { setLoading(false); }
  };

  const handleNav = (e) => {
    e.preventDefault();
    window.history.pushState({}, '', '/order');
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section id="project" className="py-24 bg-bg-base">
      <div className="w-full max-w-[1200px] mx-auto px-6">
        <div className="reveal bg-bg-card border border-border-default rounded-xl p-[72px_60px] max-sm:p-12 max-sm:px-7 relative overflow-hidden text-center">
          <div className="absolute w-[600px] h-[600px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle,rgba(245,197,24,0.08)_0%,transparent_70%)] pointer-events-none" />

          <SectionLabel className="justify-center">ثبت سفارش</SectionLabel>

          <h2 className="text-[clamp(1.8rem,4vw,2.6rem)] font-black leading-[1.3] mb-4 relative z-[1]">
            پروژه‌ای در ذهن دارید؟<br />
            <span className="grad-text">ما آن را به واقعیت تبدیل می‌کنیم</span>
          </h2>

          <p className="text-[1rem] text-text-secondary max-w-[520px] mx-auto mb-8 leading-[1.8] relative z-[1]">
            ایمیل یا شماره‌تان را بگذارید تا تماس بگیریم — یا فرم کامل ثبت سفارش را پر کنید و یک تخمین قیمت بگیرید.
          </p>

          <div className="flex gap-3 max-w-[520px] mx-auto flex-wrap relative z-[1]">
            <input type="text" value={value} onChange={e => setValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="ایمیل یا شماره تماس شما" dir="rtl"
              disabled={loading || submitted}
              className={`flex-1 min-w-[200px] bg-bg-surface border rounded-md px-[18px] py-3.5 text-[0.9rem] font-vazir text-text-primary outline-none transition-all duration-300 focus:bg-[rgba(245,197,24,0.04)] focus:border-accent-yellow disabled:opacity-60
                ${error ? 'border-accent-orange' : 'border-border-default'}`} />
            <Button variant="primary" onClick={handleSubmit} disabled={submitted || loading}
              className={submitted ? '!bg-[#28C840] !from-[#28C840] !to-[#20a030]' : ''}>
              {loading ? 'در حال ارسال...' : submitted ? '✓ ثبت شد!' : (<>تماس بگیرید <ArrowIcon /></>)}
            </Button>
          </div>

          {apiError && <p className="mt-3 text-[0.82rem] text-accent-orange relative z-[1]">{apiError}</p>}

          <div className="flex justify-center gap-4 flex-wrap mt-8 relative z-[1]">
            <a href="/order" onClick={handleNav}
              className="inline-flex items-center gap-2 bg-[rgba(245,197,24,0.08)] border border-border-accent text-accent-yellow px-6 py-3 rounded-md text-[0.9rem] font-bold no-underline transition-all duration-300 hover:bg-[rgba(245,197,24,0.15)] hover:-translate-y-0.5">
              📋 فرم کامل ثبت سفارش + تخمین قیمت <ArrowIcon />
            </a>
          </div>

          <div className="flex justify-center gap-8 flex-wrap mt-8 relative z-[1]">
            {BANNER_FEATURES.map(f => (
              <div key={f.label} className="flex items-center gap-2 text-[0.82rem] text-text-muted">
                <div className="w-[22px] h-[22px] bg-[rgba(245,197,24,0.1)] rounded-full grid place-items-center text-[0.65rem] text-accent-yellow">{f.icon}</div>
                {f.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}