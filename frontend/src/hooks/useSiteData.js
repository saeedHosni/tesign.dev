// src/hooks/useSiteData.js
import { useState, useEffect } from 'react';
import { settingsApi } from '../services/api';
import { TICKER_ITEMS, HERO_STATS, SERVICES, PRODUCTS } from '../data/siteData';

const FALLBACK = {
  ticker:   TICKER_ITEMS,
  stats:    HERO_STATS,
  services: SERVICES,
  featuredProducts: PRODUCTS.filter((_, i) => i < 4),
};

export function useSiteData() {
  const [data, setData]     = useState(FALLBACK);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    settingsApi.getPublic()
      .then((res) => {
        if (cancelled) return;
        // Backend wraps response in { success: true, data: { ... } }
        const d = res?.data || res;
        if (d && (d.ticker || d.stats || d.services || d.featuredProducts)) {
          setData({
            ticker:           d.ticker || FALLBACK.ticker,
            stats:            d.stats  || FALLBACK.stats,
            services:         d.services || FALLBACK.services,
            featuredProducts: d.featuredProducts || FALLBACK.featuredProducts,
          });
        }
      })
      .catch(() => { /* silently use fallback */ })
      .finally(() => { if (!cancelled) setLoaded(true); });

    return () => { cancelled = true; };
  }, []);

  return { ...data, loaded };
}
