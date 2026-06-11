// src/pages/OrderPage.jsx
import { useState, useRef } from 'react';
import SectionLabel from '../components/ui/SectionLabel';
import Button from '../components/ui/Button';
import ArrowIcon from '../components/ui/ArrowIcon';
import {
  ORDER_CATEGORIES, BUDGET_OPTIONS, TIMELINE_OPTIONS, PRICE_ESTIMATES
} from '../data/siteData';
import { projectApi } from '../services/api';

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepBar({ current, total }) {
  return (
    <div className="flex items-center gap-2 mb-10">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[0.75rem] font-black transition-all duration-300
            ${i < current ? 'grad-bg text-[#111]' : i === current ? 'bg-[rgba(245,197,24,0.2)] border-2 border-accent-yellow text-accent-yellow' : 'bg-white/5 border border-border-default text-text-muted'}`}>
            {i < current ? '✓' : i + 1}
          </div>
          {i < total - 1 && (
            <div className={`h-[2px] w-8 md:w-16 rounded transition-all duration-500 ${i < current ? 'grad-bg' : 'bg-white/10'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Category card ────────────────────────────────────────────────────────────
function CategoryCard({ cat, selected, onClick }) {
  return (
    <button onClick={() => onClick(cat.id)}
      className={`w-full text-right p-5 rounded-lg border transition-all duration-300 cursor-pointer
        ${selected ? 'border-accent-yellow bg-[rgba(245,197,24,0.08)] shadow-[0_0_20px_rgba(245,197,24,0.12)]' : 'border-border-default bg-bg-card hover:border-border-accent hover:bg-bg-card-hover'}`}>
      <div className="text-2xl mb-2">{cat.icon}</div>
      <div className={`text-[0.95rem] font-black mb-1 ${selected ? 'text-accent-yellow' : 'text-text-primary'}`}>{cat.label}</div>
      <div className="text-[0.78rem] text-text-muted">{cat.description}</div>
      {selected && <div className="mt-2 text-[0.7rem] text-accent-yellow font-bold">✓ انتخاب شده</div>}
    </button>
  );
}

// ─── Subtype pill ─────────────────────────────────────────────────────────────
function SubtypePill({ item, selected, onClick }) {
  return (
    <button onClick={() => onClick(item.id)}
      className={`px-4 py-2 rounded-full border text-[0.82rem] font-semibold transition-all duration-200 cursor-pointer
        ${selected ? 'grad-bg text-[#111] border-transparent' : 'bg-white/5 border-border-default text-text-secondary hover:border-border-accent hover:text-text-primary'}`}>
      {item.label}
    </button>
  );
}

// ─── Price Estimator ──────────────────────────────────────────────────────────
function PriceEstimator({ selectedCategory, selectedSubtypes, budget }) {
  if (!selectedCategory && selectedSubtypes.length === 0) return null;

  // Find best estimate
  let estimate = PRICE_ESTIMATES.default;
  for (const sub of selectedSubtypes) {
    if (PRICE_ESTIMATES[sub]) { estimate = PRICE_ESTIMATES[sub]; break; }
  }

  const formatNum = (n) => n.toLocaleString('fa-IR');

  return (
    <div className="bg-[rgba(245,197,24,0.06)] border border-border-accent rounded-lg p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">💡</span>
        <span className="text-[0.85rem] font-bold text-accent-yellow">تخمین اولیه قیمت</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="grad-text text-[1.6rem] font-black">{estimate.label}</span>
      </div>
      <p className="text-[0.75rem] text-text-muted mt-2 leading-[1.7]">
        این تخمین بر اساس پروژه‌های مشابه است. قیمت نهایی پس از بررسی جزئیات کامل مشخص می‌شود.
      </p>
    </div>
  );
}

// ─── File Uploader ────────────────────────────────────────────────────────────
function FileUploader({ files, setFiles }) {
  const inputRef = useRef(null);

  const handleFiles = (incoming) => {
    const arr = Array.from(incoming).filter(f => f.size < 10 * 1024 * 1024);
    setFiles(prev => [...prev, ...arr].slice(0, 5));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div>
      <div onDrop={handleDrop} onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-border-default rounded-lg p-8 text-center cursor-pointer transition-all duration-300 hover:border-border-accent hover:bg-[rgba(245,197,24,0.03)]">
        <div className="text-3xl mb-3">📎</div>
        <p className="text-[0.9rem] text-text-secondary font-semibold">فایل‌ها را اینجا رها کنید</p>
        <p className="text-[0.78rem] text-text-muted mt-1">یا کلیک کنید · حداکثر ۵ فایل · هر فایل تا ۱۰ مگابایت</p>
        <p className="text-[0.72rem] text-text-muted mt-1">PNG, JPG, PDF, ZIP, Figma, XD, PSD ...</p>
      </div>
      <input ref={inputRef} type="file" multiple accept="image/*,.pdf,.zip,.fig,.xd,.psd,.ai,.sketch"
        className="hidden" onChange={e => handleFiles(e.target.files)} />
      {files.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center justify-between bg-bg-surface rounded-md px-4 py-2.5">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-base">📄</span>
                <span className="text-[0.82rem] text-text-secondary truncate">{f.name}</span>
                <span className="text-[0.72rem] text-text-muted flex-shrink-0">({(f.size / 1024).toFixed(0)} KB)</span>
              </div>
              <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
                className="text-text-muted hover:text-accent-orange transition-colors bg-transparent border-none cursor-pointer text-base">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OrderPage() {
  const [step, setStep] = useState(0); // 0=category, 1=details, 2=contact, 3=done
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubtypes, setSelectedSubtypes] = useState([]);
  const [selectedBudget, setSelectedBudget]   = useState('');
  const [selectedTimeline, setSelectedTimeline] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles]   = useState([]);
  const [name, setName]     = useState('');
  const [phone, setPhone]   = useState('');
  const [email, setEmail]   = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});

  const currentCat = ORDER_CATEGORIES.find(c => c.id === selectedCategory);

  const toggleSubtype = (id) => {
    setSelectedSubtypes(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const validateStep = () => {
    if (step === 0) {
      if (!selectedCategory) { setErrors({ category: 'لطفاً یک دسته‌بندی انتخاب کنید.' }); return false; }
    }
    if (step === 1) {
      if (!selectedBudget) { setErrors({ budget: 'لطفاً بازه بودجه را مشخص کنید.' }); return false; }
    }
    if (step === 2) {
      const e = {};
      if (!name.trim()) e.name = 'نام الزامی است.';
      if (!phone.trim() && !email.trim()) e.contact = 'شماره تماس یا ایمیل الزامی است.';
      if (Object.keys(e).length) { setErrors(e); return false; }
    }
    setErrors({});
    return true;
  };

  const handleNext = () => { if (validateStep()) setStep(s => s + 1); };
  const handleBack = () => { setErrors({}); setStep(s => s - 1); };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('phone', phone);
      formData.append('email', email);
      formData.append('companyName', companyName);
      formData.append('projectCategory', selectedCategory);
      formData.append('projectSubtypes', JSON.stringify(selectedSubtypes));
      formData.append('budget', selectedBudget);
      formData.append('timeline', selectedTimeline);
      formData.append('description', description);
      formData.append('source', 'order-page');
      files.forEach(f => formData.append('attachments', f));

      await projectApi.submit(formData);
      setStep(3);
    } catch (err) {
      setErrors({ submit: err.message || 'خطا در ارسال. لطفاً دوباره تلاش کنید.' });
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 0: Category ────────────────────────────────────────────────────
  const StepCategory = () => (
    <div>
      <h2 className="text-[1.6rem] font-black text-text-primary mb-2">چه نوع پروژه‌ای دارید؟</h2>
      <p className="text-text-secondary mb-8">دسته‌بندی اصلی کارتان را انتخاب کنید. می‌توانید چندین حوزه داشته باشید.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {ORDER_CATEGORIES.map(cat => (
          <CategoryCard key={cat.id} cat={cat} selected={selectedCategory === cat.id} onClick={setSelectedCategory} />
        ))}
      </div>
      {errors.category && <p className="text-accent-orange text-[0.82rem] mb-4">{errors.category}</p>}

      {currentCat && (
        <div className="mt-6">
          <p className="text-[0.85rem] text-text-muted mb-3">زیردسته‌های مرتبط (اختیاری):</p>
          <div className="flex flex-wrap gap-2">
            {currentCat.subtypes.map(sub => (
              <SubtypePill key={sub.id} item={sub} selected={selectedSubtypes.includes(sub.id)} onClick={toggleSubtype} />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ─── Step 1: Details ─────────────────────────────────────────────────────
  const StepDetails = () => (
    <div>
      <h2 className="text-[1.6rem] font-black text-text-primary mb-2">جزئیات پروژه</h2>
      <p className="text-text-secondary mb-8">هرچه بیشتر بنویسید، تخمین دقیق‌تری می‌گیرید.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Budget */}
        <div>
          <label className="block text-[0.85rem] font-bold text-text-primary mb-3">بازه بودجه تقریبی</label>
          <div className="flex flex-col gap-2">
            {BUDGET_OPTIONS.map(b => (
              <button key={b.id} onClick={() => setSelectedBudget(b.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-[0.85rem] font-semibold transition-all duration-200 cursor-pointer text-right
                  ${selectedBudget === b.id ? 'border-accent-yellow bg-[rgba(245,197,24,0.08)] text-accent-yellow' : 'border-border-default bg-bg-surface text-text-secondary hover:border-border-accent'}`}>
                <span>{b.icon}</span>
                <span>{b.label}</span>
                {selectedBudget === b.id && <span className="mr-auto text-[0.75rem]">✓</span>}
              </button>
            ))}
          </div>
          {errors.budget && <p className="text-accent-orange text-[0.82rem] mt-2">{errors.budget}</p>}
        </div>

        {/* Timeline */}
        <div>
          <label className="block text-[0.85rem] font-bold text-text-primary mb-3">زمانبندی مورد نظر</label>
          <div className="flex flex-col gap-2">
            {TIMELINE_OPTIONS.map(t => (
              <button key={t.id} onClick={() => setSelectedTimeline(t.id)}
                className={`flex items-center justify-between px-4 py-3 rounded-lg border text-[0.85rem] font-semibold transition-all duration-200 cursor-pointer text-right
                  ${selectedTimeline === t.id ? 'border-accent-yellow bg-[rgba(245,197,24,0.08)] text-accent-yellow' : 'border-border-default bg-bg-surface text-text-secondary hover:border-border-accent'}`}>
                <span>{t.label}</span>
                {selectedTimeline === t.id && <span className="text-[0.75rem]">✓</span>}
              </button>
            ))}
          </div>

          {/* Price Estimator */}
          {(selectedCategory || selectedSubtypes.length > 0) && (
            <div className="mt-4">
              <PriceEstimator selectedCategory={selectedCategory} selectedSubtypes={selectedSubtypes} budget={selectedBudget} />
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="mb-6">
        <label className="block text-[0.85rem] font-bold text-text-primary mb-3">توضیحات پروژه</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)}
          placeholder="هرچه بیشتر درباره پروژه‌تان بنویسید: چه می‌خواهید؟ چه مشکلی را حل می‌کند؟ رقبا یا نمونه‌هایی که دوست دارید؟ ویژگی‌های ضروری؟"
          dir="rtl" rows={5}
          className="w-full bg-bg-surface border border-border-default rounded-lg px-4 py-3.5 text-[0.9rem] font-vazir text-text-primary outline-none resize-none transition-all duration-300 focus:border-accent-yellow focus:bg-[rgba(245,197,24,0.03)] placeholder:text-text-muted" />
      </div>

      {/* File Upload */}
      <div>
        <label className="block text-[0.85rem] font-bold text-text-primary mb-3">
          فایل‌های مرجع <span className="text-text-muted font-normal">(اختیاری)</span>
        </label>
        <p className="text-[0.78rem] text-text-muted mb-3">اگر برف مرجع، لوگو، رنگ‌بندی، وایرفریم یا هر چیز مرتبطی دارید آپلود کنید.</p>
        <FileUploader files={files} setFiles={setFiles} />
      </div>
    </div>
  );

  // ─── Step 2: Contact ──────────────────────────────────────────────────────
  const StepContact = () => (
    <div>
      <h2 className="text-[1.6rem] font-black text-text-primary mb-2">اطلاعات تماس</h2>
      <p className="text-text-secondary mb-8">چگونه با شما در ارتباط باشیم؟</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <div>
          <label className="block text-[0.82rem] font-bold text-text-primary mb-2">نام و نام خانوادگی <span className="text-accent-orange">*</span></label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="علی محمدی"
            dir="rtl" className="w-full bg-bg-surface border border-border-default rounded-lg px-4 py-3.5 text-[0.9rem] font-vazir text-text-primary outline-none transition-all duration-300 focus:border-accent-yellow" />
          {errors.name && <p className="text-accent-orange text-[0.78rem] mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-[0.82rem] font-bold text-text-primary mb-2">نام شرکت / برند <span className="text-text-muted font-normal">(اختیاری)</span></label>
          <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="شرکت ..."
            dir="rtl" className="w-full bg-bg-surface border border-border-default rounded-lg px-4 py-3.5 text-[0.9rem] font-vazir text-text-primary outline-none transition-all duration-300 focus:border-accent-yellow" />
        </div>

        <div>
          <label className="block text-[0.82rem] font-bold text-text-primary mb-2">شماره تماس <span className="text-accent-orange">*</span></label>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="09123456789"
            dir="ltr" type="tel" className="w-full bg-bg-surface border border-border-default rounded-lg px-4 py-3.5 text-[0.9rem] font-vazir text-text-primary outline-none transition-all duration-300 focus:border-accent-yellow" />
        </div>

        <div>
          <label className="block text-[0.82rem] font-bold text-text-primary mb-2">ایمیل</label>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
            dir="ltr" type="email" className="w-full bg-bg-surface border border-border-default rounded-lg px-4 py-3.5 text-[0.9rem] font-vazir text-text-primary outline-none transition-all duration-300 focus:border-accent-yellow" />
        </div>
      </div>

      {errors.contact && <p className="text-accent-orange text-[0.82rem] mb-4">{errors.contact}</p>}

      {/* Summary */}
      <div className="bg-bg-surface border border-border-default rounded-lg p-5 mb-6">
        <h4 className="text-[0.85rem] font-black text-text-primary mb-4">خلاصه سفارش شما</h4>
        <div className="flex flex-col gap-2.5 text-[0.82rem]">
          {selectedCategory && (
            <div className="flex justify-between">
              <span className="text-text-muted">نوع پروژه:</span>
              <span className="text-text-primary font-semibold">
                {ORDER_CATEGORIES.find(c => c.id === selectedCategory)?.label}
              </span>
            </div>
          )}
          {selectedSubtypes.length > 0 && (
            <div className="flex justify-between items-start gap-4">
              <span className="text-text-muted flex-shrink-0">جزئیات:</span>
              <span className="text-text-primary font-semibold text-left">
                {selectedSubtypes.map(sid => {
                  const cat = ORDER_CATEGORIES.find(c => c.id === selectedCategory);
                  return cat?.subtypes.find(s => s.id === sid)?.label;
                }).filter(Boolean).join(' · ')}
              </span>
            </div>
          )}
          {selectedBudget && (
            <div className="flex justify-between">
              <span className="text-text-muted">بودجه:</span>
              <span className="text-accent-yellow font-bold">{BUDGET_OPTIONS.find(b => b.id === selectedBudget)?.label}</span>
            </div>
          )}
          {selectedTimeline && (
            <div className="flex justify-between">
              <span className="text-text-muted">زمانبندی:</span>
              <span className="text-text-primary font-semibold">{TIMELINE_OPTIONS.find(t => t.id === selectedTimeline)?.label}</span>
            </div>
          )}
          {files.length > 0 && (
            <div className="flex justify-between">
              <span className="text-text-muted">فایل‌های ضمیمه:</span>
              <span className="text-text-primary font-semibold">{files.length} فایل</span>
            </div>
          )}
        </div>
        {/* Price estimate in summary */}
        {selectedSubtypes.length > 0 || selectedCategory ? (
          <div className="mt-4 pt-4 border-t border-border-default">
            <PriceEstimator selectedCategory={selectedCategory} selectedSubtypes={selectedSubtypes} />
          </div>
        ) : null}
      </div>

      {errors.submit && (
        <div className="bg-[rgba(255,107,53,0.1)] border border-accent-orange/30 rounded-lg p-4 mb-4">
          <p className="text-accent-orange text-[0.85rem]">{errors.submit}</p>
        </div>
      )}

      <p className="text-[0.78rem] text-text-muted">
        با ثبت سفارش، با <a href="#" className="text-accent-yellow no-underline hover:underline">شرایط استفاده</a> و <a href="#" className="text-accent-yellow no-underline hover:underline">حریم خصوصی</a> تیزاین موافقت می‌کنید.
      </p>
    </div>
  );

  // ─── Step 3: Done ─────────────────────────────────────────────────────────
  const StepDone = () => (
    <div className="text-center py-10">
      <div className="w-20 h-20 rounded-full bg-[rgba(40,200,64,0.15)] border-2 border-[#28C840] grid place-items-center text-4xl mx-auto mb-6 animate-fade-in">
        ✓
      </div>
      <h2 className="text-[2rem] font-black text-text-primary mb-3 animate-fade-up">سفارش ثبت شد!</h2>
      <p className="text-text-secondary max-w-[420px] mx-auto mb-8 leading-[1.8] animate-fade-up-1">
        ممنون {name ? `${name} عزیز` : ''}! سفارش شما دریافت شد. تیم تیزاین ظرف <strong className="text-accent-yellow">۲۴ ساعت</strong> با شما تماس می‌گیرد.
      </p>
      <div className="flex flex-wrap justify-center gap-4 animate-fade-up-2">
        <Button href="/" onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/'); window.dispatchEvent(new PopStateEvent('popstate')); window.scrollTo({ top: 0 }); }} variant="primary">
          بازگشت به خانه <ArrowIcon />
        </Button>
        <Button href="/shop" onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/shop'); window.dispatchEvent(new PopStateEvent('popstate')); window.scrollTo({ top: 0 }); }} variant="outline">
          مشاهده فروشگاه
        </Button>
      </div>
    </div>
  );

  const steps = ['نوع پروژه', 'جزئیات', 'اطلاعات تماس'];

  return (
    <div className="min-h-screen pt-[72px]">
      {/* Hero top */}
      <div className="relative bg-bg-surface border-b border-border-default py-14 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-[400px] h-[400px] -top-[100px] -right-[60px] bg-[rgba(245,197,24,0.07)] blur-[80px]" />
          <div className="hero-grid-bg absolute inset-0" />
        </div>
        <div className="relative z-[2] w-full max-w-[1200px] mx-auto px-6 text-center">
          <SectionLabel className="justify-center">ثبت سفارش</SectionLabel>
          <h1 className="text-[clamp(2rem,4vw,3rem)] font-black mb-3 leading-[1.3]">
            پروژه‌تان را با <span className="grad-text">تیزاین</span> شروع کنید
          </h1>
          <p className="text-text-secondary max-w-[520px] mx-auto">
            فرم را پر کنید، یک تخمین قیمت بگیرید و ظرف ۲۴ ساعت پاسخ دریافت کنید.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="w-full max-w-[860px] mx-auto px-6 py-16">
        {step < 3 && <StepBar current={step} total={3} />}

        <div className="bg-bg-card border border-border-default rounded-xl p-8 md:p-10">
          {step === 0 && <StepCategory />}
          {step === 1 && <StepDetails />}
          {step === 2 && <StepContact />}
          {step === 3 && <StepDone />}

          {step < 3 && (
            <div className="flex items-center justify-between mt-10 pt-6 border-t border-border-default">
              <div>
                {step > 0 && (
                  <button onClick={handleBack}
                    className="flex items-center gap-2 text-text-muted text-[0.85rem] font-semibold hover:text-text-primary transition-colors bg-transparent border-none cursor-pointer">
                    → مرحله قبل
                  </button>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[0.78rem] text-text-muted">مرحله {step + 1} از {steps.length}</span>
                {step < 2 ? (
                  <Button variant="primary" onClick={handleNext}>
                    مرحله بعد <ArrowIcon />
                  </Button>
                ) : (
                  <Button variant="primary" onClick={handleSubmit} disabled={loading}>
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-[#111]/30 border-t-[#111] rounded-full animate-spin" />
                        در حال ارسال...
                      </span>
                    ) : (<>ثبت نهایی سفارش <ArrowIcon /></>)}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Trust badges */}
        {step < 3 && (
          <div className="flex flex-wrap justify-center gap-6 mt-8 text-[0.78rem] text-text-muted">
            {[['🔒', 'اطلاعات شما محرمانه است'], ['⚡', 'پاسخ در کمتر از ۲۴ ساعت'], ['💬', 'مشاوره رایگان'], ['✓', 'بدون تعهد اولیه']].map(([icon, text]) => (
              <div key={text} className="flex items-center gap-1.5">
                <span>{icon}</span><span>{text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}