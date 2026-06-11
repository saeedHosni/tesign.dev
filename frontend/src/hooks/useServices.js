// src/hooks/useServices.js
import { useState, useEffect } from 'react';
import { serviceApi } from '../services/api';
import { SERVICES as FALLBACK_SERVICES } from '../data/siteData';

export function useServices() {
  const [services, setServices] = useState(FALLBACK_SERVICES);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let cancelled = false;

    serviceApi.getAll()
      .then((res) => {
        if (cancelled) return;
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          const normalized = res.data.map((s, i) => ({
            id:        s.id,
            icon:      s.icon || '🌐',
            cat:       s.category || `دسته ${i + 1}`,
            title:     s.title,
            desc:      s.description,
            items:     (s.features || []).map((f) => f.title || f.label || f),
            linkLabel: s.linkLabel || 'مشاوره رایگان',
            price:     s.price || null,
            delay:     i > 0 ? `reveal-delay-${i}` : '',
            slug:      s.slug,
          }));
          setServices(normalized);
        }
        // else: keep FALLBACK_SERVICES already set
      })
      .catch(() => {
        // Keep fallback — already set in useState
        if (!cancelled) setError(null); // silent fail
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return { services, loading, error };
}
