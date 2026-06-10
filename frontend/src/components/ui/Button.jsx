// src/components/ui/Button.jsx
export default function Button({ variant = 'primary', href, onClick, children, className = '', disabled = false, type = 'button' }) {
  const base =
    'inline-flex items-center gap-2 px-7 py-[13px] rounded-md text-[0.95rem] font-bold font-vazir transition-all duration-300 ease-[cubic-bezier(.4,0,.2,1)] cursor-pointer no-underline relative overflow-hidden border-none';

  const variants = {
    primary:
      'grad-bg text-[#111] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(245,197,24,0.35)]',
    outline:
      'bg-transparent text-text-primary border border-border-accent hover:bg-[rgba(245,197,24,0.08)] hover:border-accent-yellow hover:-translate-y-0.5',
    ghost:
      'bg-white/5 text-text-primary border border-border-default hover:bg-white/10 hover:-translate-y-0.5',
  };

  const cls = `${base} ${variants[variant]} ${className}`;

  if (href) {
    return (
      <a href={href} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}
