// src/components/ui/Logo.jsx
export default function Logo({ href = '/' }) {
  return (
    <a href={href} className="flex items-center gap-2.5 font-black text-[1.3rem] tracking-tight no-underline text-text-primary">
      <div className="w-9 h-9 grad-bg rounded-[10px] grid place-items-center text-base font-black text-[#111] animate-pulse-glow">
        T
      </div>
      <span className="text-text-primary">
        te<span className="text-accent-yellow">sign</span>
      </span>
    </a>
  );
}