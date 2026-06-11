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
        if (res && (res.ticker || res.stats || res.services || res.featuredProducts)) {
          setData({
            ticker:           res.ticker || FALLBACK.ticker,
            stats:            res.stats  || FALLBACK.stats,
            services:         res.services || FALLBACK.services,
            featuredProducts: res.featuredProducts || FALLBACK.featuredProducts,
          });
        }
      })
      .catch(() => { /* silently use fallback */ })
      .finally(() => { if (!cancelled) setLoaded(true); });

    return () => { cancelled = true; };
  }, []);

  return { ...data, loaded };
}
