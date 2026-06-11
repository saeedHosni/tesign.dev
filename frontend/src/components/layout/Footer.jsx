// src/components/layout/Footer.jsx
import Logo from '../ui/Logo';
import { FOOTER_SERVICES, FOOTER_SHOP, FOOTER_COMPANY } from '../../data/siteData';

function SocialBtn({ href, label, children }) {
  return (
    <a href={href} aria-label={label}
      className="w-9 h-9 rounded-[10px] bg-white/5 border border-border-default grid place-items-center text-text-secondary no-underline transition-all duration-300 hover:bg-[rgba(245,197,24,0.12)] hover:border-border-accent hover:text-accent-yellow hover:-translate-y-0.5">
      {children}
    </a>
  );
}

function FooterLinkCol({ title, links }) {
  const handleNav = (e, href) => {
    if (href.startsWith('/')) {
      e.preventDefault();
      window.history.pushState({}, '', href);
      window.dispatchEvent(new PopStateEvent('popstate'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  return (
    <div>
      <h4 className="text-[0.85rem] font-black text-text-primary mb-[18px] tracking-[0.04em]">{title}</h4>
      <ul className="flex flex-col gap-2.5 p-0 list-none m-0">
        {links.map(link => (
          <li key={link.label}>
            <a href={link.href} onClick={(e) => handleNav(e, link.href)}
              className="footer-link text-[0.83rem] text-text-muted no-underline transition-all duration-300 inline-flex items-center hover:text-accent-yellow hover:pr-1">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer id="about" className="bg-bg-surface border-t border-border-default pt-[72px] pb-10">
      <div className="w-full max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-8 md:gap-10 lg:gap-12 mb-14">
          <div>
            <div className="mb-4"><Logo /></div>
            <p className="text-[0.85rem] text-text-muted leading-[1.8] max-w-[260px]">
              تیمی از متخصصان طراحی و توسعه که با اشتیاق برای ساخت تجربه‌های دیجیتال ماندگار تلاش می‌کنند.
            </p>
            <div className="flex gap-2.5 mt-5">
              <SocialBtn href="https://instagram.com/tesign.dev" label="اینستاگرام">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </SocialBtn>
              <SocialBtn href="https://t.me/tesign_dev" label="تلگرام">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              </SocialBtn>
              <SocialBtn href="https://linkedin.com/company/tesign" label="لینکدین">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
              </SocialBtn>
            </div>
            <div className="mt-5 flex flex-col gap-1">
              <a href="https://tesign.team" className="text-[0.78rem] text-accent-yellow/70 hover:text-accent-yellow transition-colors no-underline">🌐 tesign.team</a>
            </div>
          </div>
          <FooterLinkCol title="خدمات"   links={FOOTER_SERVICES} />
          <FooterLinkCol title="فروشگاه" links={FOOTER_SHOP} />
          <FooterLinkCol title="شرکت"    links={FOOTER_COMPANY} />
        </div>

        <div className="border-t border-border-default pt-7 flex flex-col lg:flex-row items-center justify-between gap-4 text-center lg:text-start">
          <div className="text-[0.78rem] text-text-muted">© ۱۴۰۴ تیزاین (tesign) · تمامی حقوق محفوظ است.</div>
          <div className="flex gap-5">
            {['حریم خصوصی', 'شرایط استفاده', 'نقشه سایت'].map(item => (
              <a key={item} href="#" className="text-[0.78rem] text-text-muted no-underline transition-colors duration-300 hover:text-accent-yellow">{item}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}