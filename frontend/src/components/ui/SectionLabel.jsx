// src/components/ui/SectionLabel.jsx
export default function SectionLabel({ children, className = '' }) {
  return (
    <div className={`section-label-line inline-flex items-center gap-2 text-[0.78rem] font-bold tracking-[0.12em] text-accent-yellow uppercase mb-4 ${className}`}>
      {children}
    </div>
  );
}
