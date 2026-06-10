// src/components/sections/Ticker.jsx
import { TICKER_ITEMS } from '../../data/siteData';
const items = [...TICKER_ITEMS, ...TICKER_ITEMS];

export default function Ticker() {
  return (
    <div className="overflow-hidden bg-[rgba(245,197,24,0.06)] border-t border-border-accent border-b py-3.5">
      <div className="flex gap-0 animate-marquee w-max">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3 px-8 text-[0.85rem] font-semibold text-text-secondary whitespace-nowrap">
            <span className="w-[5px] h-[5px] rounded-full bg-accent-yellow inline-block" />
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
