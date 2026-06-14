// src/hooks/useServices.js
import { useState, useEffect } from 'react';
import { serviceApi } from '../services/api';
import { SERVICES as FALLBACK_SERVICES } from '../data/siteData';

// نرمال‌سازی یک سرویس از بک‌اند به فرمت مورد انتظار کامپوننت‌ها
export function normalizeService(s, i) {
  return {
    id:        s.id,
    slug:      s.slug,
    icon:      s.icon || '🌐',
    cat:       s.category || `دسته ${i + 1}`,
    title:     s.title,
    desc:      s.description,
    items:     (s.features || []).map((f) => f.label || f.title || f),
    linkText:  s.linkText  || s.linkLabel || 'مشاوره رایگان',
    linkLabel: s.linkText  || s.linkLabel || 'مشاوره رایگان', // سازگاری با کد قدیمی
    price:     s.price  || null,
    isActive:  s.isActive  ?? true,
    sortOrder: s.sortOrder ?? i,
    delay:     i > 0 ? i : 0,
  };
}

// هوک عمومی — فقط سرویس‌های فعال (برای صفحه اصلی)
export function useServices() {
  const [services, setServices] = useState(FALLBACK_SERVICES);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    let cancelled = false;

    serviceApi.getAll()
      .then((res) => {
        if (cancelled) return;
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setServices(res.data.map(normalizeService));
        }
        // else: fallback باقی می‌ماند
      })
      .catch(() => {
        // silent fail — fallback نمایش داده می‌شود
        if (!cancelled) setError(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return { services, loading, error };
}

// هوک ادمین — همه سرویس‌ها (فعال + غیرفعال)
export function useAdminServices() {
  const [services, setServices] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await serviceApi.getAllAdmin();
      setServices(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return { services, loading, error, reload: load };
}
